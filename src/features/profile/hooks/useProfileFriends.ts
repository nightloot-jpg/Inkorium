import { useEffect, useState } from 'react';
import { getProfileFriends, type ProfileFriend } from '../services/profile-friends.service';

export function useProfileFriends(profileId: string) {
  const [friends, setFriends] = useState<ProfileFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProfileFriends(profileId)
      .then(data => { if (!cancelled) setFriends(data); })
      .catch(error => console.error('Error loading profile friends:', error))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId]);

  return { friends, loading };
}
