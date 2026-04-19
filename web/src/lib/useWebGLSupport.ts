'use client';

import { useSyncExternalStore } from 'react';

/**
 * Detect WebGL availability via useSyncExternalStore — canonical React 19
 * pattern for "read from an external platform API" without tripping the
 * react-hooks/set-state-in-effect rule.
 *
 * Returns:
 *   null   — SSR (assume supported, no fallback flash)
 *   true   — WebGL context created successfully on client
 *   false  — WebGL not available / blocked
 */

function computeWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const loseExt = gl.getExtension('WEBGL_lose_context');
      loseExt?.loseContext();
    }
    return !!gl;
  } catch {
    return false;
  }
}

const subscribe = () => () => {};
const getServerSnapshot = (): boolean | null => null;

// Cache the result so repeated getSnapshot calls return the same reference
let cached: boolean | null = null;
const getClientSnapshot = (): boolean | null => {
  if (cached === null) cached = computeWebGLSupport();
  return cached;
};

export default function useWebGLSupport(): boolean | null {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
