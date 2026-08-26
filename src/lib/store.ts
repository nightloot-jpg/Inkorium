import { create } from 'zustand';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export type ProfileData = {
  id?: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  user_status: string | null;
};

interface AuthStore {
  profile: ProfileData | null;
  session: Session | null;
  setProfile: (profile: ProfileData | null) => void;
  setSession: (session: Session | null) => void;
  updateProfile: (updates: Partial<ProfileData>) => void;
}

let authenticatedUserId: string | null = null;

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  session: null,
  setSession: (session) => {
    authenticatedUserId = session?.user.id ?? null;
    set({ session });
  },
  setProfile: (profile) => set((state) => {
    if (!profile) return { profile: null };
    if (!profile.id || !authenticatedUserId || profile.id !== authenticatedUserId) return state;
    return { profile };
  }),
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),
}));

async function hydrateAuthenticatedProfile(userId: string | null) {
  authenticatedUserId = userId;
  if (!userId) {
    useAuthStore.setState({ profile: null, session: null });
    return;
  }

  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, city, avatar_url, banner_url, user_status')
    .eq('id', userId)
    .maybeSingle();

  if (data && authenticatedUserId === userId) {
    useAuthStore.setState({ profile: data as ProfileData });
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  // main.tsx owns the initial session/profile bootstrap. Avoid a second
  // getSession/profile query when Supabase emits INITIAL_SESSION.
  if (event === 'INITIAL_SESSION') return;
  useAuthStore.getState().setSession(session);
  void hydrateAuthenticatedProfile(session?.user.id ?? null);
});

export type PlayerItem = {
  type: 'youtube_song' | 'youtube_playlist';
  youtube_id?: string;
  playlist_id?: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
};

export type QueueItem = {
  source_type?: 'youtube' | 'local';
  video_id?: string;
  audio_url?: string;
  title: string;
  channel_title?: string;
  thumbnail?: string;
  duration?: string;
  artist?: string;
  id?: string;
};

interface PlayerStore {
  isOpen: boolean;
  isExpanded: boolean;
  isPlaying: boolean;
  pendingPlay: boolean;
  setPendingPlay: (pending: boolean) => void;
  currentSong: QueueItem | null;
  currentPlaylist: PlayerItem | null;
  currentIndex: number;
  queue: QueueItem[];
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  previousVolume: number;
  seekRequest: number | null;
  clearSeekRequest: () => void;
  playSong: (song: QueueItem, openUI?: boolean) => void;
  playPlaylist: (playlist: PlayerItem, queue: QueueItem[], startIndex?: number, openUI?: boolean) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  updateProgress: (currentTime: number, duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
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
  pendingPlay: false,
  currentSong: null,
  currentPlaylist: null,
  currentIndex: 0,
  queue: [],
  currentTime: 0,
  duration: 0,
  volume: 100,
  isMuted: false,
  previousVolume: 100,
  seekRequest: null,
  playSong: (song, openUI = true) => set({ isOpen: openUI, currentSong: song, currentPlaylist: null, queue: [song], currentIndex: 0, isPlaying: false, pendingPlay: true }),
  playPlaylist: (playlist, queue, startIndex = 0, openUI = false) => set({ isOpen: openUI, currentPlaylist: playlist, queue, currentIndex: startIndex, currentSong: queue[startIndex] || null, isPlaying: false, pendingPlay: true }),
  pause: () => set({ isPlaying: false, pendingPlay: false }),
  resume: () => set({ pendingPlay: true }),
  next: () => set((state) => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < state.queue.length) return { currentIndex: nextIndex, currentSong: state.queue[nextIndex], isPlaying: false, pendingPlay: true };
    return state;
  }),
  previous: () => set((state) => {
    const prevIndex = state.currentIndex - 1;
    if (prevIndex >= 0) return { currentIndex: prevIndex, currentSong: state.queue[prevIndex], isPlaying: false, pendingPlay: true };
    return state;
  }),
  seek: (time) => set({ currentTime: time, seekRequest: time }),
  clearSeekRequest: () => set({ seekRequest: null }),
  setVolume: (vol) => set((state) => {
    const clamped = Math.max(0, Math.min(100, vol));
    if (clamped === 0) return { volume: 0, isMuted: true };
    return { volume: clamped, isMuted: false, previousVolume: clamped };
  }),
  toggleMute: () => set((state) => {
    if (state.isMuted) {
      const restoreVol = state.previousVolume > 0 ? state.previousVolume : 100;
      return { isMuted: false, volume: restoreVol };
    }
    return { isMuted: true, previousVolume: state.volume, volume: 0 };
  }),
  updateProgress: (currentTime, duration) => set({ currentTime, duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPendingPlay: (pendingPlay) => set({ pendingPlay }),
  openPlayer: () => set({ isOpen: true }),
  closePlayer: () => set({ isOpen: false, isExpanded: false }),
  minimizePlayer: () => set({ isExpanded: false }),
  expandPlayer: () => set({ isExpanded: true }),
  setQueue: (queue) => set({ queue }),
}));
