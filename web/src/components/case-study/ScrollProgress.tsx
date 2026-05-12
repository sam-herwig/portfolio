'use client';

import { m, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { useSceneStore } from '@/lib/useSceneStore';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 36, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    useSceneStore.getState().setScrollProgress(v);
  });

  useEffect(() => {
    useSceneStore.getState().setScrollProgress(scrollYProgress.get());
    return () => {
      useSceneStore.getState().setScrollProgress(0);
    };
  }, [scrollYProgress]);

  return (
    <m.div
      aria-hidden
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed left-0 right-0 top-0 z-30 h-px bg-foreground/45"
    />
  );
}
