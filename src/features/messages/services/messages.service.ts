export const messagesService = {
  getChats: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([]), 500));
  }
};
