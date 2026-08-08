export const feedService = {
  getFeed: async (): Promise<Array<{ id: string; content: string }>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([{ id: '1', content: 'Mock post 1' }, { id: '2', content: 'Mock post 2' }]);
      }, 500);
    });
  },
  createPost: async (content: string): Promise<{ id: string; content: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: Math.random().toString(), content });
      }, 500);
    });
  }
};
