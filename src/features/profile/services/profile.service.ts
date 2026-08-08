export const profileService = {
  getProfile: async (username: string): Promise<{ id: string; username: string; bio: string; location: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: '1', username, bio: 'This is a mock bio', location: 'Mock City' });
      }, 500);
    });
  },
  updateProfile: async (data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 500);
    });
  }
};
