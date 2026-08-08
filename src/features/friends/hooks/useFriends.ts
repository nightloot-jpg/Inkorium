import { useQuery } from '@tanstack/react-query';
import { friendsService } from '../services/friends.service';

export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: friendsService.getFriends,
  });
};
