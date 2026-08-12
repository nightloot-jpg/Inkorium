import { createServerFn } from '@tanstack/react-start';

async function requireUser() {
  const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return { supabase, user: data.user };
}

export const getPostsFn = createServerFn({ method: 'GET' })
  .validator((data: { pageParam?: number; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
    const supabase = getSupabaseServerClient();
    const limit = Math.min(Math.max(data.limit ?? 10, 1), 20);
    const pageParam = Math.max(data.pageParam ?? 0, 0);
    const from = pageParam * limit;
    const to = from + limit - 1;

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`*, profiles(*), photos(*), comments(*, profiles(*)), likes(*), post_shares(id)`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Feed query failed: ${error.message}`);

    const rows = posts ?? [];
    return {
      data: rows,
      nextPage: rows.length === limit ? pageParam + 1 : undefined,
    };
  });

export const createPostFn = createServerFn({ method: 'POST' })
  .validator((data) => {
    if (!(data instanceof FormData)) throw new Error('Expected FormData');
    return data;
  })
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const content = data.get('content')?.toString().trim() ?? '';
    const type = data.get('type')?.toString() || 'text';
    const photos = data.getAll('photos').filter((value): value is File => value instanceof File);
    if (!content && photos.length === 0) throw new Error('La publicación está vacía');

    const { data: post, error } = await supabase.from('posts').insert({ user_id: user.id, content, type } as any).select().single();
    if (error) throw new Error(`Create post failed: ${error.message}`);

    for (const photo of photos.slice(0, 4)) {
      const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, photo, { upsert: false });
      if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
      const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path);
      const { error: photoError } = await supabase.from('photos').insert({ user_id: user.id, post_id: (post as any).id, url: publicUrl.publicUrl } as any);
      if (photoError) throw new Error(`Photo record failed: ${photoError.message}`);
    }
    return post;
  });

export const likePostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string }) => data)
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: data.postId } as any);
    if (error && error.code !== '23505') throw new Error(`Like failed: ${error.message}`);
  });

export const unlikePostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string }) => data)
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', data.postId);
    if (error) throw new Error(`Unlike failed: ${error.message}`);
  });

export const addCommentFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string; content: string; parentId?: string }) => data)
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const content = data.content.trim();
    if (!content) throw new Error('El comentario está vacío');
    const { data: comment, error } = await supabase.from('comments').insert({ user_id: user.id, post_id: data.postId, content, parent_id: data.parentId || null } as any).select('*, profiles(*)').single();
    if (error) throw new Error(`Comment failed: ${error.message}`);
    return comment;
  });

export const deletePostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string }) => data)
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from('posts').delete().eq('id', data.postId).eq('user_id', user.id);
    if (error) throw new Error(`Delete post failed: ${error.message}`);
  });

export const editPostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string; content: string }) => data)
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const content = data.content.trim();
    const { error } = await supabase.from('posts').update({ content, updated_at: new Date().toISOString() } as any).eq('id', data.postId).eq('user_id', user.id);
    if (error) throw new Error(`Edit post failed: ${error.message}`);
  });
