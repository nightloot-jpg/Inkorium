import { useCallback, useEffect, useState } from 'react';
import { getDailySong, saveDailySong, searchDailySong, getSavedMusic, type DailySongTrack } from '../services/profile-daily-song.service';

export function useProfileDailySong(profileId: string, enabled: boolean) {
  const [song, setSong] = useState<DailySongTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try { setSong(await getDailySong(profileId)); }
    catch (cause) { setError(cause instanceof Error ? cause : new Error('No se pudo cargar la canción del día')); }
    finally { setLoading(false); }
  }, [enabled, profileId]);

  const choose = useCallback(async (track: DailySongTrack) => {
    setSaving(true); setError(null);
    try { await saveDailySong(profileId, track); setSong(await getDailySong(profileId)); window.dispatchEvent(new CustomEvent('inkorium:daily-song-changed')); }
    catch (cause) { const next = cause instanceof Error ? cause : new Error('No se pudo guardar la canción'); setError(next); throw next; }
    finally { setSaving(false); }
  }, [profileId]);

  const loadSavedMusic = useCallback(() => getSavedMusic(profileId), [profileId]);

  useEffect(() => { void reload(); }, [reload]);

  return { song, loading, saving, error, reload, choose, search: searchDailySong, getSavedMusic: loadSavedMusic };
}
