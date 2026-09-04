import React, { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { broadcastCrossTabEvent } from '../lib/chatHistory';
import { UserPresence } from '../types';

const mapRealtimeProfile = (profile: any) => {
  const fullName = String(profile?.full_name ?? '').trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  const gender = String(profile?.gender ?? '').trim().toLowerCase();
  const presenceRaw = String(profile?.presence ?? profile?.user_status ?? '').trim().toLowerCase();
  const presencia: UserPresence = ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presenceRaw)
    ? presenceRaw as UserPresence
    : 'conectado';
  const interests = Array.isArray(profile?.profile_interests)
    ? profile.profile_interests.join(', ')
    : String(profile?.profile_interests ?? '').trim();

  return {
    username: String(profile?.username ?? '').trim() || undefined,
    full_name: fullName || undefined,
    nombre: parts[0] || String(profile?.username ?? '').trim() || 'Usuario',
    apellidos: parts.slice(1).join(' '),
    avatar: String(profile?.avatar_url ?? '').trim(),
    pais: String(profile?.country ?? '').trim() || undefined,
    provincia: String(profile?.province ?? '').trim(),
    ciudad: String(profile?.city ?? '').trim() || undefined,
    fnac: String(profile?.birth_date ?? '').trim(),
    estado: String(profile?.user_status ?? '').trim(),
    sexo: gender === 'female' || gender === 'mujer' || gender === 'm' ? 'm' :
      (gender === 'male' || gender === 'hombre' || gender === 'h' ? 'h' : 'otro'),
    situacionSentimental: profile?.relationship_status ?? 'Soltero/a',
    ocupacion: profile?.occupation ?? '',
    intereses,
    musica: profile?.music ?? '',
    presencia,
    online: presencia !== 'invisible',
    chatEstado: presencia === 'invisible' ? '0' : '1'
  };
};

export const ProfileRealtimeSync: React.FC = () => {
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
  }, []);

  return null;
};
