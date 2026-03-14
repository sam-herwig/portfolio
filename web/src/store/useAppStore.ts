import { create } from 'zustand';

interface AppState {
  hasLoaded: boolean;
  setHasLoaded: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasLoaded: false,
  setHasLoaded: (loaded) => set({ hasLoaded: loaded }),
}));
