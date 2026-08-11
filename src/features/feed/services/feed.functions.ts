import { createServerFn } from '@tanstack/react-start';

const FALLBACK_MUSIC = [
  {
    id: 'demo-mhr',
    userId: 'demo',
    authorName: 'nightloot',
    authorAvatar: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=96&q=80',
    createdAt: new Date(Date.now() - 31 * 60_000).toISOString(),
    content: 'MHR, EFY & SNEZ! - Hola',
    kind: 'music' as const,
    title: 'MHR, EFY & SNEZ! - Hola',
    subtitle: 'MHR MUSIC',
    duration: '5:05',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80',
    likes: 6,
    liked: false,
    comments: 0,
    shares: 0,
  },
  {
    id: 'demo-inalcanzable',
    userId: 'demo',
    authorName: 'nightloot',
    authorAvatar: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=96&q=80',
    createdAt: new Date(Date.now() - 31 * 60_000).toISOString(),
    content: 'Inalcanzable',
    kind: 'music' as const,
    title: 'Inalcanzable',
    subtitle: 'Rels B, Duki',
    duration: 'Playlist',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=640&q=80',
    likes: 6,
    liked: false,
    comments: 0,
    shares: 0,
  },
];

function demoPosts() {
  return FALLBACK_MUSIC.map((post) => ({ ...post }));
}

export const getFeedFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
    const supabase = getSupabaseServerClient();
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id,user_id,content,type,created_at')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error || !posts?.length) return demoPosts();

    return posts.map((post) => ({
      id: post.id,
      userId: post.user_id,
      authorName: 'Usuario',
      authorAvatar: 'https://ui-avatars.com/api/?name=Usuario&background=e8eef7&color=164b88',
      createdAt: post.created_at,
      content: post.content ?? '',
      kind: post.type === 'photo' ? 'photo' : 'text',
      likes: 0,
      liked: false,
      comments: 0,
      shares: 0,
    }));
  } catch {
    return demoPosts();
  }
});

export const createFeedPostFn = createServerFn({ method: 'POST' })
  .validator((data: { content: string; kind: 'text' | 'photo' }) => data)
  .handler(async ({ data }) => {
    const content = data.content.trim();
    if (!content) throw new Error('La publicación está vacía');

    const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
    const supabase = getSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Not authenticated');

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ user_id: auth.user.id, content, type: data.kind })
      .select('id,user_id,content,type,created_at')
      .single();

    if (error) throw error;
    return post;
  });
