import type { Post } from '../types';
import { addCommentFn, createPostFn, deletePostFn, editPostFn, getPostsFn, likePostFn, unlikePostFn } from './feed.functions';

const PAGE_SIZE = 10;

export const feedService = {
  async getPosts({ pageParam = 0 }: { pageParam?: number }) {
    const result = await getPostsFn({ data: { pageParam, limit: PAGE_SIZE } });
    return { data: (result.data ?? []) as unknown as Post[], nextPage: result.nextPage };
  },
  async createPost({ content, type, photos }: { content: string; type: string; photos: File[] }) {
    const formData = new FormData();
    formData.set('content', content);
    formData.set('type', type);
    photos.forEach((photo) => formData.append('photos', photo, photo.name));
    return createPostFn({ data: formData });
  },
  async likePost(postId: string) { await likePostFn({ data: { postId } }); },
  async unlikePost(postId: string) { await unlikePostFn({ data: { postId } }); },
  async addComment({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) { return addCommentFn({ data: { postId, content, parentId } }); },
  async deletePost(postId: string) { await deletePostFn({ data: { postId } }); },
  async editPost({ postId, content }: { postId: string; content: string }) { await editPostFn({ data: { postId, content } }); },
};
