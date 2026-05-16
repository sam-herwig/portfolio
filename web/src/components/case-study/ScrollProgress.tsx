'use client';

import { m, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { heroBandProgress } from '@/lib/caseStudyTimeline';
import { useSceneStore } from '@/lib/useSceneStore';

export default function ScrollProgress() {
  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 36, mass: 0.4 });

  // NOTE: deliberately does NOT write `scrollProgress`. That field drives the
  // home timeline (BackgroundField module mode, canvasSlot rect); writing it
  // from a case-study scroll context would clobber the home value to 0,
  // flipping BackgroundField into Hero mode and leaking the hero-circle
  // shader through the slide-in's phase-1 clip-path contract. The case-study
  // page tracks its own scroll via `csHeroBandProgress`.

  // Hero band progress is the case-study shader's cycle driver (cycles=1 over
  // 0→1) and the canvas wrapper's exit-fade driver (fades past 1). Computed
  // from raw scrollY so band length is anchored to viewport pixels, not the
  // article's variable total height.
  useMotionValueEvent(scrollY, 'change', (yPx) => {
    const vh = typeof window === 'undefined' ? 0 : window.innerHeight;
    useSceneStore.getState().setCsHeroBandProgress(heroBandProgress(yPx, vh));
  });

  useEffect(() => {
    return () => {
      useSceneStore.getState().setCsHeroBandProgress(0);
    };
  }, []);

  return (
    <m.div
      aria-hidden
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed left-0 right-0 top-0 z-30 h-px bg-foreground/45"
    />
  );
}
