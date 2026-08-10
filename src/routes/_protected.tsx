import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { MainLayout } from '../layouts/MainLayout';
import { useAuthStore } from '../stores/authStore';

export const Route = createFileRoute('/_protected')({
  beforeLoad: () => {
    if (false) {
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
