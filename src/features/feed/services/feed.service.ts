export const feedService = {
  getPosts: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([{ id: '1', content: 'Hello World', author: 'Test User' }]);
      }, 1000);
    });
  },
};
