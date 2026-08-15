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
  youtube_id?: string;
  playlist_id?: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
};

export type QueueItem = {
  video_id: string;
  title: string;
  channel_title?: string;
  thumbnail?: string;
  duration?: string;
};

interface PlayerStore {
  isOpen: boolean;
  isExpanded: boolean;
  isPlaying: boolean;
  currentSong: QueueItem | null;
  currentPlaylist: PlayerItem | null;
  currentIndex: number;
  queue: QueueItem[];
  currentTime: number;
  duration: number;
  volume: number;

  playSong: (song: QueueItem) => void;
  playPlaylist: (playlist: PlayerItem, queue: QueueItem[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  updateProgress: (currentTime: number, duration: number) => void;

  openPlayer: () => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  expandPlayer: () => void;
  setQueue: (queue: QueueItem[]) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  isOpen: false,
  isExpanded: false,
  isPlaying: false,
  currentSong: null,
  currentPlaylist: null,
  currentIndex: 0,
  queue: [],
  currentTime: 0,
  duration: 0,
  volume: 100,

  playSong: (song) => set({ isOpen: true, currentSong: song, currentPlaylist: null, queue: [song], currentIndex: 0, isPlaying: true }),
  playPlaylist: (playlist, queue, startIndex = 0) => set({ isOpen: true, currentPlaylist: playlist, queue, currentIndex: startIndex, currentSong: queue[startIndex] || null, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  next: () => set((state) => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < state.queue.length) {
      return { currentIndex: nextIndex, currentSong: state.queue[nextIndex], isPlaying: true };
    }
    return state;
  }),
  previous: () => set((state) => {
    const prevIndex = state.currentIndex - 1;
    if (prevIndex >= 0) {
      return { currentIndex: prevIndex, currentSong: state.queue[prevIndex], isPlaying: true };
    }
    return state;
  }),
  seek: (time) => set({ currentTime: time }), // Notifies UI, actual seek handled in YT component
  setVolume: (vol) => set({ volume: vol }),
  updateProgress: (currentTime, duration) => set({ currentTime, duration }),

  openPlayer: () => set({ isOpen: true }),
  closePlayer: () => set({ isOpen: false, isPlaying: false, currentSong: null, currentPlaylist: null, queue: [], currentTime: 0, isExpanded: false }),
  minimizePlayer: () => set({ isExpanded: false }),
  expandPlayer: () => set({ isExpanded: true }),
  setQueue: (queue) => set({ queue }),
}));
