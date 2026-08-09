export const profileService = {
  getProfile: async (username: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: '1', username, name: 'Test User', bio: 'This is a test bio.' });
      }, 1000);
    });
  },
};
