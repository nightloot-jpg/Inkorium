import { useCallback, useState } from 'react';
import type { GalleryPhoto, MediaTarget } from '../types/profile.types';
import { getProfilePhotos } from '../services/profile-media.service';
import { openProfileImageEditor } from '../profile-image-editor';

type Props = { isOwnProfile: boolean; profileId: string; onMediaUpdated?: (target: MediaTarget, url: string) => void };

export function useProfileMedia({ isOwnProfile, profileId, onMediaUpdated }: Props) {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const handleMediaFileSelected = useCallback(async (target: MediaTarget, file: File) => {
    if (!isOwnProfile || uploadingMedia) return;
    setUploadingMedia(true);
    try {
      await openProfileImageEditor({
        target,
        file,
        userId: profileId,
        onSaved: (url, savedTarget) => onMediaUpdated?.(savedTarget, url),
      });
    } catch (error) {
      window.alert(`No se pudo abrir el editor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploadingMedia(false);
    }
  }, [isOwnProfile, onMediaUpdated, profileId, uploadingMedia]);

  const loadGallery = useCallback(async (targetProfileId: string) => {
    setLoadingGallery(true);
    try {
      const photos = await getProfilePhotos(targetProfileId);
      setGallery(photos);
      return photos;
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  return { uploadingMedia, handleMediaFileSelected, gallery, loadingGallery, loadGallery };
}
