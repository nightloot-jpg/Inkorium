import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedPostFn, getFeedFn, toggleLikeFn } from '../services/feed.functions';
import type { FeedPost } from '../types';

const FEED_KEY = ['feed'] as const;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const feed = useQuery<FeedPost[]>({
    queryKey: FEED_KEY,
    queryFn: async () => {
      try {
        const posts = await getFeedFn();
        return posts?.length ? posts : FALLBACK_FEED;
      } catch {
        return FALLBACK_FEED;
      }
    },
    enabled: mounted,
    initialData: FALLBACK_FEED,
    staleTime: 15_000,
    retry: false,
  });

  const createPost = useMutation({
    mutationFn: async ({ content, type, photos }: { content: string; type: string; photos: File[] }) => {
      const form = new FormData();
      form.set('content', content);
      form.set('type', type);
      photos.forEach((photo) => form.append('photos', photo, photo.name));
      return createFeedPostFn({ data: form });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FEED_KEY }),
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) => toggleLikeFn({ data: { postId, liked } }),
  });

  const toggleLike = async (postId: string) => {
    const current = queryClient.getQueryData<FeedPost[]>(FEED_KEY) ?? FALLBACK_FEED;
    const post = current.find((item) => item.id === postId);
    if (!post) return;
    const liked = !post.liked;
    queryClient.setQueryData<FeedPost[]>(FEED_KEY, (items) => items?.map((item) => item.id === postId ? { ...item, liked, likes: Math.max(0, item.likes + (liked ? 1 : -1)) } : item));
    try {
      await likeMutation.mutateAsync({ postId, liked });
    } catch {
      queryClient.setQueryData<FeedPost[]>(FEED_KEY, current);
    }
  };

  return { ...feed, createPost, toggleLike };
}
