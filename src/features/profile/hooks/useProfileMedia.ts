import { useCallback, useState } from 'react';
import type { GalleryPhoto, MediaTarget } from '../types/profile.types';
import { getProfilePhotos } from '../services/profile-media.service';
import { openProfileImageEditor } from '../profile-image-editor';

type Props = { isOwnProfile: boolean; profileId: string; onMediaUpdated?: (target: MediaTarget, url: string) => void };

export function useProfileMedia({ isOwnProfile, profileId, onMediaUpdated }: Props) {
  const [editingMedia, setEditingMedia] = useState<MediaTarget | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const openMediaEditor = useCallback((target: MediaTarget) => {
    if (!isOwnProfile || uploadingMedia) return;
    setEditingMedia(target);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.setAttribute('aria-hidden', 'true');
    input.style.position = 'fixed';
    input.style.width = '1px';
    input.style.height = '1px';
    input.style.opacity = '0';

    const handleChange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        setEditingMedia(null);
        return;
      }

      setUploadingMedia(true);
      try {
        await openProfileImageEditor({ target, file, userId: profileId, onSaved: (url, savedTarget) => onMediaUpdated?.(savedTarget, url) });
      } catch (error) {
        window.alert(`No se pudo abrir el editor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setUploadingMedia(false);
        setEditingMedia(null);
      }
    };

    input.addEventListener('change', () => void handleChange(), { once: true });
    document.body.appendChild(input);
    input.click();
  }, [isOwnProfile, onMediaUpdated, profileId, uploadingMedia]);

  const closeMediaEditor = useCallback(() => {
    if (!uploadingMedia) setEditingMedia(null);
  }, [uploadingMedia]);

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

  return { editingMedia, uploadingMedia, openMediaEditor, closeMediaEditor, gallery, loadingGallery, loadGallery };
}
