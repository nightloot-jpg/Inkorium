import type { Post } from '../types';
import {
  addCommentFn,
  createPostFn,
  deletePostFn,
  editPostFn,
  getPostsFn,
  likePostFn,
  unlikePostFn,
} from './feed.server';

export const feedService = {
  getPosts: async ({ pageParam = 0 }: { pageParam?: number }) => {
    const result = await getPostsFn({ data: { pageParam } });
    return {
      data: result.data as unknown as Post[],
      nextPage: result.nextPage,
    };
  },

  createPost: async ({ content, type, photos }: { content: string, type: string, photos: File[] }) => {
    const formData = new FormData();
    formData.set('content', content);
    formData.set('type', type);

    for (const photo of photos) {
      formData.append('photos', photo, photo.name);
    }

    return createPostFn({ data: formData });
  },

  likePost: async (postId: string) => {
    await likePostFn({ data: { postId } });
  },

  unlikePost: async (postId: string) => {
    await unlikePostFn({ data: { postId } });
  },

  addComment: async ({ postId, content, parentId }: { postId: string, content: string, parentId?: string }) => {
    return addCommentFn({ data: { postId, content, parentId } });
  },

  deletePost: async (postId: string) => {
    await deletePostFn({ data: { postId } });
  },

  editPost: async ({ postId, content }: { postId: string, content: string }) => {
    await editPostFn({ data: { postId, content } });
  },
};
