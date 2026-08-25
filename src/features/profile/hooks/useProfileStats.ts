import { useCallback, useEffect, useState } from 'react';
import type { ProfileStats } from '../types/profile.types';
import { getProfileStats } from '../services/profile.service';

const EMPTY_STATS: ProfileStats = { friends_count: 0, followers_count: 0, following_count: 0, albums_count: 0 };

export function useProfileStats(profileId: string) {
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getProfileStats(profileId));
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void reload();
    const handleFocus = () => void reload();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [reload]);

  return { stats, loading, reload };
}
