import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

interface AuthState {
  session: User | null;
  isLoading: boolean;
  setSession: (session: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ session: null }),
}));
