import { useCallback, useEffect, useState } from 'react';
import { getFeaturedPlaylists, saveFeaturedPlaylists, type MusicFeaturedPlaylist } from '../services/profile-music-preferences.service';

export function useProfileMusicPreferences(profileId: string, enabled: boolean) {
  const [featuredPlaylists, setFeaturedPlaylists] = useState<MusicFeaturedPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !profileId) return;
    setLoading(true);
    setError(null);
    try {
      setFeaturedPlaylists(await getFeaturedPlaylists(profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las preferencias musicales.');
    } finally {
      setLoading(false);
    }
  }, [enabled, profileId]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (playlistIds: string[]) => {
    setSaving(true);
    setError(null);
    try {
      await saveFeaturedPlaylists(profileId, playlistIds);
      setFeaturedPlaylists(await getFeaturedPlaylists(profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar las preferencias.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [profileId]);

  return { featuredPlaylists, loading, saving, error, reload: load, save };
}
