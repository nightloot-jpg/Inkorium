import { supabase } from '../../../lib/supabase';
import type { Inklog } from '../types';

export const inklogService = {
  getInklogs: async ({ pageParam = 0 }: { pageParam?: number }) => {
    const limit = 10;
    const from = pageParam * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('inklogs')
      .select(`
        *,
        profiles!inner(*),
        comments(*, profiles(*)),
        likes(*)
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data as unknown as Inklog[],
      nextPage: data.length === limit ? pageParam + 1 : undefined,
    };
  },

  createInklog: async ({ photo, caption }: { photo: File, caption?: string }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const fileExt = photo.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${userData.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, photo);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('inklogs')
      .insert({
        user_id: userData.user.id,
        photo_url: publicUrlData.publicUrl,
        caption
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
