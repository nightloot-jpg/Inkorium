export const eventsService = {
  getEvents: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([{ id: 'e1', name: 'Tech Meetup' }]), 500));
  }
};
