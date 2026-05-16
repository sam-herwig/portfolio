'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false });

// Routes that need the WebGL canvas. Anything else (process, 404, lab) skips
// the dynamic import entirely so its R3F/three chunks never ship to those
// pages. Keeping the gate at the layout level (rather than per-page mounting)
// preserves cross-route choreography between home and case studies.
function routeNeedsCanvas(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/work/')) return true;
  return false;
}

export default function SceneCanvasClient() {
  const pathname = usePathname();
  if (!routeNeedsCanvas(pathname)) return null;
  return <SceneCanvas />;
}
