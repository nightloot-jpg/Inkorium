import { supabase } from '../../../lib/supabase';
import type { Post } from '../types';
import { getPostsFn } from './feed.server';

export const feedService = {
  getPosts: async ({ pageParam = 0 }: { pageParam?: number }) => {
    const result = await getPostsFn({ data: { pageParam } });
    return {
      data: result.data as unknown as Post[],
      nextPage: result.nextPage,
    };
  },

  createPost: async ({ content, type, photos }: { content: string, type: string, photos: File[] }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userData.user.id,
        content,
        type,
      } as any)
      .select()
      .single();

    if (error) throw error;

    if (photos.length > 0) {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${userData.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        await supabase.from('photos').insert({
          user_id: userData.user.id,
          post_id: (data as any).id,
          url: publicUrlData.publicUrl,
        } as any);
      }
    }

    return data;
  },

  likePost: async (postId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userData.user.id, post_id: postId } as any);

    if (error) throw error;
  },

  unlikePost: async (postId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('post_id', postId);

    if (error) throw error;
  },

  addComment: async ({ postId, content, parentId }: { postId: string, content: string, parentId?: string }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userData.user.id,
        post_id: postId,
        content,
        parent_id: parentId || null
      } as any)
      .select('*, profiles(*)')
      .single();

    if (error) throw error;
    return data;
  },

  deletePost: async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  editPost: async ({ postId, content }: { postId: string, content: string }) => {
    const { error } = await supabase
      .from('posts')
      .update({ content, updated_at: new Date().toISOString() } as never)
      .eq('id', postId);

    if (error) throw error;
  }
};
