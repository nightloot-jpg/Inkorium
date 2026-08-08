export const groupsService = {
  getGroups: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([{ id: 'g1', name: 'React Developers' }]), 500));
  }
};
