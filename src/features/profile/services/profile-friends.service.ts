import { supabase } from '../../../lib/supabase';

export type ProfileFriend = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export async function getProfileFriends(profileId: string, limit = 8): Promise<ProfileFriend[]> {
  const [{ data: a, error: errorA }, { data: b, error: errorB }] = await Promise.all([
    supabase.from('friendships').select('friend_id').eq('user_id', profileId).eq('status', 'accepted'),
    supabase.from('friendships').select('user_id').eq('friend_id', profileId).eq('status', 'accepted'),
  ]);
  if (errorA) throw errorA;
  if (errorB) throw errorB;

  const ids = [...new Set([...(a || []).map((row: any) => row.friend_id), ...(b || []).map((row: any) => row.user_id)])];
  if (!ids.length) return [];

  const { data, error } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', ids).limit(limit);
  if (error) throw error;
  return (data || []) as ProfileFriend[];
}
