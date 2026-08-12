import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhotosFn, uploadPhotoFn } from '../services/photos.functions';

const PHOTOS_QUERY_KEY = ['photos'] as const;

export function usePhotos() {
  const queryClient = useQueryClient();
  const photos = useQuery({
    queryKey: PHOTOS_QUERY_KEY,
    queryFn: () => getPhotosFn({ data: { limit: 48 } }),
    staleTime: 30_000,
  });

  const upload = useMutation({
    mutationFn: uploadPhotoFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY }),
  });

  return { ...photos, upload };
}
