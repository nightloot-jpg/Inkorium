import { supabase } from '../../../lib/supabase';

export type ProfileActivityItem = {
  id: string;
  content: string | null;
  created_at: string;
  media_data: any;
};

export async function getProfileActivity(profileId: string, limit = 5): Promise<ProfileActivityItem[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, content, created_at, media_data')
    .eq('author_id', profileId)
    .is('target_profile_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ProfileActivityItem[];
}
