import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedPostFn, getFeedFn, toggleLikeFn } from '../services/feed.functions';
import type { FeedPost } from '../types';

const FEED_KEY = ['feed'] as const;

export function useFeed() {
  const queryClient = useQueryClient();
  const feed = useQuery<FeedPost[]>({
    queryKey: FEED_KEY,
    queryFn: () => getFeedFn(),
    staleTime: 15_000,
    retry: 1,
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
    const current = queryClient.getQueryData<FeedPost[]>(FEED_KEY) ?? [];
    const post = current.find((item) => item.id === postId);
    if (!post) return;
    const liked = !post.liked;
    queryClient.setQueryData<FeedPost[]>(FEED_KEY, (items) => items?.map((item) => item.id === postId ? { ...item, liked, likes: Math.max(0, item.likes + (liked ? 1 : -1)) } : item));
    try {
      await likeMutation.mutateAsync({ postId, liked });
    } catch (error) {
      queryClient.setQueryData<FeedPost[]>(FEED_KEY, current);
      throw error;
    }
  };

  return { ...feed, createPost, toggleLike };
}
