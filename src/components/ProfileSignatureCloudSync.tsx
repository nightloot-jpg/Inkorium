import { useEffect, useRef, useCallback } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { subscribeCrossTabEvents } from '../lib/chatHistory';
import { supabase } from '../lib/supabase';
import type { WallComment } from '../types';

const WALL_KEY = 'inkorium:wall_comments';
const normalizeId = (value?: string | null) => String(value ?? '').trim().toLowerCase().replace(/^user-/, '');

function readWallComments(): WallComment[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(WALL_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToWallComment(row: any): WallComment {
  const profileId = String(row.profile_id || '');
  const authorId = String(row.author_id || '');
  const content = String(row.content || '').trim();
  return {
    id: String(row.id),
    propietarioId: profileId,
    receptorId: profileId,
    autorId: authorId,
    emisorId: authorId,
    autorNombre: String(row.author_name || 'Usuario'),
    emisorNombre: String(row.author_name || 'Usuario'),
    autorAvatar: String(row.author_avatar || ''),
    emisorAvatar: String(row.author_avatar || ''),
    texto: content,
    comentario: content,
    fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : 'Ahora mismo',
    likes: []
  };
}

export function ProfileSignatureCloudSync() {
  const { currentUser, selectedUserId, wallComments, refreshWallComments } = useInkorium();
  const isSyncingRef = useRef(false);
  const wallCommentsRef = useRef(wallComments);
  wallCommentsRef.current = wallComments;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const emitRows = useCallback((rows: any[]) => {
    for (const row of rows) {
      if (!row?.id || !row?.profile_id || !row?.content) continue;
      const comment = rowToWallComment(row);
      window.dispatchEvent(new CustomEvent('inkorium:signature_update', {
        detail: { type: 'WALL_COMMENT_REALTIME', comment, raw: row }
      }));
    }
  }, []);

  const syncPendingSignatures = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user.id || !supabase || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData.session?.user?.id;
      if (!sessionUserId) return;

      // 1. Read the real source of truth from Supabase for the profile currently being viewed.
      const target = selectedUserId || user.id;
      const { data: remoteRows, error: readError } = await supabase
        .from('profile_signatures')
        .select('id,profile_id,author_id,content,created_at')
        .eq('profile_id', target)
        .order('created_at', { ascending: true });

      if (!readError && Array.isArray(remoteRows)) {
        emitRows(remoteRows);
      } else if (readError) {
        console.warn('[ProfileSignatureCloudSync] Supabase read failed:', readError.message);
      }

      // 2. Recover locally-created signatures that have not reached Supabase yet.
      const memoryComments = wallCommentsRef.current || [];
      const storageComments = readWallComments();
      const localMap = new Map<string, WallComment>();
      for (const c of storageComments) if (c?.id) localMap.set(String(c.id), c);
      for (const c of memoryComments) if (c?.id) localMap.set(String(c.id), c);

      const pending = Array.from(localMap.values()).filter(comment => {
        const authorNorm = normalizeId(comment.autorId || comment.emisorId);
        const owner = String(comment.propietarioId || comment.receptorId || '').trim();
        const content = String(comment.texto || comment.comentario || '').trim();
        return authorNorm === normalizeId(sessionUserId) && Boolean(owner) && Boolean(content);
      });

      if (pending.length > 0) {
        const rows = pending.map(sig => ({
          id: String(sig.id),
          profile_id: String(sig.propietarioId || sig.receptorId),
          author_id: sessionUserId,
          content: String(sig.texto || sig.comentario || '').trim(),
          created_at: new Date().toISOString()
        }));

        const { error: upsertError } = await supabase
          .from('profile_signatures')
          .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

        if (upsertError) {
          console.warn('[ProfileSignatureCloudSync] Supabase signature upsert failed:', upsertError.message);
        }
      }

      // 3. Re-read after synchronization so every client sees the durable rows.
      const { data: refreshedRows, error: refreshedError } = await supabase
        .from('profile_signatures')
        .select('id,profile_id,author_id,content,created_at')
        .eq('profile_id', target)
        .order('created_at', { ascending: true });
      if (!refreshedError && Array.isArray(refreshedRows)) emitRows(refreshedRows);
    } catch (err) {
      console.warn('[ProfileSignatureCloudSync] Sync error:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [selectedUserId, emitRows]);

  useEffect(() => {
    const handleSignatureUpdate = () => { void syncPendingSignatures(); };
    const unsubscribeCrossTab = subscribeCrossTabEvents((event) => {
      if (event.type === 'WALL_COMMENT') void syncPendingSignatures();
    });
    window.addEventListener('inkorium:signature_update', handleSignatureUpdate);
    return () => {
      window.removeEventListener('inkorium:signature_update', handleSignatureUpdate);
      unsubscribeCrossTab();
    };
  }, [syncPendingSignatures]);

  useEffect(() => {
    if (!currentUser.id) return;
    const timeout = setTimeout(() => { void syncPendingSignatures(); }, 150);
    return () => clearTimeout(timeout);
  }, [wallComments, currentUser.id, syncPendingSignatures]);

  useEffect(() => {
    if (!currentUser.id) return;
    void syncPendingSignatures();
    const interval = window.setInterval(() => void syncPendingSignatures(), 30000);
    return () => window.clearInterval(interval);
  }, [currentUser.id, syncPendingSignatures]);

  useEffect(() => {
    const target = selectedUserId || currentUser.id;
    if (target) void refreshWallComments(target);
  }, [selectedUserId, currentUser.id, refreshWallComments]);

  return null;
}