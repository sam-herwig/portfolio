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
  /** Case-study Hero band scroll position. 0 = top of page, 1 = end of the
   * 200svh band, >1 = past the band. Drives the hero shader's `uScroll`
   * (cycles=1 means one K0→K3 traversal across 0→1) AND the canvas wrapper's
   * exit fade. Set by `ScrollProgress` on /work/[slug], reset to 0 on unmount. */
  csHeroBandProgress: number;
  setCsHeroBandProgress: (v: number) => void;
  /** Center of the currently-visible canvas slot in vUv space ([0,1] across
   * the full-viewport canvas). Driven by SceneCanvas's per-rAF lerp; consumed
   * by the shader as `uModuleCenter` to keep module content (e.g. the Hero
   * SDF moon) anchored to the visible rect's center, not the viewport's. */
  slotCenter: [number, number];
  setSlotCenter: (c: [number, number]) => void;
  /** Pointer position in vUv [0,1] space (y already flipped to match shader,
   * where vUv.y=0 is bottom). Updated by HomeSceneRoot's pointermove listener
   * with a Lissajous idle-drift fallback after 2.5s of stillness. Consumed by
   * BackgroundField's useFrame as the target for an exponential lerp into
   * `uMouse`. Default centered so SSR + first frame don't snap. */
  mouseTarget: [number, number];
  setMouseTarget: (m: [number, number]) => void;
  /** Cursor-disturbance mode + params consumed by BackgroundField each frame.
   * Lives in the store so the Leva folder in BackgroundField stays the single
   * source of truth even after the LetterFillField mirroring was removed.
   * Modes: 0 Off, 1 Magnet, 2 Repel, 3 Swirl, 4 Ripple, 5 Lens. */
  interactionMode: number;
  interactionStrength: number;
  interactionRadius: number;
  interactionFreq: number;
  setInteraction: (mode: number, strength: number, radius: number, freq: number) => void;
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
  csHeroBandProgress: 0,
  setCsHeroBandProgress: (v) => set({ csHeroBandProgress: v }),
  slotCenter: [0.75, 0.5],
  setSlotCenter: (c) => set({ slotCenter: c }),
  mouseTarget: [0.5, 0.5],
  setMouseTarget: (m) => set({ mouseTarget: m }),
  interactionMode: 1,
  interactionStrength: 1.03,
  interactionRadius: 0.13,
  interactionFreq: 8.5,
  setInteraction: (interactionMode, interactionStrength, interactionRadius, interactionFreq) =>
    set({ interactionMode, interactionStrength, interactionRadius, interactionFreq }),
}));
