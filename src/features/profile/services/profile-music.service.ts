import { supabase } from '../../../lib/supabase';

export type MusicTrack = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  youtube_id: string | null;
  source_type: string;
};

export type MusicDiaryEntry = {
  id: string;
  entry_date: string;
  created_at: string;
  track_id: string;
  track: MusicTrack | null;
};

export async function getProfileMusicDiary(profileId: string): Promise<MusicDiaryEntry[]> {
  const { data, error } = await supabase
    .from('profile_music_diary')
    .select('id,entry_date,created_at,track_id,music_tracks(id,title,artist,cover_url,youtube_id,source_type)')
    .eq('user_id', profileId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return ((data || []) as any[]).map(row => ({
    id: row.id,
    entry_date: row.entry_date,
    created_at: row.created_at,
    track_id: row.track_id,
    track: row.music_tracks || null,
  }));
}

export async function syncDailySongToDiary(profileId: string, entryDate = new Date().toISOString().slice(0, 10)) {
  const { data: daily, error: dailyError } = await supabase
    .from('profile_song_of_day')
    .select('track_id')
    .eq('user_id', profileId)
    .maybeSingle();

  if (dailyError || !daily?.track_id) return;

  const { data: diary, error: diaryError } = await supabase
    .from('profile_music_diary')
    .select('id,track_id')
    .eq('user_id', profileId)
    .eq('entry_date', entryDate)
    .maybeSingle();

  if (diaryError) return;

  if (!diary) {
    await supabase.from('profile_music_diary').insert({
      user_id: profileId,
      track_id: daily.track_id,
      entry_date: entryDate,
    });
  } else if (diary.track_id !== daily.track_id) {
    await supabase
      .from('profile_music_diary')
      .update({ track_id: daily.track_id, created_at: new Date().toISOString() })
      .eq('id', diary.id)
      .eq('user_id', profileId);
  }
}
