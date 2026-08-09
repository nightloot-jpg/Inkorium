import { useQuery } from '@tanstack/react-query';
import { feedService } from '../services/feed.service';

export const useFeed = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: feedService.getPosts,
  });
};
