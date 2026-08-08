export const notificationsService = {
  getNotifications: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([{ id: 'n1', content: 'New follower' }]), 500));
  }
};
