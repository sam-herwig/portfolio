import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void): () => void {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

function getSnapshot(): number {
  return window.innerHeight;
}

function getServerSnapshot(): number {
  return 800;
}

/**
 * Resize-reactive window.innerHeight. SSR-safe; returns 800 on the server.
 * Useful for viewport-relative motion ranges (e.g. card rise = 1 viewport height).
 */
export function useViewportHeight(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
