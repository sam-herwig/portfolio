'use client';

import { useSyncExternalStore } from 'react';
import useWebGLSupport from './useWebGLSupport';

function subscribe(cb: () => void) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener('change', cb);
  return () => reduced.removeEventListener('change', cb);
}

function getSnapshot(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

function useMotionGate(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Combined gate: WebGL support + no reduced-motion. Viewport size is no longer
// part of the gate — mobile gets a stacked top/bottom canvas layout instead of
// being denied entirely.
// SSR snapshot is false so the canvas never renders during server render —
// hydration mismatch-free even if useWebGLSupport flips on first client paint.
export default function useCanvasGate(): boolean {
  const webgl = useWebGLSupport();
  const motion = useMotionGate();
  return webgl === true && motion;
}
