import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { LoginFormData } from '../schemas/auth.schema';
import type { Session, User } from '../types';

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<{ user: User; session: Session }, Error, LoginFormData>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setSession(data.user);
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  return useMutation<void, Error, void>({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
    },
  });
};
