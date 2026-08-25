import { useCallback, useEffect, useState } from 'react';
import { getProfileMusicDiary, syncDailySongToDiary, type MusicDiaryEntry } from '../services/profile-music.service';

export function useProfileMusicDiary(profileId: string, enabled = true, syncDailySong = false) {
  const [entries, setEntries] = useState<MusicDiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return [];
    setLoading(true);
    setError(null);
    try {
      if (syncDailySong) await syncDailySongToDiary(profileId);
      const next = await getProfileMusicDiary(profileId);
      setEntries(next);
      return next;
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('No se pudo cargar el diario musical');
      setError(nextError);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, profileId, syncDailySong]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entries, loading, error, reload };
}
