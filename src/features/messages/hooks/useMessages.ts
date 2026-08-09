import { useQuery } from '@tanstack/react-query';
import { messagesService } from '../services/messages.service';

export const useChats = () => {
  return useQuery({ queryKey: ['chats'], queryFn: messagesService.getChats });
};
