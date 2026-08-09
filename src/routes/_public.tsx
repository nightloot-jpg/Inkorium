import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AuthLayout } from '../layouts/AuthLayout';

export const Route = createFileRoute('/_public')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: '/feed',
      });
    }
  },
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
});
