export const authService = {
  login: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ user: { id: '1', email: 'test@test.com', name: 'Test User', username: 'testuser' } });
      }, 1000);
    });
  },
  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },
};
