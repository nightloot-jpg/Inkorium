import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { MainLayout } from '../layouts/MainLayout';

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});
