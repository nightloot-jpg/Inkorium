import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inklogService } from '../services/inklog.service';
import { useRealtime } from '../../../lib/realtime/useRealtime';

export const useInklog = () => {
  const queryClient = useQueryClient();

  useRealtime({
    table: 'inklogs',
    onEvent: () => queryClient.invalidateQueries({ queryKey: ['inklogs'] }),
  });

  const inklogQuery = useInfiniteQuery({
    queryKey: ['inklogs'],
    queryFn: inklogService.getInklogs,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const createInklog = useMutation({
    mutationFn: inklogService.createInklog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inklogs'] });
    },
  });

  return {
    ...inklogQuery,
    createInklog,
  };
};
