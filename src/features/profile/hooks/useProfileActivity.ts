import { useEffect, useState } from 'react';
import { getProfileActivity, type ProfileActivityItem } from '../services/profile-activity.service';

export function useProfileActivity(profileId: string) {
  const [items, setItems] = useState<ProfileActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProfileActivity(profileId)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(error => console.error('Error loading profile activity:', error))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId]);

  return { items, loading };
}
