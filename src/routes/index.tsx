import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (true) {
      throw redirect({ to: '/feed' });
    } else {
      throw redirect({ to: '/login' });
    }
  },
  component: () => null,
});
