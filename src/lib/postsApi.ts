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
      detail = parsed.message || parsed.error || parsed;
    } catch {
      // Keep non-JSON responses concise below.
    }
    const compactDetail = typeof detail === 'string' ? detail.replace(/\s+/g, ' ').slice(0, 500) : '';
    throw new Error(`${response.status}: ${compactDetail || 'respuesta vacía del servidor'}`);
  }
  if (!body || !body.trim()) return null;
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida (no es JSON).');
  }
}

function isTransientGatewayStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 520 || status === 521 || status === 522 || status === 523 || status === 524;
}

async function requestCreatePost(token: string, content: string, mediaUrl: string | null): Promise<Response> {
  const maxAttempts = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ content, media_url: mediaUrl, access_token: token }),
    });

    if (response.ok || !isTransientGatewayStatus(response.status) || attempt === maxAttempts) {
      return response;
    }

    lastResponse = response;
    await new Promise(resolve => setTimeout(resolve, attempt * 700));
  }

  return lastResponse as Response;
}

export async function fetchPosts(limit = 100): Promise<ApiPost[]> {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 100));
  try {
    const response = await fetch(`/api/posts?limit=${encodeURIComponent(String(safeLimit))}`, {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
    });
    const data = await parseResponse(response);
    return Array.isArray(data) ? data as ApiPost[] : [];
  } catch (error) {
    // If API endpoint fails or returned HTML, try querying Supabase directly if available
    if (supabase) {
      try {
        const { data, error: sbError } = await supabase
          .from('posts')
          .select('id,author_id,content,visibility,media_data,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(safeLimit);
        if (!sbError && Array.isArray(data)) {
          return data as ApiPost[];
        }
      } catch {
        // ignore fallback errors
      }
    }
    return [];
  }
}

export async function createPost(content: string, mediaUrl?: string): Promise<ApiPost> {
  const token = await getAccessToken();
  const normalizedContent = String(content || '').trim();
  const normalizedMediaUrl = mediaUrl ? String(mediaUrl).trim() : null;
  if (!normalizedContent && !normalizedMediaUrl) throw new Error('La publicación está vacía.');

  const response = await requestCreatePost(token, normalizedContent, normalizedMediaUrl);
  const data = await parseResponse(response);
  if (!data) throw new Error('El servidor no devolvió la publicación creada.');
  return data as ApiPost;
}
