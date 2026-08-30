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

  // Force Supabase to refresh the JWT before sending it to our API proxy.
  // A stale JWT was causing /auth/v1/user to answer 401 even though the UI
  // still showed the user as logged in.
  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error('La sesión de Supabase ha caducado. Vuelve a iniciar sesión.');
  }

  const token = refreshed.data.session?.access_token;
  if (!token) throw new Error('No hay una sesión activa en Supabase.');
  return token;
}

export async function fetchPosts(limit = 100): Promise<ApiPost[]> {
  const response = await fetch(`/api/posts?limit=${encodeURIComponent(String(limit))}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Posts load failed (${response.status})${body ? `: ${body}` : ''}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createPost(content: string, mediaUrl?: string): Promise<ApiPost> {
  const token = await getAccessToken();

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'omit',
    body: JSON.stringify({ content, media_url: mediaUrl || null, access_token: token }),
  });

  const body = await response.text();
  if (!response.ok) {
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message || parsed.error || body;
    } catch {
      // Keep the raw response when it is not JSON.
    }
    throw new Error(`Post create failed (${response.status}): ${detail || 'respuesta vacía del servidor'}`);
  }

  return JSON.parse(body) as ApiPost;
}
