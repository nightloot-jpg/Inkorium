import { supabase } from '../../../lib/supabase';

export type MusicFeaturedPlaylist = {
  id: string;
  name: string;
  cover_url: string | null;
  description: string | null;
  is_public?: boolean;
};

export async function getFeaturedPlaylists(profileId: string) {
  const [{ data: playlists, error: playlistsError }, { data: featured, error: featuredError }] = await Promise.all([
    supabase.from('music_playlists').select('id,name,cover_url,description,is_public').eq('user_id', profileId).order('created_at', { ascending: false }).limit(50),
    supabase.from('profile_music_featured_playlists').select('playlist_id').eq('user_id', profileId),
  ]);
  if (playlistsError) throw playlistsError;
  if (featuredError) throw featuredError;
  const featuredIds = new Set<string>((featured || []).map(row => row.playlist_id).filter(Boolean));
  return (playlists || []).filter(playlist => featuredIds.has(playlist.id)) as MusicFeaturedPlaylist[];
}

export async function saveFeaturedPlaylists(profileId: string, playlistIds: string[]) {
  const selected = Array.from(new Set(playlistIds)).slice(0, 6);
  const { error: deleteError } = await supabase.from('profile_music_featured_playlists').delete().eq('user_id', profileId);
  if (deleteError) throw deleteError;
  if (!selected.length) return;
  const { error } = await supabase.from('profile_music_featured_playlists').insert(selected.map(playlistId => ({ user_id: profileId, playlist_id: playlistId })));
  if (error) throw error;
}
