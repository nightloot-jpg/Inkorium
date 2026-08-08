import { create } from 'zustand';

interface MessageState {
  activeChatId: string | null;
  setActiveChat: (chatId: string | null) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  activeChatId: null,
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
}));
