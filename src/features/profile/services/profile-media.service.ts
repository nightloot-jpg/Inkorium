import { supabase } from '../../../lib/supabase';
import type { GalleryPhoto } from '../types/profile.types';

export async function getProfilePhotos(profileId: string): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, url, caption, created_at')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) throw error;
  return (data || []) as GalleryPhoto[];
}
