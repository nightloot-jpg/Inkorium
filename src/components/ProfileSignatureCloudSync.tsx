import { useEffect, useRef, useCallback } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { subscribeCrossTabEvents, broadcastCrossTabEvent, normalizeUserId } from '../lib/chatHistory';
import { supabase } from '../lib/supabase';
import type { WallComment, User } from '../types';

const WALL_KEY = 'inkorium:wall_comments';

const cleanId = (value?: string | null) =>
  String(value ?? '').trim().toLowerCase().replace(/^user-/, '');

function readWallCommentsFromStorage(): WallComment[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WALL_KEY);
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
    localStorage.setItem(WALL_KEY, JSON.stringify(comments));
  } catch (e) {
    console.warn('[ProfileSignatureCloudSync] Error saving wall comments to localStorage:', e);
  }
}

function rowToWallComment(row: any, users: User[]): WallComment {
  const authorId = String(row.author_id || row.autorId || row.emisorId || '').trim();
  const profileId = String(row.profile_id || row.propietarioId || row.receptorId || '').trim();
  const content = String(row.content || row.texto || row.comentario || '').trim();

  const author = users.find(u =>
    u.id === authorId ||
    cleanId(u.id) === cleanId(authorId) ||
    (u.username && cleanId(u.username) === cleanId(authorId))
  );

  const authorName = String(
    row.author_name ||
    row.autorNombre ||
    row.emisorNombre ||
    (author ? (author.full_name || author.nombre) : 'Usuario')
  ).trim();

  const authorAvatar = String(
    row.author_avatar ||
    row.autorAvatar ||
    row.emisorAvatar ||
    author?.avatar ||
    ''
  ).trim();

  return {
    id: String(row.id),
    propietarioId: profileId,
    receptorId: profileId,
    autorId: authorId,
    emisorId: authorId,
    autorNombre: authorName,
    emisorNombre: authorName,
    autorAvatar: authorAvatar,
    emisorAvatar: authorAvatar,
    texto: content,
    comentario: content,
    fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : 'Ahora mismo',
    likes: Array.isArray(row.likes) ? row.likes : []
  };
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
   * Core Health-Check & Reconciliation Procedure
   * Compares the local signature object with the cloud state, logs detailed diagnostics,
   * and triggers corrections whenever any discrepancy is identified.
   */
  const runSignatureHealthCheck = useCallback(async (source: string) => {
    if (isHealthCheckingRef.current) {
      console.log(`[ProfileSignatureHealthCheck] [${source}] Skipped: check already in progress.`);
      return;
    }
    isHealthCheckingRef.current = true;

    try {
      const user = currentUserRef.current;
      const targetId = selectedUserIdRef.current || user.id;
      const currentUsersList = usersRef.current;

      console.log(
        `%c[ProfileSignatureHealthCheck] [${source}] Starting health check...`,
        'color: #2563eb; font-weight: bold;',
        {
          activeProfile: targetId,
          activeUser: user.id ? `${user.nombre} (${user.id})` : 'Not logged in',
          localMemoryCount: wallCommentsRef.current.length,
          localStorageCount: readWallCommentsFromStorage().length
        }
      );

      // 1. Gather all local signatures (deduplicated combination of React state + localStorage)
      const localMap = new Map<string, WallComment>();
      const storageComments = readWallCommentsFromStorage();
      for (const c of storageComments) {
        if (c?.id) localMap.set(String(c.id), c);
      }
      for (const c of wallCommentsRef.current) {
        if (c?.id) localMap.set(String(c.id), c);
      }
      const localComments = Array.from(localMap.values());

      // 2. Fetch Cloud State
      // Primary: backend persistent store (/api/profile-signatures)
      let cloudRows: any[] = [];
      try {
        const query = targetId ? `?profile_id=${encodeURIComponent(targetId)}` : '';
        const res = await fetch(`/api/profile-signatures${query}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            cloudRows = data;
          }
        }
      } catch (err: any) {
        console.warn('[ProfileSignatureHealthCheck] Failed to fetch /api/profile-signatures:', err?.message);
      }

      // Secondary: Supabase profile_signatures table (if configured and reachable)
      if (supabase && targetId) {
        try {
          const { data: supaRows, error: supaErr } = await supabase
            .from('profile_signatures')
            .select('id,profile_id,author_id,content,created_at')
            .or(`profile_id.eq.${targetId},profile_id.eq.user-${cleanId(targetId)},profile_id.eq.${cleanId(targetId)}`)
            .order('created_at', { ascending: false });

          if (!supaErr && Array.isArray(supaRows)) {
            // Merge Supabase rows with backend cloud rows
            const cloudIdSet = new Set(cloudRows.map(r => String(r.id)));
            for (const sRow of supaRows) {
              if (sRow?.id && !cloudIdSet.has(String(sRow.id))) {
                cloudRows.push(sRow);
                cloudIdSet.add(String(sRow.id));
              }
            }
          }
        } catch {
          // Gracefully continue with backend cloud rows
        }
      }

      // Convert cloud rows into standardized WallComment objects
      const cloudComments = cloudRows.map(r => rowToWallComment(r, currentUsersList));
      const cloudMap = new Map<string, WallComment>();
      for (const cc of cloudComments) {
        if (cc.id) cloudMap.set(cc.id, cc);
      }

      // 3. Diagnose Discrepancies
      // A) Signatures present in cloud but missing locally
      const missingInLocal: WallComment[] = [];
      for (const [id, cComment] of cloudMap.entries()) {
        if (!localMap.has(id)) {
          missingInLocal.push(cComment);
        }
      }

      // B) Signatures present locally for the active user/target that are missing in cloud
      const missingInCloud: WallComment[] = [];
      for (const [id, lComment] of localMap.entries()) {
        const owner = lComment.receptorId || lComment.propietarioId;
        const author = lComment.autorId || lComment.emisorId;
        const content = lComment.texto || lComment.comentario;

        if (content && owner && !cloudMap.has(id)) {
          // If this signature belongs to the viewed profile or was authored by the current user
          if (
            cleanId(owner) === cleanId(targetId) ||
            cleanId(author) === cleanId(user.id) ||
            (user.username && cleanId(author) === cleanId(user.username))
          ) {
            missingInCloud.push(lComment);
          }
        }
      }

      // C) Recipient/Target ID Normalization Verification
      // This directly diagnoses why notifications trigger but signatures might fail to render:
      // ProfileView filters signatures by:
      // commentTargetId === targetProfileId || clean(targetProfileId) || username || nombre || full_name
      // If a signature has a mismatched target format, we detect and correct it.
      const targetUserObj = currentUsersList.find(u =>
        u.id === targetId ||
        cleanId(u.id) === cleanId(targetId) ||
        (u.username && cleanId(u.username) === cleanId(targetId)) ||
        (u.nombre && cleanId(u.nombre) === cleanId(targetId))
      );

      const targetCanonicalId = targetUserObj?.id || targetId;
      const targetAliases = new Set<string>();
      if (targetId) {
        targetAliases.add(cleanId(targetId));
        targetAliases.add(String(targetId).toLowerCase());
      }
      if (targetUserObj) {
        if (targetUserObj.id) {
          targetAliases.add(cleanId(targetUserObj.id));
          targetAliases.add(String(targetUserObj.id).toLowerCase());
        }
        if (targetUserObj.username) {
          targetAliases.add(cleanId(targetUserObj.username));
          targetAliases.add(String(targetUserObj.username).toLowerCase());
        }
        if (targetUserObj.nombre) {
          targetAliases.add(cleanId(targetUserObj.nombre));
          targetAliases.add(String(targetUserObj.nombre).toLowerCase());
        }
      }

      const normalizationCorrections: WallComment[] = [];
      for (const [_, lComment] of localMap.entries()) {
        const currentTarget = lComment.receptorId || lComment.propietarioId;
        if (currentTarget) {
          const normCurrentTarget = cleanId(currentTarget);
          // If it matches one of the target aliases, ensure it holds canonical ID so ProfileView matches cleanly
          if (targetAliases.has(normCurrentTarget) && currentTarget !== targetCanonicalId) {
            normalizationCorrections.push({
              ...lComment,
              receptorId: targetCanonicalId,
              propietarioId: targetCanonicalId
            });
          }
        }
      }

      // 4. Log State Verification & Diagnostics
      const hasDiscrepancy =
        missingInLocal.length > 0 ||
        missingInCloud.length > 0 ||
        normalizationCorrections.length > 0;

      if (!hasDiscrepancy) {
        console.log(
          `%c[ProfileSignatureHealthCheck] [${source}] State verified IN SYNC.`,
          'color: #059669; font-weight: bold;',
          {
            targetProfile: targetId,
            verifiedCount: cloudComments.length,
            localCount: localComments.length
          }
        );
        return;
      }

      console.warn(
        `%c[ProfileSignatureHealthCheck] [${source}] DISCREPANCY DETECTED!`,
        'color: #d97706; font-weight: bold;',
        {
          missingInLocal: missingInLocal.map(s => ({ id: s.id, from: s.autorNombre, to: s.receptorId, text: (s.texto || '').slice(0, 30) })),
          missingInCloud: missingInCloud.map(s => ({ id: s.id, from: s.autorNombre, to: s.receptorId, text: (s.texto || '').slice(0, 30) })),
          normalizationCorrections: normalizationCorrections.map(s => ({ id: s.id, correctedTo: s.receptorId }))
        }
      );

      // 5. Apply Corrections
      let stateChanged = false;
      const updatedMap = new Map<string, WallComment>(localMap);

      // Correction 1: Incorporate missing cloud signatures into local state
      if (missingInLocal.length > 0) {
        for (const missing of missingInLocal) {
          updatedMap.set(missing.id, missing);
        }
        stateChanged = true;
        console.log(
          `[ProfileSignatureHealthCheck] Correction applied: Ingested ${missingInLocal.length} signatures from cloud into local store.`
        );
      }

      // Correction 2: Apply recipient normalization corrections
      if (normalizationCorrections.length > 0) {
        for (const corrected of normalizationCorrections) {
          updatedMap.set(corrected.id, corrected);
        }
        stateChanged = true;
        console.log(
          `[ProfileSignatureHealthCheck] Correction applied: Normalized recipient IDs for ${normalizationCorrections.length} signatures.`
        );
      }

      // If local state updated, commit to React state, localStorage, and notify
      if (stateChanged) {
        const finalComments = Array.from(updatedMap.values());
        writeWallCommentsToStorage(finalComments);
        setWallComments(finalComments);

        // Dispatch update event for listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('inkorium:signature_update', {
              detail: { type: 'HEALTH_CHECK_CORRECTION', count: missingInLocal.length }
            })
          );
        }

        // Broadcast cross-tab for each reconciled comment
        for (const missing of missingInLocal) {
          broadcastCrossTabEvent({
            type: 'WALL_COMMENT',
            payload: { comment: missing }
          });
        }
      }

      // Correction 3: Upload missing local signatures to Cloud persistence
      if (missingInCloud.length > 0) {
        console.log(
          `[ProfileSignatureHealthCheck] Correction started: Uploading ${missingInCloud.length} local signatures to cloud persistence...`
        );

        for (const missingLocal of missingInCloud) {
          const owner = missingLocal.receptorId || missingLocal.propietarioId || targetId;
          const author = missingLocal.autorId || missingLocal.emisorId || user.id;
          const authorName = missingLocal.autorNombre || missingLocal.emisorNombre || user.nombre || 'Usuario';
          const authorAvatar = missingLocal.autorAvatar || missingLocal.emisorAvatar || user.avatar || '';
          const content = missingLocal.texto || missingLocal.comentario || '';

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
            created_at: new Date().toISOString()
          };

          try {
            // Upload to /api/profile-signatures
            const postRes = await fetch('/api/profile-signatures', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (postRes.ok) {
              console.log(`[ProfileSignatureHealthCheck] Successfully uploaded signature ${missingLocal.id} to cloud store.`);
            }

            // Also upsert to Supabase if available
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
            console.warn(`[ProfileSignatureHealthCheck] Failed uploading signature ${missingLocal.id}:`, uploadErr?.message);
          }
        }
      }

      console.log(
        `%c[ProfileSignatureHealthCheck] [${source}] Health check complete. State is now reconciled.`,
        'color: #059669; font-weight: bold;'
      );
    } catch (error: any) {
      console.warn(`[ProfileSignatureHealthCheck] [${source}] Error during health check execution:`, error?.message || error);
    } finally {
      isHealthCheckingRef.current = false;
    }
  }, [setWallComments]);

  // Periodic Health-Check Effect (runs every 15 seconds)
  useEffect(() => {
    console.log('[ProfileSignatureCloudSync] Initializing background health-check scheduler (15s interval).');
    // Immediate initial check
    void runSignatureHealthCheck('mount');

    const interval = window.setInterval(() => {
      void runSignatureHealthCheck('periodic_interval');
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [runSignatureHealthCheck]);

  // Health-check when selected profile or logged-in user changes
  useEffect(() => {
    const target = selectedUserId || currentUser.id;
    if (target) {
      void refreshWallComments(target);
      const timer = setTimeout(() => {
        void runSignatureHealthCheck('profile_target_change');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedUserId, currentUser.id, refreshWallComments, runSignatureHealthCheck]);

  // Health-check on tab focus / window visibility (resumes immediately when user returns to tab)
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

  // Health-check triggered on real-time signature update event or cross-tab message
  useEffect(() => {
    const handleSignatureUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Skip running a full check if the event was dispatched by the health check itself
      if (customEvent.detail?.type === 'HEALTH_CHECK_CORRECTION') return;
      console.log('[ProfileSignatureCloudSync] Signature update event received, triggering health check.');
      void runSignatureHealthCheck('realtime_signature_update');
    };

    const unsubscribeCrossTab = subscribeCrossTabEvents((event) => {
      if (event.type === 'WALL_COMMENT' || event.type === 'WALL_COMMENT_DELETE') {
        console.log('[ProfileSignatureCloudSync] Cross-tab wall event received, triggering health check.');
        void runSignatureHealthCheck('crosstab_wall_event');
      }
    });

    window.addEventListener('inkorium:signature_update', handleSignatureUpdate);
    return () => {
      window.removeEventListener('inkorium:signature_update', handleSignatureUpdate);
      unsubscribeCrossTab();
    };
  }, [runSignatureHealthCheck]);

  return null;
}
