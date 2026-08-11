import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';
import { useRealtime } from '../../../lib/realtime/useRealtime';

export const useFeed = () => {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  // Keep the first client render identical to SSR. React 19 treats a
  // server/client branch in render (for example typeof window) as a possible
  // hydration mismatch. The feed starts disabled on both sides and is enabled
  // only after hydration completes.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useRealtime({
    table: 'posts',
    onEvent: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  useRealtime({
    table: 'comments',
    onEvent: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  useRealtime({
    table: 'likes',
    onEvent: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: feedService.getPosts,
    initialPageParam: 0,
    enabled: isMounted,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const createPost = useMutation({
    mutationFn: feedService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deletePost = useMutation({
    mutationFn: feedService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const editPost = useMutation({
    mutationFn: feedService.editPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const likePost = useMutation({
    mutationFn: feedService.likePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const unlikePost = useMutation({
    mutationFn: feedService.unlikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const addComment = useMutation({
    mutationFn: feedService.addComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

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
