import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inklogService } from '../services/inklog.service';
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useInklog = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('public:inklogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inklogs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['inklogs'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

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
