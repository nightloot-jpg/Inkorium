import { supabase } from '../../../lib/supabase';

export const authService = {
  login: async ({ email, password }: any) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user };
  },

  register: async ({ email, password, fullName }: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return { user: data.user };
  },

  resetPassword: async ({ email }: any) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/update-password` : 'https://www.inkorium.es/update-password',
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },
};
