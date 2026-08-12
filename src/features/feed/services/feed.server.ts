import { getSupabaseServerClient } from '../../../lib/supabase.server';

const PAGE_SIZE = 10;

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('No autenticado');
  return { supabase, user: data.user };
}

export async function getPosts({ pageParam = 0, limit = PAGE_SIZE }: { pageParam?: number; limit?: number }) {
  const { supabase } = await requireUser();
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const page = Math.max(pageParam, 0);
  const from = page * safeLimit;
  const to = from + safeLimit - 1;

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!inner(*), photos(*), comments(*, profiles(*)), likes(*), post_shares(id)')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Feed: ${error.message}`);
  const posts = data ?? [];
  return { data: posts, nextPage: posts.length === safeLimit ? page + 1 : undefined };
}

export async function createPost(data: FormData) {
  const { supabase, user } = await requireUser();
  const content = data.get('content')?.toString().trim() ?? '';
  const type = data.get('type')?.toString() || 'text';
  const photos = data.getAll('photos').filter((value): value is File => value instanceof File);
  if (!content && photos.length === 0) throw new Error('La publicación está vacía');

  const { data: post, error } = await supabase.from('posts').insert({ user_id: user.id, content, type } as any).select().single();
  if (error) throw new Error(`Publicación: ${error.message}`);

  for (const photo of photos.slice(0, 4)) {
    const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, photo, { upsert: false });
    if (uploadError) throw new Error(`Foto: ${uploadError.message}`);
    const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path);
    const { error: photoError } = await supabase.from('photos').insert({ user_id: user.id, post_id: (post as any).id, url: publicUrl.publicUrl } as any);
    if (photoError) throw new Error(`Foto: ${photoError.message}`);
  }
  return post;
}

export async function likePost(postId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: postId } as any);
  if (error && error.code !== '23505') throw new Error(`Me gusta: ${error.message}`);
}

export async function unlikePost(postId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
  if (error) throw new Error(`Me gusta: ${error.message}`);
}

export async function addComment({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) {
  const { supabase, user } = await requireUser();
  const text = content.trim();
  if (!text) throw new Error('El comentario está vacío');
  const { data, error } = await supabase.from('comments').insert({ user_id: user.id, post_id: postId, content: text, parent_id: parentId || null } as any).select('*, profiles(*)').single();
  if (error) throw new Error(`Comentario: ${error.message}`);
  return data;
}

export async function deletePost(postId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
  if (error) throw new Error(`Eliminar: ${error.message}`);
}

export async function editPost({ postId, content }: { postId: string; content: string }) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('posts').update({ content: content.trim(), updated_at: new Date().toISOString() } as any).eq('id', postId).eq('user_id', user.id);
  if (error) throw new Error(`Editar: ${error.message}`);
}
