import { create } from 'zustand';

interface SceneState {
  scrollProgress: number;
  setScrollProgress: (v: number) => void;
  previousPathname: string | null;
  setPreviousPathname: (p: string | null) => void;
  /** 0 = home (slot driven by scroll), 1 = case study (left slot). */
  canvasSlide: number;
  setCanvasSlide: (v: number) => void;
  /** 0 = home composite only, 1 = case-study hero shader fully visible. */
  csHeroWeight: number;
  setCsHeroWeight: (v: number) => void;
  csHeroIndex: number;
  setCsHeroIndex: (i: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (v) => set({ scrollProgress: v }),
  previousPathname: null,
  setPreviousPathname: (p) => set({ previousPathname: p }),
  canvasSlide: 0,
  setCanvasSlide: (v) => set({ canvasSlide: v }),
  csHeroWeight: 0,
  setCsHeroWeight: (v) => set({ csHeroWeight: v }),
  csHeroIndex: 0,
  setCsHeroIndex: (i) => set({ csHeroIndex: i }),
}));
