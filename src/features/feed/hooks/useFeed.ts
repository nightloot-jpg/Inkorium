import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';

export const useFeed = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: feedService.getFeed,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feedService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};
