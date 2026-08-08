export const friendsService = {
  getFriends: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([{ id: '2', username: 'friend1' }, { id: '3', username: 'friend2' }]);
      }, 500);
    });
  },
  getSuggestions: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([]), 500));
  }
};
