import React, { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { broadcastCrossTabEvent, normalizeUserId } from '../lib/chatHistory';
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
  const { refreshProfiles } = useInkorium();

  // 1. Listen to Server-Sent Events from /api/profiles/events
  // This captures profile_metadata.json updates and server-side profile updates instantly
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
  }, [refreshProfiles]);

  // 2. Listen to Supabase Realtime postgres_changes if configured
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
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Inkorium] Profile realtime channel error');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshProfiles]);

  return null;
};
