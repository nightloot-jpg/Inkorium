import { useCallback, useEffect, useState } from 'react';
import { addMusicTasteArtist, getMusicTaste, removeMusicTasteArtist, type MusicTasteArtist } from '../services/profile-music-taste.service';

export function useProfileMusicTaste(profileId: string, enabled: boolean) {
  const [artists, setArtists] = useState<MusicTasteArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !profileId) return;
    setLoading(true);
    setError(null);
    try {
      setArtists(await getMusicTaste(profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu gusto musical.');
    } finally {
      setLoading(false);
    }
  }, [enabled, profileId]);

  useEffect(() => { void load(); }, [load]);

  const addArtist = useCallback(async (artistName: string) => {
    setSaving(true);
    setError(null);
    try {
      await addMusicTasteArtist(profileId, artistName);
      setArtists(await getMusicTaste(profileId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el artista.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [profileId]);

  const removeArtist = useCallback(async (artistId: string) => {
    setSaving(true);
    setError(null);
    try {
      await removeMusicTasteArtist(profileId, artistId);
      setArtists(current => current.filter(artist => artist.id !== artistId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo quitar el artista.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [profileId]);

  return { artists, loading, saving, error, reload: load, addArtist, removeArtist };
}
