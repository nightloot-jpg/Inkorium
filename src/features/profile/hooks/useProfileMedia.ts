import { useCallback, useState } from 'react';
import type { GalleryPhoto, MediaTarget } from '../types/profile.types';
import { getProfilePhotos } from '../services/profile-media.service';

type ProfileMediaEditDetail = { target: MediaTarget };

export function useProfileMedia(isOwnProfile: boolean) {
  const [editingMedia, setEditingMedia] = useState<MediaTarget | null>(null);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const openMediaEditor = useCallback((target: MediaTarget) => {
    if (!isOwnProfile) return;
    setEditingMedia(target);
    window.dispatchEvent(new CustomEvent<ProfileMediaEditDetail>('inkorium-profile-media-edit', { detail: { target } }));
  }, [isOwnProfile]);

  const closeMediaEditor = useCallback(() => setEditingMedia(null), []);

  const loadGallery = useCallback(async (profileId: string) => {
    setLoadingGallery(true);
    try {
      const photos = await getProfilePhotos(profileId);
      setGallery(photos);
      return photos;
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  return { editingMedia, openMediaEditor, closeMediaEditor, gallery, loadingGallery, loadGallery };
}
