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
      .select('id, url, caption, created_at, user_id, post_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!photos?.length) return [];

    const userIds = [...new Set(photos.map((photo) => photo.user_id).filter(Boolean))];
    const profilesById = new Map<string, { full_name: string | null; username: string | null; avatar_url: string | null }>();

    if (userIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      for (const profile of profiles ?? []) {
        profilesById.set(profile.id, profile);
      }
    }

    return photos.map((photo) => ({
      ...photo,
      profiles: profilesById.get(photo.user_id) ?? null,
    }));
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