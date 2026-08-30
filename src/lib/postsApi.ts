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

async function getAuthenticatedUser() {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const refreshed = await supabase.auth.refreshSession();
  if (!refreshed.error && refreshed.data.session?.user) {
    return refreshed.data.session.user;
  }

  const current = await supabase.auth.getUser();
  if (current.error || !current.data.user) {
    const message = current.error?.message || refreshed.error?.message || 'No hay una sesión activa en Supabase.';
    throw new Error(message);
  }
  return current.data.user;
}

export async function fetchPosts(limit = 100): Promise<ApiPost[]> {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 100));
  const { data, error } = await supabase
    .from('posts')
    .select('id,author_id,content,visibility,media_data,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(`Posts load failed: ${error.message}`);
  return (data || []) as ApiPost[];
}

export async function createPost(content: string, mediaUrl?: string): Promise<ApiPost> {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const normalizedContent = String(content || '').trim();
  const normalizedMediaUrl = mediaUrl ? String(mediaUrl).trim() : null;
  if (!normalizedContent && !normalizedMediaUrl) {
    throw new Error('La publicación está vacía.');
  }

  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: normalizedContent,
      visibility: 'public',
      media_data: normalizedMediaUrl ? { url: normalizedMediaUrl } : null,
    })
    .select('id,author_id,content,visibility,media_data,created_at,updated_at')
    .single();

  if (error) throw new Error(`Post create failed: ${error.message}`);
  if (!data) throw new Error('Post create failed: Supabase no devolvió la publicación.');
  return data as ApiPost;
}
