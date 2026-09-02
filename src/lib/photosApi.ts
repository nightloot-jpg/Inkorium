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
  etiquetas?: any[];
  comentarios?: any[];
  likes?: string[];
  privacidad?: string;
  allowedUserIds?: string[];
}

async function getAccessToken(required = false): Promise<string | null> {
  if (!supabase) {
    if (required) throw new Error('SUPABASE_NOT_CONFIGURED');
    return null;
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && required) throw new Error(error.message || 'AUTH_SESSION_FAILED');
    const token = data.session?.access_token || null;
    if (!token && required) throw new Error('AUTH_REQUIRED');
    return token;
  } catch (err) {
    if (required) throw err;
    return null;
  }
}

async function requestPhotos<T>(body: Record<string, unknown>, requireAuth = false): Promise<T> {
  const token = await getAccessToken(requireAuth);
  const payload: Record<string, unknown> = { ...body };
  if (token) payload.access_token = token;

  const response = await fetch('/api/photos', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'omit',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  const raw = await response.text().catch(() => '');
  if (!response.ok) {
    let detail = raw;
    try {
      const parsed = JSON.parse(raw);
      detail = parsed.message || parsed.error || raw;
    } catch {}
    const compact = typeof detail === 'string' ? detail.replace(/\s+/g, ' ').slice(0, 500) : '';
    throw new Error(`${response.status}: ${compact || 'respuesta vacía del servidor'}`);
  }
  try { return (raw ? JSON.parse(raw) : null) as T; }
  catch { throw new Error('PHOTOS_API_INVALID_RESPONSE'); }
}

export async function fetchPhotos(): Promise<PhotoRow[]> {
  try {
    const data = await requestPhotos<PhotoRow[]>({ action: 'list' }, false);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // If /api/photos fails, try direct Supabase query if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('id,user_id,album_id,storage_path,url,caption,visibility,created_at,updated_at')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data as PhotoRow[];
        }
      } catch {}
    }
    return [];
  }
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
  }, true);
}

export async function addPhotoTagApi(photoId: string, tag: any): Promise<any> {
  try {
    return await requestPhotos({ action: 'add_tag', photoId, tag }, false);
  } catch (err) {
    console.warn('addPhotoTagApi failed:', err);
    return null;
  }
}

export async function removePhotoTagApi(photoId: string, tagId: string): Promise<any> {
  try {
    return await requestPhotos({ action: 'remove_tag', photoId, tagId }, false);
  } catch (err) {
    console.warn('removePhotoTagApi failed:', err);
    return null;
  }
}

export async function updatePhotoTagsApi(photoId: string, tags: any[]): Promise<any> {
  try {
    return await requestPhotos({ action: 'update_tags', photoId, tags }, false);
  } catch (err) {
    console.warn('updatePhotoTagsApi failed:', err);
    return null;
  }
}

export async function updatePhotoPrivacyApi(photoId: string, privacidad: string, allowedUserIds: string[]): Promise<any> {
  try {
    return await requestPhotos({ action: 'update_privacy', photoId, privacidad, allowedUserIds }, false);
  } catch (err) {
    console.warn('updatePhotoPrivacyApi failed:', err);
    return null;
  }
}

export async function addPhotoCommentApi(photoId: string, comment: any): Promise<any> {
  try {
    return await requestPhotos({ action: 'add_comment', photoId, comment }, false);
  } catch (err) {
    console.warn('addPhotoCommentApi failed:', err);
    return null;
  }
}

export async function likePhotoApi(photoId: string, userId: string): Promise<any> {
  try {
    return await requestPhotos({ action: 'like', photoId, userId }, false);
  } catch (err) {
    console.warn('likePhotoApi failed:', err);
    return null;
  }
}
