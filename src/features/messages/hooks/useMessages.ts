import { useQuery } from '@tanstack/react-query';
import { messagesService } from '../services/messages.service';

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: messagesService.getChats,
  });
};

export const useMessages = (chatId: string) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => messagesService.getMessages(chatId),
    enabled: !!chatId,
  });
};
