import React, { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { broadcastCrossTabEvent, subscribeCrossTabEvents, normalizeUserId } from '../lib/chatHistory';
import { signatureEventBus } from '../lib/signatureEventBus';
import { toProfileAvatarUrl, useInkorium } from '../context/InkoriumContext';
import { UserPresence } from '../types';

export const mapRealtimeProfile = (profile: any) => {
  const fullName = String(profile?.full_name ?? profile?.fullname ?? '').trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  const displayName = parts[0] || String(profile?.username ?? '').trim() || 'Usuario';
  const gender = String(profile?.gender ?? profile?.sexo ?? '').trim().toLowerCase();
  const presenceRaw = String(profile?.presence ?? profile?.presencia ?? profile?.user_status ?? profile?.estado ?? '').trim().toLowerCase();
  const presencia: UserPresence = ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presenceRaw)
    ? presenceRaw as UserPresence
    : 'conectado';
  const interests = Array.isArray(profile?.profile_interests)
    ? profile.profile_interests.join(', ')
    : String(profile?.profile_interests ?? profile?.intereses ?? '').trim();
  const rawAvatar = profile?.avatar_url ?? profile?.avatar;
  const avatar = rawAvatar ? toProfileAvatarUrl(rawAvatar, displayName) : undefined;
  const status = String(profile?.user_status ?? profile?.estado ?? '').trim();
  const updatedAt = profile?.updated_at ? String(profile.updated_at) : new Date().toISOString();

  return {
    username: String(profile?.username ?? '').trim() || undefined,
    full_name: fullName || undefined,
    nombre: displayName,
    apellidos: parts.slice(1).join(' '),
    avatar,
    avatar_url: rawAvatar ? String(rawAvatar) : undefined,
    pais: String(profile?.country ?? profile?.pais ?? '').trim() || undefined,
    provincia: String(profile?.province ?? profile?.provincia ?? '').trim(),
    ciudad: String(profile?.city ?? profile?.ciudad ?? '').trim() || undefined,
    fnac: String(profile?.birth_date ?? profile?.fnac ?? '').trim(),
    estado: status,
    estadoFecha: updatedAt ? 'Reciente' : '',
    sexo: gender === 'female' || gender === 'mujer' || gender === 'm' ? 'm' :
      (gender === 'male' || gender === 'hombre' || gender === 'h' ? 'h' : 'otro'),
    situacionSentimental: profile?.relationship_status ?? profile?.situacionSentimental ?? 'Soltero/a',
    ocupacion: profile?.occupation ?? profile?.ocupacion ?? '',
    intereses: interests,
    musica: profile?.music ?? profile?.musica ?? '',
    presencia,
    online: presencia !== 'invisible',
    chatEstado: presencia === 'invisible' ? '0' : '1',
    updated_at: updatedAt,
    ultimoAcceso: updatedAt ? new Date(updatedAt).toLocaleString('es-ES') : undefined
  };
};

