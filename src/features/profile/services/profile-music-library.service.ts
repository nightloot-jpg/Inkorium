import { supabase } from '../../../lib/supabase';

export type MusicLibraryTrack = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  youtube_id: string | null;
  source_type: string;
  album: string | null;
  duration: number | null;
  user_id: string | null;
};

export type MusicPlaylist = {
  id: string;
  name: string;
  cover_url: string | null;
  description: string | null;
  is_public?: boolean;
};

export async function getMusicLibrary(profileId: string) {
  const [{ data: tracks, error: tracksError }, { data: favorites, error: favoritesError }, { data: playlists, error: playlistsError }] = await Promise.all([
    supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,duration,user_id').eq('user_id', profileId).order('created_at', { ascending: false }).limit(100),
    supabase.from('music_favorites').select('track_id,created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(200),
    supabase.from('music_playlists').select('id,name,cover_url,description,is_public').eq('user_id', profileId).order('created_at', { ascending: false }).limit(50),
  ]);
  if (tracksError) throw tracksError;
  if (favoritesError) throw favoritesError;
  if (playlistsError) throw playlistsError;
  return {
    tracks: (tracks || []) as MusicLibraryTrack[],
    favoriteIds: new Set<string>((favorites || []).map(row => row.track_id).filter(Boolean)),
    playlists: (playlists || []) as MusicPlaylist[],
  };
}

export async function setFavorite(profileId: string, trackId: string, favorite: boolean) {
  if (favorite) {
    const { error } = await supabase.from('music_favorites').upsert({ user_id: profileId, track_id: trackId }, { onConflict: 'user_id,track_id' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('music_favorites').delete().eq('user_id', profileId).eq('track_id', trackId);
    if (error) throw error;
  }
}

export async function updateTrack(profileId: string, trackId: string, draft: { title: string; artist: string; album: string }) {
  const { error } = await supabase.from('music_tracks').update({
    title: draft.title.trim(),
    artist: draft.artist.trim() || null,
    album: draft.album.trim() || null,
  }).eq('id', trackId).eq('user_id', profileId);
  if (error) throw error;
}

export async function deleteTrack(profileId: string, trackId: string) {
  await setFavorite(profileId, trackId, false);
  const { error } = await supabase.from('music_tracks').delete().eq('id', trackId).eq('user_id', profileId);
  if (error) throw error;
}

export async function createPlaylist(profileId: string, name: string, description: string, isPublic: boolean) {
  const { error } = await supabase.from('music_playlists').insert({
    user_id: profileId,
    name: name.trim(),
    description: description.trim() || null,
    is_public: isPublic,
  });
  if (error) throw error;
}

export async function updatePlaylist(profileId: string, playlistId: string, name: string, description: string, isPublic: boolean) {
  const { error } = await supabase.from('music_playlists').update({
    name: name.trim(),
    description: description.trim() || null,
    is_public: isPublic,
  }).eq('id', playlistId).eq('user_id', profileId);
  if (error) throw error;
}

export async function deletePlaylist(profileId: string, playlistId: string) {
  const { error } = await supabase.from('music_playlists').delete().eq('id', playlistId).eq('user_id', profileId);
  if (error) throw error;
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  const { data: last, error: lastError } = await supabase.from('music_playlist_items').select('position').eq('playlist_id', playlistId).order('position', { ascending: false }).limit(1).maybeSingle();
  if (lastError) throw lastError;
  const position = Number(last?.position || 0) + 1;
  const { error } = await supabase.from('music_playlist_items').upsert({ playlist_id: playlistId, track_id: trackId, position }, { onConflict: 'playlist_id,track_id' });
  if (error) throw error;
}

export async function searchYoutubeTracks(query: string): Promise<MusicLibraryTrack[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('Falta VITE_YOUTUBE_API_KEY');
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.');
  return (data.items || []).filter((item: any) => item?.id?.videoId).map((item: any) => ({
    id: '',
    title: item.snippet?.title || 'Sin título',
    artist: item.snippet?.channelTitle || 'YouTube',
    cover_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
    youtube_id: item.id.videoId,
    source_type: 'youtube',
    album: null,
    duration: null,
    user_id: null,
  }));
}

export async function saveYoutubeTrack(profileId: string, track: MusicLibraryTrack) {
  const existing = track.id || (await supabase.from('music_tracks').select('id').eq('user_id', profileId).eq('youtube_id', track.youtube_id).maybeSingle()).data?.id;
  if (existing) return existing;
  const { data, error } = await supabase.from('music_tracks').insert({
    user_id: profileId,
    title: track.title,
    artist: track.artist,
    cover_url: track.cover_url,
    youtube_id: track.youtube_id,
    source_type: 'youtube',
  }).select('id').single();
  if (error) throw error;
  return data.id as string;
}
