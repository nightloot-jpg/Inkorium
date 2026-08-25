import { useCallback, useEffect, useState } from 'react';
import type { Profile, StatusValue } from '../types/profile.types';
import { getProfile, updateProfileFields, updateProfileStatus } from '../services/profile.service';

export function useProfile(profileId: string, initialProfile: Profile | null) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => { setLoading(true); setError(null); try { const next = await getProfile(profileId); setProfile(next); return next; } catch (cause) { const nextError = cause instanceof Error ? cause : new Error('No se pudo cargar el perfil'); setError(nextError); return null; } finally { setLoading(false); } }, [profileId]);
  useEffect(() => { let cancelled = false; setProfile(initialProfile); void getProfile(profileId).then(next => { if (!cancelled) { setProfile(next); setLoading(false); } }).catch(cause => { if (!cancelled) { setError(cause instanceof Error ? cause : new Error('No se pudo cargar el perfil')); setLoading(false); } }); return () => { cancelled = true; }; }, [profileId, initialProfile]);
  const update = useCallback(async (fields: Partial<Profile>) => { await updateProfileFields(profileId, fields); setProfile(current => current ? { ...current, ...fields } : current); }, [profileId]);
  const updateStatus = useCallback(async (status: StatusValue) => { await updateProfileStatus(profileId, status); setProfile(current => current ? { ...current, user_status: status } : current); }, [profileId]);
  return { profile, loading, error, reload, update, updateStatus };
}
