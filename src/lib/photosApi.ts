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

async function invokePhotos<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.functions.invoke('photos-api-v2', { body });
  if (error) throw new Error(error.message || 'PHOTOS_API_FAILED');
  return data as T;
}

export async function fetchPhotos(): Promise<PhotoRow[]> {
  const data = await invokePhotos<PhotoRow[]>({ action: 'list' });
  return Array.isArray(data) ? data : [];
}

export async function insertPhoto(input: {
  userId: string;
  albumId?: string | null;
  url: string;
  caption?: string | null;
  visibility?: 'public' | 'friends' | 'private';
}): Promise<PhotoRow> {
  if (!input.userId) throw new Error('AUTH_REQUIRED');
  return invokePhotos<PhotoRow>({
    action: 'create',
    album_id: input.albumId ?? null,
    url: input.url,
    caption: input.caption ?? null,
    visibility: input.visibility ?? 'public',
  });
}
