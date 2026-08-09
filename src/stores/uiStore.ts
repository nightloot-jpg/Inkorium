import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../i18n';

interface UiState {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLeftSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (language) => set({ language }),
      isLeftSidebarOpen: true,
      toggleLeftSidebar: () =>
        set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
      isRightSidebarOpen: true,
      toggleRightSidebar: () =>
        set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
