import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/(auth)')({
  beforeLoad: () => {
    if (useAuthStore.getState().session) {
      throw redirect({ to: '/' })
    }
  },
  component: AuthLayout,
});
