import { createServerFn } from '@tanstack/react-start';
import { createFeedPost, getFeed, toggleLike } from './feed.server';

export const getFeedFn = createServerFn({ method: 'GET' }).handler(() => getFeed());

export const createFeedPostFn = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(({ data }) => createFeedPost(data));

export const toggleLikeFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string; liked: boolean }) => data)
  .handler(({ data }) => toggleLike(data));
