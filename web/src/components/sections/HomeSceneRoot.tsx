'use client';

import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { useEffect, useRef } from 'react';
import AboutOverlay from '@/components/sections/AboutOverlay';
import ContactOverlay from '@/components/sections/ContactOverlay';
import HeroOverlay from '@/components/sections/HeroOverlay';
import WorkOverlay from '@/components/sections/WorkOverlay';
import DevLeva from '@/components/sections/DevLeva';
import useCanvasGate from '@/lib/useCanvasGate';
import { useSceneStore } from '@/lib/useSceneStore';
import { useTimeline } from '@/lib/moduleTimeline';

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
  const { totalHeight } = useTimeline();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    useSceneStore.getState().setScrollProgress(v);
  });

  // Pointer tracking for shader interactivity. Writes a vUv-space target
  // into the scene store; BackgroundField's useFrame exponential-lerps the
  // uMouse uniform toward it. Desktop-only: gated behind `(pointer: fine)`
  // so touch devices never drive the cursor magnet (per ADR 0007). The
  // Lissajous idle figure still drives the target so the shader's
  // interactive layer stays alive without input — both desktop pointer-idle
  // and mobile visitors get the same animated baseline.
  useEffect(() => {
    let lastMove = performance.now();
    let raf = 0;
    const setMouseTarget = useSceneStore.getState().setMouseTarget;
    const hasFinePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

    const onMove = (e: PointerEvent) => {
      lastMove = performance.now();
      // y flip: clientY=0 is top, but shader's vUv.y=0 is bottom.
      setMouseTarget([e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight]);
    };

    const tick = () => {
      const dt = performance.now() - lastMove;
      if (dt > 2500) {
        const t = performance.now() * 0.001;
        setMouseTarget([0.5 + 0.3 * Math.sin(t * 0.31), 0.5 + 0.25 * Math.cos(t * 0.43)]);
      }
      raf = requestAnimationFrame(tick);
    };

    if (hasFinePointer) {
      window.addEventListener('pointermove', onMove);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      if (hasFinePointer) {
        window.removeEventListener('pointermove', onMove);
      }
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <main ref={mainRef} id="main-content" className="relative w-full">
        <section ref={sectionRef} className="relative z-10 w-full" style={{ height: `${totalHeight}svh` }}>
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
