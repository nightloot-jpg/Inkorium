export const messagesService = {
  getChats: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([{ id: 'chat1', name: 'General' }]), 500));
  },
  getMessages: async (chatId: string) => {
    return new Promise((resolve) => setTimeout(() => resolve([{ id: 'm1', content: `Hello from ${chatId}` }]), 500));
  }
};
