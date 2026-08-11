import { createServerFn } from '@tanstack/react-start'
import {
  addComment,
  createPost,
  deletePost,
  editPost,
  getPosts,
  likePost,
  unlikePost,
} from './feed.server'

export const getPostsFn = createServerFn({ method: 'GET' })
  .validator((data: { pageParam?: number }) => data)
  .handler(({ data }) => getPosts(data.pageParam ?? 0))

export const createPostFn = createServerFn({ method: 'POST' })
  .validator((data) => {
    if (!(data instanceof FormData)) throw new Error('Expected FormData')
    return data
  })
  .handler(({ data }) => createPost(data))

export const likePostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string }) => data)
  .handler(({ data }) => likePost(data.postId))

export const unlikePostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string }) => data)
  .handler(({ data }) => unlikePost(data.postId))

export const addCommentFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string; content: string; parentId?: string }) => data)
  .handler(({ data }) => addComment(data))

export const deletePostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string }) => data)
  .handler(({ data }) => deletePost(data.postId))

export const editPostFn = createServerFn({ method: 'POST' })
  .validator((data: { postId: string; content: string }) => data)
  .handler(({ data }) => editPost(data))
