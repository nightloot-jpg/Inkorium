import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedPostFn, getFeedFn } from '../services/feed.functions';
import type { CreateFeedPostInput, FeedPost } from '../types';

const FEED_KEY = ['inkorium-feed'] as const;

const FALLBACK_FEED: FeedPost[] = [
  {
    id: 'fallback-mhr',
    userId: 'fallback',
    authorName: 'nightloot',
    authorAvatar: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=96&q=80',
    createdAt: new Date(Date.now() - 31 * 60_000).toISOString(),
    content: 'MHR, EFY & SNEZ! - Hola',
    kind: 'music',
    title: 'MHR, EFY & SNEZ! - Hola',
    subtitle: 'MHR MUSIC',
    duration: '5:05',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80',
    likes: 6,
    liked: false,
    comments: 0,
    shares: 0,
  },
  {
    id: 'fallback-inalcanzable',
    userId: 'fallback',
    authorName: 'nightloot',
    authorAvatar: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=96&q=80',
    createdAt: new Date(Date.now() - 38 * 60_000).toISOString(),
    content: 'Inalcanzable',
    kind: 'music',
    title: 'Inalcanzable',
    subtitle: 'Rels B, Duki',
    duration: 'Playlist',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=640&q=80',
    likes: 4,
    liked: false,
    comments: 2,
    shares: 1,
  },
];

export function useFeed() {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const feed = useQuery<FeedPost[]>({
    queryKey: FEED_KEY,
    enabled: hydrated,
    staleTime: 15_000,
    retry: false,
    queryFn: async () => {
      try {
        const posts = await getFeedFn();
        return posts?.length ? posts : FALLBACK_FEED;
      } catch {
        return FALLBACK_FEED;
      }
    },
  });

  const createPost = useMutation({
    mutationFn: (input: CreateFeedPostInput) => createFeedPostFn({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEED_KEY }),
  });

  const toggleLike = (postId: string) => {
    queryClient.setQueryData<FeedPost[]>(FEED_KEY, (posts) =>
      posts?.map((post) => post.id === postId
        ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
        : post),
    );
  };

  return { ...feed, createPost, toggleLike };
}
