'use client';

import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  const mql = window.matchMedia('(pointer: fine)');
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getSnapshot(): boolean {
  return window.matchMedia('(pointer: fine)').matches;
}

function getServerSnapshot(): boolean {
  return true;
}

export default function useHasFinePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
