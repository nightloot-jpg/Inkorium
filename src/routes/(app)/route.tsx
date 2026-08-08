import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/(app)')({
  beforeLoad: () => {
    if (!useAuthStore.getState().session) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
});
