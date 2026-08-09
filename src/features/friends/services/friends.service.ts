export const friendsService = {
  getFriends: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([]), 500));
  }
};
