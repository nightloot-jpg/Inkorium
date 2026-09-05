import { useEffect, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
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
  const { currentUser, selectedUserId, refreshWallComments } = useInkorium();
  const isSyncingRef = useRef(false);

  // Sync local signatures up to cloud/disk backend so other users see them
  useEffect(() => {
    if (!currentUser.id) return;

    const syncPendingSignatures = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const localComments = readWallComments();
        const myAuthored = localComments.filter(comment =>
          normalizeId(comment.autorId || comment.emisorId) === normalizeId(currentUser.id) &&
          Boolean(comment.propietarioId || comment.receptorId) &&
          Boolean(String(comment.texto || comment.comentario || '').trim())
        );

        if (myAuthored.length === 0) {
          isSyncingRef.current = false;
          return;
        }

        // Fetch existing remote signatures
        const res = await fetch('/api/profile-signatures');
        if (!res.ok) {
          isSyncingRef.current = false;
          return;
        }
        const existing: any[] = await res.json();
        const existingIds = new Set((existing || []).map(r => String(r.id)));

        // Upload any signatures created locally that are not yet on backend
        for (const sig of myAuthored) {
          if (!existingIds.has(sig.id)) {
            const targetId = String(sig.propietarioId || sig.receptorId);
            const content = String(sig.texto || sig.comentario || '').trim();
            await fetch('/api/profile-signatures', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: sig.id,
                profile_id: targetId,
                author_id: currentUser.id,
                author_name: sig.autorNombre || sig.emisorNombre || currentUser.full_name || currentUser.nombre,
                author_avatar: sig.autorAvatar || sig.emisorAvatar || currentUser.avatar,
                content: content,
                created_at: new Date().toISOString()
              })
            }).catch(() => null);
          }
        }
      } catch (err) {
        console.warn('ProfileSignatureCloudSync error:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    void syncPendingSignatures();
    const interval = window.setInterval(() => void syncPendingSignatures(), 30000);
    return () => window.clearInterval(interval);
  }, [currentUser.id, currentUser.full_name, currentUser.nombre, currentUser.avatar]);

  // Pull latest signatures for current selected user or logged-in user
  useEffect(() => {
    if (selectedUserId) {
      void refreshWallComments(selectedUserId);
    } else if (currentUser.id) {
      void refreshWallComments(currentUser.id);
    }
  }, [selectedUserId, currentUser.id, refreshWallComments]);

  return null;
}
