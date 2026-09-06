import { useEffect, useRef, useCallback } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { subscribeCrossTabEvents, broadcastCrossTabEvent } from '../lib/chatHistory';
import { supabase } from '../lib/supabase';
import {
  signatureEventBus,
  SIGNATURES_STORAGE_KEY,
  cleanId,
  findUserByAnyIdentifier,
  mapAndVerifySignatureToProfile,
  isSignatureForProfile,
  deduplicateAndSortSignatures
} from '../lib/signatureEventBus';
import type { WallComment } from '../types';

function readWallCommentsFromStorage(): WallComment[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SIGNATURES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWallCommentsToStorage(comments: WallComment[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SIGNATURES_STORAGE_KEY, JSON.stringify(comments));
  } catch (e) {
    console.warn('[ProfileSignatureCloudSync] Error saving wall comments to localStorage:', e);
  }
}

export function ProfileSignatureCloudSync() {
  const {
    currentUser,
    users,
    selectedUserId,
    wallComments,
    setWallComments,
    refreshWallComments
  } = useInkorium();

  const isHealthCheckingRef = useRef(false);
  const wallCommentsRef = useRef(wallComments);
  wallCommentsRef.current = wallComments;

  const usersRef = useRef(users);
  usersRef.current = users;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const selectedUserIdRef = useRef(selectedUserId);
  selectedUserIdRef.current = selectedUserId;

  /**
   * Core Health-Check, Normalization & Reconciliation Procedure
   * Compares the local signature state with cloud persistence,
   * maps all signatures cleanly to the target user profile,
   * and fires the signatureEventBus to immediately update UI components.
   */
  const runSignatureHealthCheck = useCallback(async (source: string, customTargetId?: string) => {
    if (isHealthCheckingRef.current) {
      console.log(`[ProfileSignatureCloudSync] [${source}] Check already in progress, queuing bypass.`);
      return;
    }
    isHealthCheckingRef.current = true;

    const user = currentUserRef.current;
    const targetId = customTargetId || selectedUserIdRef.current || user.id;
    const currentUsersList = usersRef.current;

    signatureEventBus.notifyStatus(true, targetId);

    try {
      // 1. Resolve canonical target user
      const targetUserObj = findUserByAnyIdentifier(targetId, currentUsersList);
      const canonicalTargetId = targetUserObj?.id || targetId;

      console.log(
        `%c[ProfileSignatureCloudSync] [${source}] Syncing signatures...`,
        'color: #2563eb; font-weight: bold;',
        {
          activeProfile: canonicalTargetId,
          targetUser: targetUserObj ? `${targetUserObj.nombre} (@${targetUserObj.username})` : canonicalTargetId,
          activeUser: user.id ? `${user.nombre} (${user.id})` : 'Anon',
          localCount: wallCommentsRef.current.length
        }
      );

      // 2. Gather all local signatures (deduplicated combination of React state + localStorage)
      const localMap = new Map<string, WallComment>();
      const storageComments = readWallCommentsFromStorage();
      for (const c of storageComments) {
        if (c?.id) {
          const verified = mapAndVerifySignatureToProfile(c, currentUsersList, targetUserObj);
          localMap.set(verified.id, verified);
        }
      }
      for (const c of wallCommentsRef.current) {
        if (c?.id) {
          const verified = mapAndVerifySignatureToProfile(c, currentUsersList, targetUserObj);
          localMap.set(verified.id, verified);
        }
      }

      // 3. Fetch Cloud State
      let cloudRows: any[] = [];
      try {
        const query = canonicalTargetId ? `?profile_id=${encodeURIComponent(canonicalTargetId)}` : '';
        const res = await fetch(`/api/profile-signatures${query}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            cloudRows = data;
          }
        }
      } catch (err: any) {
        console.warn('[ProfileSignatureCloudSync] Error fetching /api/profile-signatures:', err?.message);
      }

      // 4. Secondary fetch from Supabase if configured
      if (supabase && canonicalTargetId) {
        try {
          const cleanTarget = cleanId(canonicalTargetId);
          const { data: supaRows, error: supaErr } = await supabase
            .from('profile_signatures')
            .select('id,profile_id,author_id,content,created_at')
            .or(`profile_id.eq.${canonicalTargetId},profile_id.eq.user-${cleanTarget},profile_id.eq.${cleanTarget}`)
            .order('created_at', { ascending: false });

          if (!supaErr && Array.isArray(supaRows)) {
            const cloudIdSet = new Set(cloudRows.map(r => String(r.id)));
            for (const sRow of supaRows) {
              if (sRow?.id && !cloudIdSet.has(String(sRow.id))) {
                cloudRows.push(sRow);
                cloudIdSet.add(String(sRow.id));
              }
            }
          }
        } catch {}
      }

      // 5. Map and strictly verify every cloud row to the user profile
      const cloudMap = new Map<string, WallComment>();
      for (const r of cloudRows) {
        if (r && (r.id || r.content || r.texto)) {
          const verified = mapAndVerifySignatureToProfile(r, currentUsersList, targetUserObj);
          cloudMap.set(verified.id, verified);
        }
      }

      // 6. Diagnose Discrepancies
      const missingInLocal: WallComment[] = [];
      for (const [id, cComment] of cloudMap.entries()) {
        if (!localMap.has(id)) {
          missingInLocal.push(cComment);
        }
      }

      const missingInCloud: WallComment[] = [];
      for (const [id, lComment] of localMap.entries()) {
        const owner = lComment.receptorId || lComment.propietarioId || lComment.profile_id;
        const author = lComment.autorId || lComment.emisorId || lComment.author_id;
        const content = lComment.texto || lComment.comentario || lComment.content;

        if (content && owner && !cloudMap.has(id)) {
          // If this signature belongs to the active profile or was authored by current user
          if (
            cleanId(owner) === cleanId(canonicalTargetId) ||
            cleanId(author) === cleanId(user.id) ||
            (user.username && cleanId(author) === cleanId(user.username))
          ) {
            missingInCloud.push(lComment);
          }
        }
      }

      // 7. Apply updates to local state & storage
      const consolidatedMap = new Map<string, WallComment>(localMap);
      let stateChanged = false;

      // Ingest missing from cloud
      if (missingInLocal.length > 0) {
        for (const missing of missingInLocal) {
          consolidatedMap.set(missing.id, missing);
        }
        stateChanged = true;
      }

      // Re-verify and update all existing entries with latest cloud details
      for (const [id, cComment] of cloudMap.entries()) {
        if (consolidatedMap.has(id)) {
          const existing = consolidatedMap.get(id)!;
          // If cloud has created_at and local doesn't, update it
          if (cComment.created_at && (!existing.created_at || existing.created_at !== cComment.created_at)) {
            consolidatedMap.set(id, { ...existing, created_at: cComment.created_at });
            stateChanged = true;
          }
        }
      }

      const allSignatures = deduplicateAndSortSignatures(Array.from(consolidatedMap.values()));

      if (stateChanged || wallCommentsRef.current.length !== allSignatures.length) {
        writeWallCommentsToStorage(allSignatures);
        setWallComments(allSignatures);
      }

      // 8. Upload missing local signatures to Cloud backend
      if (missingInCloud.length > 0) {
        console.log(`[ProfileSignatureCloudSync] Uploading ${missingInCloud.length} local signatures to cloud...`);
        for (const missingLocal of missingInCloud) {
          const owner = missingLocal.receptorId || missingLocal.propietarioId || canonicalTargetId;
          const author = missingLocal.autorId || missingLocal.emisorId || user.id;
          const authorName = missingLocal.autorNombre || missingLocal.emisorNombre || user.nombre || 'Usuario';
          const authorAvatar = missingLocal.autorAvatar || missingLocal.emisorAvatar || user.avatar || '';
          const content = missingLocal.texto || missingLocal.comentario || missingLocal.content || '';

          const payload = {
            id: missingLocal.id,
            profile_id: owner,
            receptorId: owner,
            propietarioId: owner,
            author_id: author,
            author_name: authorName,
            author_avatar: authorAvatar,
            content,
            texto: content,
            comentario: content,
            created_at: missingLocal.created_at || new Date().toISOString()
          };

          try {
            await fetch('/api/profile-signatures', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (supabase) {
              try {
                await supabase
                  .from('profile_signatures')
                  .upsert({
                    id: payload.id,
                    profile_id: payload.profile_id,
                    author_id: payload.author_id,
                    content: payload.content
                  }, { onConflict: 'id', ignoreDuplicates: true });
              } catch {}
            }
          } catch (uploadErr: any) {
            console.warn(`[ProfileSignatureCloudSync] Failed uploading signature ${missingLocal.id}:`, uploadErr?.message);
          }
        }
      }

      // 9. Filter signatures belonging specifically to this profile
      const targetFilterObj = targetUserObj || { id: canonicalTargetId };
      const profileSignatures = allSignatures.filter(s => isSignatureForProfile(s, targetFilterObj));

      // 10. NOTIFY EVENT BUS - Triggers immediate reactive UI update without requiring a reload!
      signatureEventBus.notifySignaturesSynced(
        canonicalTargetId,
        profileSignatures,
        missingInLocal.length,
        missingInCloud.length,
        source
      );

      // Also dispatch backwards-compatible window event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('inkorium:signature_update', {
            detail: {
              type: 'SYNC_COMPLETED',
              profileId: canonicalTargetId,
              count: profileSignatures.length,
              source
            }
          })
        );
      }

      // Broadcast across tabs if new cloud items were ingested
      for (const missing of missingInLocal) {
        broadcastCrossTabEvent({
          type: 'WALL_COMMENT',
          payload: { comment: missing }
        });
      }

      console.log(
        `%c[ProfileSignatureCloudSync] [${source}] Sync SUCCESS: ${profileSignatures.length} signature(s) mapped to profile ${canonicalTargetId}.`,
        'color: #059669; font-weight: bold;'
      );
    } catch (error: any) {
      console.warn(`[ProfileSignatureCloudSync] [${source}] Error during sync execution:`, error?.message || error);
      signatureEventBus.notifyStatus(false, targetId, error?.message || 'Error de sincronización');
    } finally {
      isHealthCheckingRef.current = false;
      signatureEventBus.notifyStatus(false, targetId);
    }
  }, [setWallComments]);

  // Periodic Background Sync (every 15 seconds)
  useEffect(() => {
    console.log('[ProfileSignatureCloudSync] Initializing background event-driven sync scheduler (15s).');
    void runSignatureHealthCheck('mount');

    const interval = window.setInterval(() => {
      void runSignatureHealthCheck('periodic_interval');
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [runSignatureHealthCheck]);

  // Sync on selected profile change
  useEffect(() => {
    const target = selectedUserId || currentUser.id;
    if (target) {
      void refreshWallComments(target);
      const timer = setTimeout(() => {
        void runSignatureHealthCheck('profile_target_change', target);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedUserId, currentUser.id, refreshWallComments, runSignatureHealthCheck]);

  // Sync on window focus / tab visibility return
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void runSignatureHealthCheck('window_focus_or_visible');
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [runSignatureHealthCheck]);

  // Central Event Bus Subscriptions
  useEffect(() => {
    // 1. Listen for explicit UI sync requests
    const unsubscribeSyncRequest = signatureEventBus.on('SIGNATURE_REQUEST_SYNC', (data) => {
      console.log('[ProfileSignatureCloudSync] EventBus: SIGNATURE_REQUEST_SYNC received from', data.source);
      void runSignatureHealthCheck(`event_bus_${data.source}`, data.profileId);
    });

    // 2. Listen for newly posted signatures: immediately upload and verify
    const unsubscribePosted = signatureEventBus.on('SIGNATURE_POSTED', async (data) => {
      console.log('[ProfileSignatureCloudSync] EventBus: SIGNATURE_POSTED received for profile', data.profileId);
      const sig = data.signature;
      if (!sig) return;

      try {
        // Immediate backend cloud upload
        await fetch('/api/profile-signatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sig.id,
            profile_id: sig.receptorId || sig.propietarioId || data.profileId,
            author_id: sig.autorId || sig.emisorId,
            author_name: sig.autorNombre || sig.emisorNombre,
            author_avatar: sig.autorAvatar || sig.emisorAvatar,
            content: sig.texto || sig.comentario || sig.content,
            created_at: sig.created_at || new Date().toISOString()
          })
        });

        // Trigger health check to ensure reconciliation
        void runSignatureHealthCheck('signature_posted_event', data.profileId);
      } catch (err) {
        console.warn('[ProfileSignatureCloudSync] Error syncing posted signature:', err);
      }
    });

    // 3. Listen for deleted signatures
    const unsubscribeDeleted = signatureEventBus.on('SIGNATURE_DELETED', async (data) => {
      console.log('[ProfileSignatureCloudSync] EventBus: SIGNATURE_DELETED received for id', data.signatureId);
      try {
        await fetch(`/api/profile-signatures?id=eq.${encodeURIComponent(data.signatureId)}`, {
          method: 'DELETE'
        });
        void runSignatureHealthCheck('signature_deleted_event', data.profileId);
      } catch (err) {
        console.warn('[ProfileSignatureCloudSync] Error syncing deleted signature:', err);
      }
    });

    // 4. Cross-tab event subscriptions
    const unsubscribeCrossTab = subscribeCrossTabEvents((event) => {
      if (event.type === 'WALL_COMMENT' || event.type === 'WALL_COMMENT_DELETE') {
        console.log('[ProfileSignatureCloudSync] Cross-tab wall event received, triggering sync.');
        void runSignatureHealthCheck('crosstab_wall_event');
      }
    });

    return () => {
      unsubscribeSyncRequest();
      unsubscribePosted();
      unsubscribeDeleted();
      unsubscribeCrossTab();
    };
  }, [runSignatureHealthCheck]);

  return null;
}