export const ProfileRealtimeSync: React.FC = () => {
  const { 
    currentUser, 
    blockedUserIds, 
    blockUser, 
    unblockUser, 
    isUserBlocked, 
    closeChat, 
    refreshProfiles,
    refreshWallComments 
  } = useInkorium();

  const currentUserId = currentUser?.id || '';
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const isUserBlockedRef = useRef(isUserBlocked);
  isUserBlockedRef.current = isUserBlocked;

  // 1. Reactive handler for instantaneous session block propagation
  const handleBlockStateSync = React.useCallback((blockerId: string, blockedId: string, isBlocked: boolean) => {
    const curId = currentUserIdRef.current;
    const normCur = normalizeUserId(curId);
    const normBlocker = normalizeUserId(blockerId);
    const normBlocked = normalizeUserId(blockedId);

    // If current session user is the blocker
    if (normBlocker === normCur) {
      if (isBlocked) {
        closeChat(blockedId);
        if (!isUserBlockedRef.current(blockedId)) {
          blockUser(blockedId);
        }
      } else {
        if (isUserBlockedRef.current(blockedId)) {
          unblockUser(blockedId);
        }
      }
    } else if (normBlocked === normCur) {
      // If current session user is the one who got blocked, close any active chat with blocker
      closeChat(blockerId);
    }

    // Instantly notify Signature Event Bus so wall comments in view are dynamically re-filtered
    signatureEventBus.requestSync('*', 'block_realtime_sync');
    void refreshWallComments('*').catch(() => null);

    // Dispatch DOM event for any independent listeners in the active session
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inkorium:block_state_changed', {
        detail: { blockerId, blockedId, isBlocked }
      }));
    }
  }, [blockUser, unblockUser, closeChat, refreshWallComments]);

  // 2. Watch blockedUserIds state to ensure open chats targeting blocked users are closed immediately
  useEffect(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return;
    for (const id of blockedUserIds) {
      closeChat(id);
    }
    // Trigger signature bus sync whenever blocked user list changes
    signatureEventBus.requestSync('*', 'blocked_list_updated');
  }, [blockedUserIds, closeChat]);

  // 3. Listen to Server-Sent Events from /api/profiles/events (Profiles & Real-time Blocks)
  useEffect(() => {
    let sse: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const connectSSE = () => {
      if (isDisposed) return;
      try {
        sse = new EventSource('/api/profiles/events');

        sse.onmessage = (event) => {
          try {
            if (!event.data) return;
            const parsed = JSON.parse(event.data);

            if (parsed?.type === 'PROFILE_UPDATE' && parsed.profileId && parsed.data) {
              const mappedData = mapRealtimeProfile(parsed.data);
              broadcastCrossTabEvent({
                type: 'PROFILE_UPDATE',
                payload: {
                  userId: parsed.profileId,
                  data: mappedData
                }
              });
              void refreshProfiles();
            } else if (parsed?.type === 'CHAT_BLOCK_UPDATE') {
              const blockerId = String(parsed.blockerId || parsed.payload?.blockerId || '').trim();
              const blockedId = String(parsed.blockedId || parsed.payload?.blockedId || '').trim();
              const isBlocked = parsed.isBlocked !== undefined 
                ? Boolean(parsed.isBlocked) 
                : Boolean(parsed.payload?.isBlocked);

              if (blockerId && blockedId) {
                // Propagate cross-tab
                broadcastCrossTabEvent({
                  type: 'CHAT_BLOCK_UPDATE',
                  payload: { blockerId, blockedId, isBlocked }
                });
                handleBlockStateSync(blockerId, blockedId, isBlocked);
              }
            }
          } catch (err) {
            console.warn('[ProfileRealtimeSync] SSE message parse error:', err);
          }
        };

        sse.onerror = () => {
          if (sse) {
            try { sse.close(); } catch {}
            sse = null;
          }
          if (!isDisposed && !reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectSSE();
            }, 3000);
          }
        };
      } catch (err) {
        console.warn('[ProfileRealtimeSync] SSE connection error:', err);
      }
    };

    connectSSE();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (sse) {
        try { sse.close(); } catch {}
      }
    };
  }, [refreshProfiles, handleBlockStateSync]);

  // 4. Listen to Cross-Tab BroadcastChannel and Local Storage Events
  useEffect(() => {
    const unsub = subscribeCrossTabEvents((event) => {
      if (event.type === 'CHAT_BLOCK_UPDATE') {
        const { blockerId, blockedId, isBlocked } = event.payload;
        handleBlockStateSync(blockerId, blockedId, isBlocked);
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('inkorium:blocked_users_')) {
        const curId = currentUserIdRef.current;
        if (e.key === `inkorium:blocked_users_${normalizeUserId(curId)}`) {
          try {
            const parsed = e.newValue ? JSON.parse(e.newValue) : [];
            if (Array.isArray(parsed)) {
              for (const blockedId of parsed) {
                closeChat(blockedId);
              }
              signatureEventBus.requestSync('*', 'storage_block_sync');
              void refreshWallComments('*').catch(() => null);
            }
          } catch {}
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      unsub();
      window.removeEventListener('storage', handleStorage);
    };
  }, [handleBlockStateSync, closeChat, refreshWallComments]);

  // 5. Listen to Supabase Realtime postgres_changes if configured
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('inkorium-profile-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const userId = String(payload.new?.id ?? '').trim();
          if (!userId) return;

          const data = mapRealtimeProfile(payload.new);
          broadcastCrossTabEvent({
            type: 'PROFILE_UPDATE',
            payload: { userId, data }
          });
          void refreshProfiles();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_blocks' },
        (payload) => {
          const blockerId = String((payload.new as any)?.blocker_id || (payload.old as any)?.blocker_id || '').trim();
          const blockedId = String((payload.new as any)?.blocked_id || (payload.old as any)?.blocked_id || '').trim();
          const isBlocked = payload.eventType !== 'DELETE';
          if (blockerId && blockedId) {
            handleBlockStateSync(blockerId, blockedId, isBlocked);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Inkorium] Profile realtime channel error');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshProfiles, handleBlockStateSync]);

  return null;
};

