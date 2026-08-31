import { supabase } from './supabase';

export interface PhotoRow {
  id: string;
  user_id: string;
  album_id: string | null;
  storage_path: string;
  url: string;
  caption: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export async function fetchPhotos(): Promise<PhotoRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('photos').select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at').order('created_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as PhotoRow[]) : [];
}

export async function insertPhoto(input: { userId: string; albumId?: string | null; url: string; caption?: string | null; visibility?: 'public' | 'friends' | 'private' }): Promise<PhotoRow> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.from('photos').insert({ user_id: input.userId, album_id: input.albumId ?? null, storage_path: input.url, url: input.url, caption: input.caption ?? null, visibility: input.visibility ?? 'public' }).select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at').single();
  if (error) throw error;
  return data as PhotoRow;
}
