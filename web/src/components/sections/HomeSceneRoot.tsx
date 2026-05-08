'use client';

import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { useRef } from 'react';
import AboutOverlay from '@/components/sections/AboutOverlay';
import ContactOverlay from '@/components/sections/ContactOverlay';
import HeroOverlay from '@/components/sections/HeroOverlay';
import WorkOverlay from '@/components/sections/WorkOverlay';
import DevLeva from '@/components/sections/DevLeva';
import useCanvasGate from '@/lib/useCanvasGate';
import { useSceneStore } from '@/lib/useSceneStore';
import { TIMELINE_HEIGHT_SVH } from '@/lib/moduleTimeline';

export default function HomeSceneRoot() {
  const prefersReducedMotion = useReducedMotion();

  // Use === true so SSR (null) and client-default (false) both pick the motion
  // path, avoiding hydration mismatch. Reduced-motion users swap on client mount.
  if (prefersReducedMotion === true) {
    return (
      <main id="main-content" className="relative w-full">
        <HeroOverlay />
        <AboutOverlay />
        <WorkOverlay />
        <ContactOverlay />
      </main>
    );
  }

  return <HomeSceneRootMotion />;
}

function HomeSceneRootMotion() {
  const mainRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const enableCanvas = useCanvasGate();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    useSceneStore.getState().setScrollProgress(v);
  });

  return (
    <>
      <main ref={mainRef} id="main-content" className="relative w-full">
        <section ref={sectionRef} className="relative z-10 w-full" style={{ height: `${TIMELINE_HEIGHT_SVH}svh` }}>
          <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
            <HeroOverlay progress={scrollYProgress} />
            <AboutOverlay progress={scrollYProgress} />
            <WorkOverlay progress={scrollYProgress} />
            <ContactOverlay progress={scrollYProgress} />
          </div>
        </section>
      </main>
      {process.env.NODE_ENV !== 'production' && <DevLeva enableCanvas={enableCanvas} />}
    </>
  );
}
