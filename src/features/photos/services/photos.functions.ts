import { createServerFn } from '@tanstack/react-start';

async function requireUser() {
  const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return { supabase, user: data.user };
}

export const getPhotosFn = createServerFn({ method: 'GET' })
  .validator((data: { limit?: number }) => data)
  .handler(async ({ data }) => {
    const { getSupabaseServerClient } = await import('../../../lib/supabase.server');
    const supabase = getSupabaseServerClient();
    const limit = Math.min(Math.max(data.limit ?? 48, 1), 100);

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, url, caption, created_at, user_id, post_id, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return photos ?? [];
  });

export const uploadPhotoFn = createServerFn({ method: 'POST' })
  .validator((data) => {
    if (!(data instanceof FormData)) throw new Error('Expected FormData');
    return data;
  })
  .handler(async ({ data }) => {
    const { supabase, user } = await requireUser();
    const file = data.get('photo');
    const caption = data.get('caption')?.toString().trim() ?? '';

    if (!(file instanceof File)) throw new Error('Selecciona una foto');
    if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen');

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path);
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: caption, type: 'photo' } as any)
      .select('id')
      .single();

    if (postError) throw postError;

    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .insert({ user_id: user.id, post_id: (post as any).id, url: publicUrl.publicUrl, caption } as any)
      .select('id, url, caption, created_at, user_id, post_id')
      .single();

    if (photoError) throw photoError;
    return photo;
  });
