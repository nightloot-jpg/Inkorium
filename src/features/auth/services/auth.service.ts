import { supabase } from '../../../lib/supabase';
import { loginFn, registerFn, logoutFn } from '../../../auth';

export const authService = {
  login: async ({ email, password }: any) => {
    return await loginFn({ data: { email, password } });
  },

  register: async ({ email, password, fullName }: any) => {
    return await registerFn({ data: { email, password, fullName } });
  },

  resetPassword: async ({ email }: any) => {
    // Reset password could also be moved to server fn, but for now we keep it
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/update-password` : 'https://www.inkorium.es/update-password',
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    return await logoutFn();
  },
};
