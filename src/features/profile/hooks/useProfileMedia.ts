import { useCallback, useState } from 'react';
import type { MediaTarget } from '../types/profile.types';

type ProfileMediaEditDetail = { target: MediaTarget };

export function useProfileMedia(isOwnProfile: boolean) {
  const [editingMedia, setEditingMedia] = useState<MediaTarget | null>(null);

  const openMediaEditor = useCallback((target: MediaTarget) => {
    if (!isOwnProfile) return;
    setEditingMedia(target);
    window.dispatchEvent(new CustomEvent<ProfileMediaEditDetail>('inkorium-profile-media-edit', {
      detail: { target },
    }));
  }, [isOwnProfile]);

  const closeMediaEditor = useCallback(() => setEditingMedia(null), []);

  return { editingMedia, openMediaEditor, closeMediaEditor };
}
