import { useQuery } from '@tanstack/react-query';
import { groupsService } from '../services/groups.service';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsService.getGroups,
  });
};
