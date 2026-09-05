import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useInkorium } from '../context/InkoriumContext';
import type { WallComment } from '../types';

const WALL_KEY = 'inkorium:wall_comments';
const SYNC_KEY = 'inkorium:profile-signatures-synced';
const PENDING_KEY = 'inkorium:pending-public-profile';

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

function writeWallComments(comments: WallComment[]) {
  try {
    localStorage.setItem(WALL_KEY, JSON.stringify(comments));
  } catch {}
}

function signatureKey(item: WallComment): string {
  return [
    normalizeId(item.propietarioId || item.receptorId),
    normalizeId(item.autorId || item.emisorId),
    String(item.texto || item.comentario || '').trim(),
  ].join('|');
}

export function ProfileSignatureCloudSync() {
  const { currentUser, users, selectedUserId } = useInkorium();
  const lastPullRef = useRef('');

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser.id) return;

    const syncLocalSignatures = async () => {
      const localComments = readWallComments();
      const mine = localComments.filter(comment =>
        normalizeId(comment.autorId || comment.emisorId) === normalizeId(currentUser.id) &&
        Boolean(comment.propietarioId || comment.receptorId) &&
        Boolean(String(comment.texto || comment.comentario || '').trim())
      );
      if (mine.length === 0) return;

      const { data: existingRows, error: existingError } = await supabase
        .from('profile_signatures')
        .select('profile_id,author_id,content')
        .eq('author_id', currentUser.id);

      if (existingError) return;

      const existing = new Set(
        (existingRows || []).map(row => [normalizeId(row.profile_id), normalizeId(row.author_id), String(row.content || '').trim()].join('|'))
      );

      const pending = mine
        .map(comment => ({
          profile_id: String(comment.propietarioId || comment.receptorId),
          author_id: currentUser.id,
          content: String(comment.texto || comment.comentario || '').trim()
        }))
        .filter(row => row.profile_id && row.content)
        .filter(row => !existing.has([normalizeId(row.profile_id), normalizeId(row.author_id), row.content].join('|')));

      if (pending.length === 0) return;

      await supabase.from('profile_signatures').insert(pending);
      try {
        localStorage.setItem(SYNC_KEY, new Date().toISOString());
      } catch {}
    };

    void syncLocalSignatures();
    const interval = window.setInterval(() => void syncLocalSignatures(), 20000);
    return () => window.clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !selectedUserId || normalizeId(selectedUserId) === normalizeId(currentUser.id)) return;

    const pullProfileSignatures = async () => {
      const profileId = String(selectedUserId);
      if (lastPullRef.current === profileId) return;
      lastPullRef.current = profileId;

      const { data: rows, error } = await supabase
        .from('profile_signatures')
        .select('id,profile_id,author_id,content,created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error || !Array.isArray(rows)) return;

      const localComments = readWallComments();
      const mapped = rows.map(row => {
        const author = users.find(user => normalizeId(user.id) === normalizeId(row.author_id));
        const authorName = author
          ? (author.full_name || `${author.nombre} ${author.apellidos}`.trim() || author.nombre)
          : 'Usuario';
        const authorAvatar = author?.avatar || '';
        const text = String(row.content || '').trim();
        return {
          id: `cloud-sig-${row.id}`,
          propietarioId: profileId,
          receptorId: profileId,
          autorId: String(row.author_id),
          emisorId: String(row.author_id),
          autorNombre: authorName,
          emisorNombre: authorName,
          autorAvatar: authorAvatar,
          emisorAvatar: authorAvatar,
          texto: text,
          comentario: text,
          fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : 'Recientemente',
          likes: []
        } as WallComment;
      }).filter(item => item.texto);

      const merged = [...mapped, ...localComments];
      const seen = new Set<string>();
      const deduped = merged.filter(item => {
        const key = item.id || signatureKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const oldSignature = localComments.map(signatureKey).sort().join('||');
      const newSignature = deduped.map(signatureKey).sort().join('||');
      if (oldSignature === newSignature) return;

      writeWallComments(deduped);
      try {
        localStorage.setItem(PENDING_KEY, profileId);
      } catch {}
      window.location.reload();
    };

    void pullProfileSignatures();
  }, [selectedUserId, currentUser.id, users]);

  return null;
}
