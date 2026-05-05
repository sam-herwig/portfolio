'use client';

import { Canvas } from '@react-three/fiber';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { Leva } from 'leva';
import { useRef } from 'react';
import AboutOverlay from '@/components/sections/AboutOverlay';
import ContactOverlay from '@/components/sections/ContactOverlay';
import HeroOverlay from '@/components/sections/HeroOverlay';
import WorkOverlay from '@/components/sections/WorkOverlay';
import BackgroundField from '@/components/sections/BackgroundField';
import useCanvasGate from '@/lib/useCanvasGate';
import useIsMobileViewport from '@/lib/useIsMobileViewport';
import {
  MODULE_WINDOWS,
  canvasLeanFactor,
  canvasLeftPct,
  canvasTopPct,
  sceneOpacity,
  TIMELINE_HEIGHT_SVH,
} from '@/lib/moduleTimeline';

// Peak shear of the parallelogram lean as % of canvas dimension.
// 12 ≈ 6° lean given the canvas's ~1.1 aspect ratio at desktop sizes; at mobile
// half-height aspect (~1:1) it lands around 7°, visually equivalent.
const SLASH_PEAK_PCT = 12;

export default function HomeSceneRoot() {
  const mainRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef(0);
  const enableCanvas = useCanvasGate();
  const isMobile = useIsMobileViewport();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollRef.current = v;
  });

  const heroFallbackOpacity = useTransform(scrollYProgress, (v) => sceneOpacity(v, MODULE_WINDOWS.hero));
  const canvasLeft = useTransform(scrollYProgress, (v) => `${canvasLeftPct(v)}%`);
  const canvasTop = useTransform(scrollYProgress, (v) => `${canvasTopPct(v)}%`);
  const canvasClipPathDesktop = useTransform(scrollYProgress, (v) => {
    const s = canvasLeanFactor(v) * SLASH_PEAK_PCT;
    const tlx = Math.max(0, s);
    const trx = 100 + Math.min(0, s);
    const brx = 100 - Math.max(0, s);
    const blx = -Math.min(0, s);
    return `polygon(${tlx}% 0%, ${trx}% 0%, ${brx}% 100%, ${blx}% 100%)`;
  });
  // Mobile: vertical shear. Mobile slot pattern is exact-mirror of desktop
  // (TOP/BOTTOM/TOP/BOTTOM vs RIGHT/LEFT/RIGHT/LEFT), so the desktop lean
  // factor's sign is inverted relative to actual mobile travel direction —
  // we negate to preserve "lean into direction of travel."
  const canvasClipPathMobile = useTransform(scrollYProgress, (v) => {
    const s = -canvasLeanFactor(v) * SLASH_PEAK_PCT;
    const tly = Math.max(0, s);
    const try_ = -Math.min(0, s);
    const bry = 100 - Math.max(0, s);
    const bly = 100 + Math.min(0, s);
    return `polygon(0% ${tly}%, 100% ${try_}%, 100% ${bry}%, 0% ${bly}%)`;
  });

  return (
    <>
      <main ref={mainRef} id="main-content" className="relative w-full">
        {enableCanvas && (
          <motion.div
            style={
              isMobile
                ? {
                    position: 'fixed',
                    left: 0,
                    width: '100%',
                    height: '50%',
                    top: canvasTop,
                    clipPath: canvasClipPathMobile,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }
                : {
                    position: 'fixed',
                    top: 0,
                    height: '100%',
                    width: '50%',
                    left: canvasLeft,
                    clipPath: canvasClipPathDesktop,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }
            }
          >
            <Canvas
              eventSource={mainRef as React.RefObject<HTMLElement>}
              eventPrefix="client"
              style={{ width: '100%', height: '100%' }}
              dpr={isMobile ? [1, 1.5] : [1, 2]}
              gl={{ antialias: !isMobile, alpha: true }}
            >
              <BackgroundField scrollRef={scrollRef} />
            </Canvas>
          </motion.div>
        )}

        <section ref={sectionRef} className="relative z-10 w-full" style={{ height: `${TIMELINE_HEIGHT_SVH}svh` }}>
          <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
            {!enableCanvas && (
              <motion.div
                style={{ opacity: heroFallbackOpacity }}
                className="absolute inset-0 z-[5] flex items-center justify-center px-8"
              >
                <h1
                  className="text-balance text-center text-6xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-[10rem]"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
                  }}
                >
                  Sam Herwig
                </h1>
              </motion.div>
            )}

            <HeroOverlay progress={scrollYProgress} />
            <AboutOverlay progress={scrollYProgress} />
            <WorkOverlay progress={scrollYProgress} />
            <ContactOverlay progress={scrollYProgress} />
          </div>
        </section>
      </main>
      <Leva collapsed hidden={!enableCanvas} />
    </>
  );
}
