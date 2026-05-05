'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { ShaderMaterial } from 'three';

interface HeroUniformsConfig {
  trackRef: React.RefObject<HTMLElement | null>;
  matRef: React.RefObject<ShaderMaterial | null>;
  introDuration?: number;
  reducedMotionStill?: { uScroll: number; uIntro: number };
}

export function useHeroUniforms({ trackRef, matRef, introDuration = 2, reducedMotionStill }: HeroUniformsConfig) {
  const startTime = useRef<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useFrame((_state, delta) => {
    const m = matRef.current;
    const el = trackRef.current;
    if (!m || !el) return;

    const aspect = el.clientWidth / Math.max(1, el.clientHeight);

    if (reducedMotion) {
      const still = reducedMotionStill ?? { uScroll: 0.5, uIntro: 1 };
      m.uniforms.uScroll.value = still.uScroll;
      m.uniforms.uIntro.value = still.uIntro;
      m.uniforms.uTime.value = 0;
      m.uniforms.uAspect.value = aspect;
      return;
    }

    const rect = el.getBoundingClientRect();
    const total = rect.height || 1;
    const passed = -rect.top;
    const scroll = Math.max(0, Math.min(1, passed / total));

    if (startTime.current === null) startTime.current = performance.now();
    const elapsed = (performance.now() - startTime.current) / 1000;
    const introRaw = Math.min(1, elapsed / introDuration);
    const intro = 1 - Math.pow(1 - introRaw, 3);

    m.uniforms.uScroll.value = scroll;
    m.uniforms.uIntro.value = intro;
    m.uniforms.uTime.value += delta;
    m.uniforms.uAspect.value = aspect;
  });
}
