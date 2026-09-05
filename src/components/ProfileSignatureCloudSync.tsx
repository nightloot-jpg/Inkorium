import { useEffect, useRef, useCallback } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { subscribeCrossTabEvents } from '../lib/chatHistory';
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

export function ProfileSignatureCloudSync() {
  const { currentUser, selectedUserId, wallComments, refreshWallComments } = useInkorium();
  const isSyncingRef = useRef(false);
  const wallCommentsRef = useRef(wallComments);
  wallCommentsRef.current = wallComments;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // Track real-time events triggered by signature updates
  useEffect(() => {
    console.log('[ProfileSignatureCloudSync] Initialized. Monitoring signatures for current user:', {
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.full_name || currentUser.nombre
    });

    const handleSignatureUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; comment?: WallComment; raw?: any; id?: string; profileId?: string }>;
      console.log('[ProfileSignatureCloudSync] [Realtime Event] "inkorium:signature_update" received:', {
        eventType: customEvent.detail?.type,
        commentId: customEvent.detail?.comment?.id || customEvent.detail?.id,
        targetProfile: customEvent.detail?.comment?.propietarioId || customEvent.detail?.profileId,
        author: customEvent.detail?.comment?.autorNombre || customEvent.detail?.comment?.autorId,
        timestamp: new Date().toISOString()
      });

      // If a signature was posted locally or received, trigger a sync/verification
      if (customEvent.detail?.type === 'WALL_COMMENT_POSTED' || customEvent.detail?.type === 'WALL_COMMENT_REALTIME') {
        void syncPendingSignatures();
      }
    };

    // Cross-tab events listener for wall comments
    const unsubscribeCrossTab = subscribeCrossTabEvents((event) => {
      if (event.type === 'WALL_COMMENT') {
        console.log('[ProfileSignatureCloudSync] [CrossTab Event] "WALL_COMMENT" detected across browser tabs:', {
          commentId: event.payload?.comment?.id,
          targetProfile: event.payload?.comment?.propietarioId,
          author: event.payload?.comment?.autorNombre,
          timestamp: new Date().toISOString()
        });
        void syncPendingSignatures();
      }
    });

    window.addEventListener('inkorium:signature_update', handleSignatureUpdate);

    return () => {
      window.removeEventListener('inkorium:signature_update', handleSignatureUpdate);
      unsubscribeCrossTab();
    };
  }, [currentUser.id, currentUser.username]);

  // Sync function that checks local in-memory & localStorage signatures against cloud backend
  const syncPendingSignatures = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user.id) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. Gather all local comments from both in-memory state and localStorage
      const memoryComments = wallCommentsRef.current || [];
      const storageComments = readWallComments();

      // Merge by ID to get the complete unified set
      const localMap = new Map<string, WallComment>();
      for (const c of storageComments) {
        if (c && c.id) localMap.set(String(c.id), c);
      }
      for (const c of memoryComments) {
        if (c && c.id) localMap.set(String(c.id), c);
      }
      const localComments = Array.from(localMap.values());

      // 2. Identify signatures authored by the current user
      const curIdNorm = normalizeId(user.id);
      const curUserNorm = normalizeId(user.username);

      const isAuthoredByCurrentUser = (c: WallComment) => {
        const authorNorm = normalizeId(c.autorId || c.emisorId);
        return authorNorm === curIdNorm || (curUserNorm && authorNorm === curUserNorm);
      };

      const myAuthored = localComments.filter(comment =>
        isAuthoredByCurrentUser(comment) &&
        Boolean(comment.propietarioId || comment.receptorId) &&
        Boolean(String(comment.texto || comment.comentario || '').trim())
      );

      console.log('[ProfileSignatureCloudSync] Sync verification check:', {
        totalLocalSignatures: localComments.length,
        authoredByCurrentUser: myAuthored.length,
        currentUserId: user.id
      });

      if (myAuthored.length === 0) {
        isSyncingRef.current = false;
        return;
      }

      // 3. Fetch current remote signatures from cloud backend
      console.log('[ProfileSignatureCloudSync] Querying /api/profile-signatures to compare local vs cloud...');
      const res = await fetch('/api/profile-signatures');
      if (!res.ok) {
        console.warn('[ProfileSignatureCloudSync] Warning: /api/profile-signatures responded with status:', res.status);
        isSyncingRef.current = false;
        return;
      }
      const existing: any[] = await res.json();
      const existingRows = Array.isArray(existing) ? existing : [];
      const existingIds = new Set(existingRows.map(r => String(r.id)));

      console.log('[ProfileSignatureCloudSync] Cloud backend reports existing signatures count:', existingRows.length);

      // 4. Identify local signatures missing on the backend
      const pendingUploads: WallComment[] = [];
      for (const sig of myAuthored) {
        const targetId = String(sig.propietarioId || sig.receptorId);
        const content = String(sig.texto || sig.comentario || '').trim();

        const alreadyExistsOnCloud = existingIds.has(sig.id) || existingRows.some(row =>
          normalizeId(row.profile_id) === normalizeId(targetId) &&
          normalizeId(row.author_id) === curIdNorm &&
          String(row.content || row.texto).trim() === content
        );

        if (!alreadyExistsOnCloud) {
          pendingUploads.push(sig);
        }
      }

      if (pendingUploads.length === 0) {
        console.log('[ProfileSignatureCloudSync] All local authored signatures are synchronized with cloud backend.');
        isSyncingRef.current = false;
        return;
      }

      console.log(`[ProfileSignatureCloudSync] Found ${pendingUploads.length} pending signature(s) to upload to cloud backend.`);

      // 5. Upload pending signatures
      for (const sig of pendingUploads) {
        const targetId = String(sig.propietarioId || sig.receptorId);
        const content = String(sig.texto || sig.comentario || '').trim();
        const payload = {
          id: sig.id,
          profile_id: targetId,
          author_id: user.id,
          author_name: sig.autorNombre || sig.emisorNombre || user.full_name || user.nombre || 'Usuario',
          author_avatar: sig.autorAvatar || sig.emisorAvatar || user.avatar || '',
          content: content,
          created_at: new Date().toISOString()
        };

        console.log('[ProfileSignatureCloudSync] Uploading missing signature to cloud:', {
          id: sig.id,
          targetProfile: targetId,
          authorName: payload.author_name,
          contentSnippet: content.slice(0, 40)
        });

        try {
          const uploadRes = await fetch('/api/profile-signatures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (uploadRes.ok) {
            console.log(`[ProfileSignatureCloudSync] Successfully synchronized signature "${sig.id}" to cloud backend!`);
          } else {
            console.warn(`[ProfileSignatureCloudSync] Backend rejected signature "${sig.id}" with status:`, uploadRes.status);
          }
        } catch (postErr) {
          console.warn(`[ProfileSignatureCloudSync] Network failure uploading signature "${sig.id}":`, postErr);
        }
      }
    } catch (err) {
      console.warn('[ProfileSignatureCloudSync] Unexpected sync error:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // React immediately whenever wallComments state changes in InkoriumContext
  useEffect(() => {
    if (!currentUser.id) return;
    const timeout = setTimeout(() => {
      void syncPendingSignatures();
    }, 250);
    return () => clearTimeout(timeout);
  }, [wallComments, currentUser.id, syncPendingSignatures]);

  // Periodic background check every 30 seconds
  useEffect(() => {
    if (!currentUser.id) return;
    void syncPendingSignatures();
    const interval = window.setInterval(() => void syncPendingSignatures(), 30000);
    return () => window.clearInterval(interval);
  }, [currentUser.id, syncPendingSignatures]);

  // Pull latest signatures for current selected user or logged-in user
  useEffect(() => {
    const target = selectedUserId || currentUser.id;
    if (target) {
      console.log('[ProfileSignatureCloudSync] Fetching latest cloud signatures for active profile view:', target);
      void refreshWallComments(target);
    }
  }, [selectedUserId, currentUser.id, refreshWallComments]);

  return null;
}
