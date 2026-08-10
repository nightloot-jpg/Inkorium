import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useFeed = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const postsSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .subscribe();

    const commentsSubscription = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .subscribe();

    const likesSubscription = supabase
      .channel('public:likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(likesSubscription);
    };
  }, [queryClient]);

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: feedService.getPosts,
    initialPageParam: 0,
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
