import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '../../../lib/realtime/useRealtime';
import { feedService } from '../services/feed.service';

const FEED_QUERY_KEY = ['feed'] as const;

export function useFeed() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
  useRealtime({ table: 'posts', onEvent: refresh });
  useRealtime({ table: 'comments', onEvent: refresh });
  useRealtime({ table: 'likes', onEvent: refresh });

  const feed = useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: ({ pageParam }) => feedService.getPosts({ pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: mounted,
    staleTime: 15_000,
    retry: 1,
  });

  const createPost = useMutation({ mutationFn: feedService.createPost, onSuccess: refresh });
  const likePost = useMutation({ mutationFn: feedService.likePost, onSuccess: refresh });
  const unlikePost = useMutation({ mutationFn: feedService.unlikePost, onSuccess: refresh });
  const addComment = useMutation({ mutationFn: feedService.addComment, onSuccess: refresh });
  const deletePost = useMutation({ mutationFn: feedService.deletePost, onSuccess: refresh });
  const editPost = useMutation({ mutationFn: feedService.editPost, onSuccess: refresh });

  return { ...feed, createPost, likePost, unlikePost, addComment, deletePost, editPost };
}
