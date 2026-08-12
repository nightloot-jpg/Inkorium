import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedPostFn, getFeedFn } from '../services/feed.functions';
import type { CreateFeedPostInput, FeedPost } from '../types';

const FEED_KEY = ['inkorium-feed'];

export function useFeed() {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const feed = useQuery<FeedPost[]>({ queryKey: FEED_KEY, queryFn: () => getFeedFn(), enabled: hydrated, staleTime: 15_000, retry: 1 });
  const createPost = useMutation({ mutationFn: (input: CreateFeedPostInput) => createFeedPostFn({ data: input }), onSuccess: () => queryClient.invalidateQueries({ queryKey: FEED_KEY }) });

  const toggleLike = (postId: string) => queryClient.setQueryData<FeedPost[]>(FEED_KEY, posts => posts?.map(post => post.id === postId ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post));
  return { ...feed, createPost, toggleLike };
}
