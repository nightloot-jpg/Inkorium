import { useCallback, useState } from 'react';
import type { GalleryPhoto, MediaTarget } from '../types/profile.types';
import { getProfilePhotos } from '../services/profile-media.service';
import { createStorageUploadTicket } from '../../../lib/storage';
import { supabase } from '../../../lib/supabase';

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
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        setEditingMedia(null);
        return;
      }

      setUploadingMedia(true);
      try {
        const folder = target === 'banner' ? 'covers' : 'avatars';
        const ticket = await createStorageUploadTicket({ folder, file });
        const response = await fetch(ticket.uploadUrl, {
          method: 'PUT',
          mode: 'cors',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!response.ok) throw new Error(`No se pudo subir la imagen (${response.status}).`);

        const url = ticket.url || (await supabase.functions.invoke('media-storage', { body: { action: 'get', key: ticket.key } })).data?.url;
        if (!url) throw new Error('No se pudo obtener la URL de la imagen.');

        const field = target === 'banner' ? 'banner_url' : 'avatar_url';
        const { error } = await supabase.from('profiles').update({ [field]: url }).eq('id', profileId);
        if (error) throw error;

        onMediaUpdated?.(target, url);
      } catch (error) {
        window.alert(`No se pudo cambiar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setUploadingMedia(false);
        setEditingMedia(null);
      }
    }, { once: true });

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
