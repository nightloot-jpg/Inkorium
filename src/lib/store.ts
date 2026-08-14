import { create } from 'zustand';

export type ProfileData = {
  id?: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

interface AuthStore {
  profile: ProfileData | null;
  setProfile: (profile: ProfileData | null) => void;
  updateProfile: (updates: Partial<ProfileData>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) => set((state) => ({ 
    profile: state.profile ? { ...state.profile, ...updates } : null 
  })),
}));

export type PlayerItem = {
  type: 'youtube_song' | 'youtube_playlist';
  youtube_id: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  queue?: any[]; // Array of tracks for playlist
  currentIndex?: number;
};

interface PlayerStore {
  isOpen: boolean;
  currentItem: PlayerItem | null;
  openPlayer: (item: PlayerItem) => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  isOpen: false,
  currentItem: null,
  openPlayer: (item) => set({ isOpen: true, currentItem: item }),
  closePlayer: () => set({ isOpen: false, currentItem: null }),
}));
