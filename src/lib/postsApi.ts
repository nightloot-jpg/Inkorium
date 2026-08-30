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

export async function fetchPosts(limit = 100): Promise<ApiPost[]> {
  const response = await fetch(`/api/posts?limit=${encodeURIComponent(String(limit))}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Posts load failed (${response.status})`);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createPost(content: string, mediaUrl?: string): Promise<ApiPost> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('No hay una sesión activa.');

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ content, media_url: mediaUrl || null, access_token: token }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Post create failed (${response.status})${body ? `: ${body}` : ''}`);
  return JSON.parse(body) as ApiPost;
}
