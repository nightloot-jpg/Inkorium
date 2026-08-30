import { supabase } from './supabase';

export interface ApiPost {
  id: string;
  author_id: string;
  content: string;
  visibility: string;
  media_data?: unknown;
  created_at: string;
  updated_at?: string;
}

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const current = await supabase.auth.getSession();
  const token = current.data.session?.access_token;
  if (!token) throw new Error('No hay una sesión activa en Supabase.');
  return token;
}

async function parseResponse(response: Response) {
  const body = await response.text().catch(() => '');
  if (!response.ok) {
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message || parsed.error || body;
    } catch {}
    throw new Error(`${response.status}: ${detail || 'respuesta vacía del servidor'}`);
  }
  return body ? JSON.parse(body) : null;
}

export async function fetchPosts(limit = 100): Promise<ApiPost[]> {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 100));
  const response = await fetch(`/api/posts?limit=${encodeURIComponent(String(safeLimit))}`, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    cache: 'no-store',
  });
  const data = await parseResponse(response);
  return Array.isArray(data) ? data as ApiPost[] : [];
}

export async function createPost(content: string, mediaUrl?: string): Promise<ApiPost> {
  const token = await getAccessToken();
  const normalizedContent = String(content || '').trim();
  const normalizedMediaUrl = mediaUrl ? String(mediaUrl).trim() : null;
  if (!normalizedContent && !normalizedMediaUrl) throw new Error('La publicación está vacía.');

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ content: normalizedContent, media_url: normalizedMediaUrl, access_token: token }),
  });
  const data = await parseResponse(response);
  if (!data) throw new Error('El servidor no devolvió la publicación creada.');
  return data as ApiPost;
}
