import { useCallback, useEffect, useState } from 'react';
import type { ProfileStats } from '../types/profile.types';
import { getProfileStats } from '../services/profile.service';

const EMPTY_STATS: ProfileStats = {
  friends_count: 0,
  followers_count: 0,
  following_count: 0,
  albums_count: 0,
};

export function useProfileStats(profileId: string) {
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getProfileStats(profileId);
      setStats(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getProfileStats(profileId)
      .then(next => {
        if (!cancelled) setStats(next);
      })
      .catch(error => {
        if (!cancelled) console.error('Error loading profile stats:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const handleFocus = () => void reload();
    window.addEventListener('focus', handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
    };
  }, [profileId, reload]);

  return { stats, loading, reload };
}
