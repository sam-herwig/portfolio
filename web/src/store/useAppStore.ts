import { create } from 'zustand';

interface AppState {
  isAlternateReality: boolean;
  toggleReality: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAlternateReality: false, // false = Mountain Man (Light, topographic, linework), true = Change Reality (Dark, shader, immersive)
  toggleReality: () => set((state) => ({ isAlternateReality: !state.isAlternateReality })),
}));
