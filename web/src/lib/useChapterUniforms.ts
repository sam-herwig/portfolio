'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { ShaderMaterial } from 'three';

interface ChapterUniformsConfig {
  trackRef: React.RefObject<HTMLElement | null>;
  matRef: React.RefObject<ShaderMaterial | null>;
  mode?: 'reveal' | 'pinned';
}

export function useChapterUniforms({ trackRef, matRef, mode = 'reveal' }: ChapterUniformsConfig) {
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
      m.uniforms.uScroll.value = 0.5;
      m.uniforms.uIntro.value = 1;
      m.uniforms.uTime.value = 0;
      m.uniforms.uAspect.value = aspect;
      return;
    }

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;

    let progress = 0;
    if (mode === 'reveal') {
      progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    } else {
      const total = rect.height - vh;
      progress = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
    }

    if (startTime.current === null) startTime.current = performance.now();
    const elapsed = (performance.now() - startTime.current) / 1000;
    const introRaw = Math.min(1, elapsed / 1.4);
    const intro = 1 - Math.pow(1 - introRaw, 3);

    m.uniforms.uScroll.value = progress;
    m.uniforms.uIntro.value = intro;
    m.uniforms.uTime.value += delta;
    m.uniforms.uAspect.value = aspect;
  });
}
