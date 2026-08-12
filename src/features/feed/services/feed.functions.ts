import { createServerFn } from '@tanstack/react-start';
import type { FeedPost } from '../types';

async function getServerSupabase() {
  const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
  return getSupabaseServerClient();
}

async function requireUser() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('No autenticado');
  return { supabase, user: data.user };
}

export const getFeedFn = createServerFn({ method: 'GET' }).handler(async (): Promise<FeedPost[]> => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from('posts')
    .select('id,user_id,content,type,created_at,profiles!inner(full_name,avatar_url),photos(url),likes(user_id),comments(id),post_shares(id)')
    .order('created_at', { ascending: false }).limit(20);
  if (error) throw new Error(`Feed query failed: ${error.message}`);
  return (data ?? []).map((post: any) => {
    const name = post.profiles?.full_name || 'Usuario';
    const likes = post.likes ?? [];
    return { id: post.id, userId: post.user_id, authorName: name,
      authorAvatar: post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e8eef7&color=164b88`,
      createdAt: post.created_at, content: post.content || '',
      kind: post.type === 'music' ? 'music' : post.type === 'photo' ? 'photo' : 'text',
      title: post.content?.split('\n')[0] || undefined, subtitle: post.type === 'music' ? 'MHR MUSIC' : undefined,
      duration: post.type === 'music' ? '5:05' : undefined, image: post.photos?.[0]?.url || undefined,
      likes: likes.length, liked: likes.some((like: any) => like.user_id === user.id),
      comments: post.comments?.length || 0, shares: post.post_shares?.length || 0 } satisfies FeedPost;
  });
});

export const createFeedPostFn = createServerFn({ method: 'POST' }).validator((data: FormData) => data).handler(async ({ data }) => {
  const { supabase, user } = await requireUser();
  const content = data.get('content')?.toString().trim() || '';
  const type = data.get('type')?.toString() === 'photo' ? 'photo' : 'text';
  const photos = data.getAll('photos').filter((value): value is File => value instanceof File).slice(0, 4);
  if (!content && photos.length === 0) throw new Error('La publicación está vacía');
  const { data: post, error } = await supabase.from('posts').insert({ user_id: user.id, content, type } as any).select('id,user_id,content,type,created_at').single();
  if (error) throw new Error(`Create post failed: ${error.message}`);
  for (const photo of photos) {
    const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, photo, { upsert: false });
    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
    const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path);
    const { error: photoError } = await supabase.from('photos').insert({ user_id: user.id, post_id: post.id, url: publicUrl.publicUrl } as any);
    if (photoError) throw new Error(`Photo record failed: ${photoError.message}`);
  }
  return post;
});

export const toggleLikeFn = createServerFn({ method: 'POST' }).validator((data: { postId: string; liked: boolean }) => data).handler(async ({ data }) => {
  const { supabase, user } = await requireUser();
  if (data.liked) {
    const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: data.postId } as any);
    if (error && error.code !== '23505') throw new Error(`Like failed: ${error.message}`);
  } else {
    const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', data.postId);
    if (error) throw new Error(`Unlike failed: ${error.message}`);
  }
});
