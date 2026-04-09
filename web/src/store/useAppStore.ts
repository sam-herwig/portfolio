import { create } from 'zustand';

interface TransitionOrigin {
  x: number;
  y: number;
}

interface AppState {
  hasLoaded: boolean;
  setHasLoaded: (loaded: boolean) => void;
  /** Saved homepage scroll position — restored when returning from case study */
  savedScrollY: number;
  setSavedScrollY: (y: number) => void;
  /** Ink wash page transition state */
  transitionState: 'idle' | 'entering' | 'exiting';
  transitionOrigin: TransitionOrigin;
  transitionColor: string;
  transitionHref: string;
  startTransition: (origin: TransitionOrigin, color: string, href: string) => void;
  setTransitionExiting: () => void;
  endTransition: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasLoaded: false,
  setHasLoaded: (loaded) => set({ hasLoaded: loaded }),
  savedScrollY: 0,
  setSavedScrollY: (y) => set({ savedScrollY: y }),
  transitionState: 'idle',
  transitionOrigin: { x: 0, y: 0 },
  transitionColor: '#09090b',
  transitionHref: '',
  startTransition: (origin, color, href) =>
    set({ transitionState: 'entering', transitionOrigin: origin, transitionColor: color, transitionHref: href }),
  setTransitionExiting: () => set({ transitionState: 'exiting' }),
  endTransition: () => set({ transitionState: 'idle', transitionHref: '' }),
}));
