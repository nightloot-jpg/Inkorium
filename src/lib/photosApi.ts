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

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message || 'AUTH_SESSION_FAILED');
  const token = data.session?.access_token;
  if (!token) throw new Error('AUTH_REQUIRED');
  return token;
}

async function requestPhotos<T>(body: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch('/api/photos', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'omit',
    cache: 'no-store',
    body: JSON.stringify({ ...body, access_token: token }),
  });

  const raw = await response.text().catch(() => '');
  if (!response.ok) {
    let detail = raw;
    try {
      const parsed = JSON.parse(raw);
      detail = parsed.message || parsed.error || raw;
    } catch {
      // Keep the upstream response when it is not JSON.
    }
    const compact = typeof detail === 'string' ? detail.replace(/\s+/g, ' ').slice(0, 500) : '';
    throw new Error(`${response.status}: ${compact || 'respuesta vacía del servidor'}`);
  }

  try {
    return (raw ? JSON.parse(raw) : null) as T;
  } catch {
    throw new Error('PHOTOS_API_INVALID_RESPONSE');
  }
}

export async function fetchPhotos(): Promise<PhotoRow[]> {
  const data = await requestPhotos<PhotoRow[]>({ action: 'list' });
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
  return requestPhotos<PhotoRow>({
    action: 'create',
    album_id: input.albumId ?? null,
    url: input.url,
    caption: input.caption ?? null,
    visibility: input.visibility ?? 'public',
  });
}
