import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications.service';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
  });
};
