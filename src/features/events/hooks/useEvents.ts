import { useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/events.service';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getEvents,
  });
};
