import { supabase } from '../../lib/supabase';

export type FeedRailProfile = { id: string; username: string | null; full_name: string | null; avatar_url: string | null; user_status: string | null };
export type FeedRailFriend = { id: string; friend_id: string; profile: FeedRailProfile | null };
export type FeedRailEvent = { id: string; name: string; start_time: string };

export async function loadFeedRightRail(userId: string) {
  const [friendsResult, profilesResult, eventsResult] = await Promise.all([
    supabase.from('friendships').select('id, friend_id, profiles:friend_id(id, username, full_name, avatar_url, user_status)').eq('user_id', userId).eq('status', 'accepted').limit(20),
    supabase.from('profiles').select('id, username, full_name, avatar_url, user_status').limit(30),
    supabase.from('events').select('id, name, start_time').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(20),
  ]);
  if (friendsResult.error) throw friendsResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (eventsResult.error) throw eventsResult.error;
  const friends = (friendsResult.data ?? []) as any[];
  const friendIds = friends.map((row) => row.friend_id).filter(Boolean);
  const suggestions = ((profilesResult.data ?? []) as FeedRailProfile[]).filter((profile) => profile.id !== userId && !friendIds.includes(profile.id)).slice(0, 3);
  return { friends: friends.map((row) => ({ id: row.id, friend_id: row.friend_id, profile: row.profiles as FeedRailProfile | null })) as FeedRailFriend[], suggestions, events: (eventsResult.data ?? []) as FeedRailEvent[] };
}

export async function sendFriendRequest(userId: string, friendId: string) {
  const { error } = await supabase.from('friendships').insert({ user_id: userId, friend_id: friendId, status: 'pending' });
  if (error) throw error;
}
