'use client';

import { useEffect, useRef } from 'react';

export interface MouseVelocity {
  x: number;
  y: number;
  magnitude: number;
}

/**
 * Smoothed pointer velocity in screen-space units per millisecond.
 * Returns a ref so callers can read inside useFrame without re-rendering.
 * Decays toward 0 each rAF tick so "at rest = no signal" works even when
 * the pointer is stationary (pointermove only fires on movement).
 */
export function useMouseVelocity() {
  const velocity = useRef<MouseVelocity>({ x: 0, y: 0, magnitude: 0 });

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastT = performance.now();
    let raf = 0;

    const handler = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const vx = dx / dt;
      const vy = dy / dt;
      const mag = Math.sqrt(vx * vx + vy * vy);

      velocity.current.x = velocity.current.x * 0.85 + vx * 0.15;
      velocity.current.y = velocity.current.y * 0.85 + vy * 0.15;
      velocity.current.magnitude = velocity.current.magnitude * 0.85 + mag * 0.15;

      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };

    const tick = () => {
      velocity.current.x *= 0.9;
      velocity.current.y *= 0.9;
      velocity.current.magnitude *= 0.9;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', handler);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  return velocity;
}
