import { createServerFn } from '@tanstack/react-start';
import type { CreateFeedPostInput, FeedPost } from '../types';

async function getServerSupabase() {
  const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
  return getSupabaseServerClient();
}

async function requireUser() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return { supabase, user: data.user };
}

export const getFeedFn = createServerFn({ method: 'GET' }).handler(async (): Promise<FeedPost[]> => {
  const { supabase, user } = await requireUser();
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (postsError) throw new Error(`Feed posts query failed: ${postsError.message}`);

  const rows = posts ?? [];
  const postIds = rows.map((post) => post.id);
  const userIds = [...new Set(rows.map((post) => post.user_id))];
  if (postIds.length === 0) return [];

  const [profilesResult, photosResult, commentsResult, likesResult, sharesResult] = await Promise.all([
    userIds.length ? supabase.from('profiles').select('*').in('id', userIds) : Promise.resolve({ data: [], error: null }),
    supabase.from('photos').select('*').in('post_id', postIds),
    supabase.from('comments').select('*').in('post_id', postIds).order('created_at', { ascending: true }),
    supabase.from('likes').select('*').in('post_id', postIds),
    supabase.from('post_shares').select('id, post_id').in('post_id', postIds),
  ]);

  if (profilesResult.error) throw new Error(`Feed profiles query failed: ${profilesResult.error.message}`);
  if (photosResult.error) throw new Error(`Feed photos query failed: ${photosResult.error.message}`);
  if (commentsResult.error) throw new Error(`Feed comments query failed: ${commentsResult.error.message}`);
  if (likesResult.error) throw new Error(`Feed likes query failed: ${likesResult.error.message}`);
  if (sharesResult.error) throw new Error(`Feed shares query failed: ${sharesResult.error.message}`);

  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const comments = commentsResult.data ?? [];
  const photos = photosResult.data ?? [];
  const likes = likesResult.data ?? [];
  const shares = sharesResult.data ?? [];

  return rows.map((post) => {
    const profile = profiles.get(post.user_id);
    const postLikes = likes.filter((like) => like.post_id === post.id);
    const postComments = comments.filter((comment) => comment.post_id === post.id);
    const postShares = shares.filter((share) => share.post_id === post.id);
    const name = profile?.full_name || 'Usuario';

    return {
      id: post.id,
      userId: post.user_id,
      authorName: name,
      authorAvatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e8eef7&color=164b88`,
      createdAt: post.created_at,
      content: post.content || '',
      kind: post.type === 'music' ? 'music' : post.type === 'photo' ? 'photo' : 'text',
      title: post.content?.split('\n')[0] || undefined,
      subtitle: post.type === 'music' ? 'MHR MUSIC' : undefined,
      duration: post.type === 'music' ? '5:05' : undefined,
      image: photos.find((photo) => photo.post_id === post.id)?.url || undefined,
      likes: postLikes.length,
      liked: postLikes.some((like) => like.user_id === user.id),
      comments: postComments.length,
      shares: postShares.length,
    } satisfies FeedPost;
  });
});

export const createFeedPostFn = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
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

export const toggleLikeFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string; liked: boolean }) => data)
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    if (data.liked) {
      const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: data.postId } as any);
      if (error && error.code !== '23505') throw new Error(`Like failed: ${error.message}`);
    } else {
      const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', data.postId);
      if (error) throw new Error(`Unlike failed: ${error.message}`);
    }
  });
