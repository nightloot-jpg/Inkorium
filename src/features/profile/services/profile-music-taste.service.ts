import { supabase } from '../../../lib/supabase';

export type MusicTasteArtist = {
  id: string;
  artist_name: string;
  youtube_channel_id: string | null;
  youtube_video_id: string | null;
  cover_url: string | null;
};

const MAX_ARTISTS = 8;

export async function getMusicTaste(profileId: string) {
  const { data, error } = await supabase
    .from('profile_music_favorite_artists')
    .select('id,artist_name,youtube_channel_id,youtube_video_id,cover_url')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(MAX_ARTISTS);
  if (error) throw error;
  return (data || []) as MusicTasteArtist[];
}

export async function addMusicTasteArtist(profileId: string, artistName: string) {
  const name = artistName.trim().slice(0, 80);
  if (!name) throw new Error('Escribe el nombre de un artista.');

  const current = await getMusicTaste(profileId);
  if (current.length >= MAX_ARTISTS) throw new Error(`Puedes elegir hasta ${MAX_ARTISTS} artistas.`);
  if (current.some(artist => artist.artist_name.toLowerCase() === name.toLowerCase())) return;

  const { error } = await supabase.from('profile_music_favorite_artists').insert({
    user_id: profileId,
    artist_name: name,
  });
  if (error) throw error;
}

export async function removeMusicTasteArtist(profileId: string, artistId: string) {
  const { error } = await supabase
    .from('profile_music_favorite_artists')
    .delete()
    .eq('id', artistId)
    .eq('user_id', profileId);
  if (error) throw error;
}
