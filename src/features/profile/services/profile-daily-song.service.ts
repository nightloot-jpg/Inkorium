import { supabase } from '../../../lib/supabase';
import { youtubeRequest } from '../../../lib/youtube';

export type DailySongTrack = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  youtube_id: string | null;
  source_type: string;
};

const today = () => new Date().toISOString().slice(0, 10);
export const trackCover = (track: DailySongTrack | null) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');

export async function getDailySong(profileId: string, entryDate = today()) {
  const { data, error } = await supabase.from('profile_music_diary').select('music_tracks(id,title,artist,cover_url,youtube_id,source_type)').eq('user_id', profileId).eq('entry_date', entryDate).maybeSingle();
  if (error) throw error;
  return ((data as any)?.music_tracks || null) as DailySongTrack | null;
}

export async function getSavedMusic(profileId: string) {
  const { data, error } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type').eq('user_id', profileId).order('created_at', { ascending: false }).limit(60);
  if (error) throw error;
  return (data || []) as DailySongTrack[];
}

export async function searchDailySong(query: string): Promise<DailySongTrack[]> {
  const data = await youtubeRequest('search', { q: query, type: 'video', maxResults: 10 });
  return (data.items || [])
    .filter((item: any) => item?.id?.videoId)
    .map((item: any) => ({
      id: '',
      youtube_id: item.id.videoId,
      title: item.snippet?.title || 'Sin título',
      artist: item.snippet?.channelTitle || 'YouTube',
      cover_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      source_type: 'youtube',
    }));
}

export async function saveDailySong(profileId: string, track: DailySongTrack, entryDate = today()) {
  const existing = await supabase.from('profile_music_diary').select('id').eq('user_id', profileId).eq('entry_date', entryDate).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) throw new Error('Ya has elegido tu canción del día. Podrás elegir otra mañana.');
  let trackId = track.id;
  if (!trackId) {
    const created = await supabase.from('music_tracks').insert({ user_id: profileId, title: track.title, artist: track.artist, cover_url: track.cover_url, youtube_id: track.youtube_id, source_type: 'youtube' }).select('id').single();
    if (created.error) throw created.error;
    trackId = created.data.id;
  }
  const result = await supabase.from('profile_music_diary').insert({ user_id: profileId, entry_date: entryDate, track_id: trackId });
  if (result.error) {
    if (result.error.code === '23505') throw new Error('Ya has elegido tu canción del día. Podrás elegir otra mañana.');
    throw result.error;
  }
}
