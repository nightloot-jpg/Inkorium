import { supabase } from '../../../lib/supabase';
import type { Profile, ProfileStats, StatusValue } from '../types/profile.types';

const PROFILE_FIELDS = 'id, username, full_name, bio, city, avatar_url, banner_url, user_status, profile_interests, profile_hashtag';

export async function getProfile(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', profileId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfileFields(profileId: string, fields: Partial<Profile>) {
  const { error } = await supabase.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', profileId);
  if (error) throw error;
}

export async function updateProfileStatus(profileId: string, status: StatusValue) {
  await updateProfileFields(profileId, { user_status: status });
}

export async function getProfileStats(profileId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc('get_profile_stats', { target_user_id: profileId }).maybeSingle();
  if (error) throw error;
  return {
    friends_count: Number(data?.friends_count ?? 0),
    followers_count: Number(data?.followers_count ?? 0),
    following_count: Number(data?.following_count ?? 0),
    albums_count: Number(data?.albums_count ?? 0),
  };
}
