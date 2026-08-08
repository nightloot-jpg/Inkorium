import type { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import type { Session, User } from '../types';

export const authService = {
  login: async (credentials: LoginFormData): Promise<{ user: User; session: Session }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ user: { id: '1', email: credentials.email, username: 'testuser' }, session: { access_token: 'mock_token' } });
      }, 500);
    });
  },
  logout: async (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, 500));
  },
  register: async (data: RegisterFormData): Promise<{ user: User; session: null }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ user: { id: '1', email: data.email, username: data.username }, session: null });
      }, 500);
    });
  }
};
