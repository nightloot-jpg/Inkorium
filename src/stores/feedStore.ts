import { create } from 'zustand';

interface FeedState {
  posts: any[];
  isLoading: boolean;
  setPosts: (posts: any[]) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isLoading: false,
  setPosts: (posts) => set({ posts }),
}));
