import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/feed' });
    } else {
      throw redirect({ to: '/login' });
    }
  },
  component: () => null,
});
