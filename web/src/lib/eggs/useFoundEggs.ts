import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EggId } from './eggRegistry';

interface FoundEggsState {
  foundIds: EggId[];
  markFound: (id: EggId) => void;
  reset: () => void;
}

export const useFoundEggs = create<FoundEggsState>()(
  persist(
    (set) => ({
      foundIds: [],
      markFound: (id) => set((state) => (state.foundIds.includes(id) ? state : { foundIds: [...state.foundIds, id] })),
      reset: () => set({ foundIds: [] }),
    }),
    { name: 'found-eggs:v1' },
  ),
);

export const useFoundCount = () => useFoundEggs((s) => s.foundIds.length);
export const useIsFound = (id: EggId) => useFoundEggs((s) => s.foundIds.includes(id));
