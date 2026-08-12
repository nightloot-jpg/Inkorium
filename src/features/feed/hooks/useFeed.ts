import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';
import { useRealtime } from '../../../lib/realtime/useRealtime';
import type { Post } from '../types';

// Fallback data must be deterministic. Generating timestamps with Date.now()
// during module evaluation creates different server/client HTML in SSR builds.
const FALLBACK_POSTS = [
  {
    id: 'feed-fallback-1',
    user_id: 'feed-fallback-user',
    content: 'MHR, EFY & SNEZ! - Hola',
    type: 'music',
    created_at: '2026-08-11T20:00:00.000Z',
    profiles: { full_name: 'Inkorium', avatar_url: null },
    photos: [],
    comments: [],
    likes: [],
    post_shares: [],
  },
  {
    id: 'feed-fallback-2',
    user_id: 'feed-fallback-user',
    content: 'Inalcanzable',
    type: 'music',
    created_at: '2026-08-11T19:59:00.000Z',
    profiles: { full_name: 'Inkorium', avatar_url: null },
    photos: [],
    comments: [],
    likes: [],
    post_shares: [],
  },
] as unknown as Post[];

export const useFeed = () => {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['feed'] });

  useRealtime({ table: 'posts', onEvent: refresh });
  useRealtime({ table: 'comments', onEvent: refresh });
  useRealtime({ table: 'likes', onEvent: refresh });

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      try {
        return await feedService.getPosts({ pageParam });
      } catch {
        return {
          data: pageParam === 0 ? FALLBACK_POSTS : [],
          nextPage: undefined,
        };
      }
    },
    initialPageParam: 0,
    enabled: isMounted,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 15_000,
    retry: false,
  });

  const createPost = useMutation({ mutationFn: feedService.createPost, onSuccess: refresh });
  const deletePost = useMutation({ mutationFn: feedService.deletePost, onSuccess: refresh });
  const editPost = useMutation({ mutationFn: feedService.editPost, onSuccess: refresh });
  const likePost = useMutation({ mutationFn: feedService.likePost, onSuccess: refresh });
  const unlikePost = useMutation({ mutationFn: feedService.unlikePost, onSuccess: refresh });
  const addComment = useMutation({ mutationFn: feedService.addComment, onSuccess: refresh });

  return {
    ...feedQuery,
    createPost,
    deletePost,
    editPost,
    likePost,
    unlikePost,
    addComment,
  };
};
