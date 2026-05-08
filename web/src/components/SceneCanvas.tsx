'use client';

import { Canvas } from '@react-three/fiber';
import { animate } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackgroundField from '@/components/sections/BackgroundField';
import CaseStudyHeroLayer from '@/components/CaseStudyHeroLayer';
import useCanvasGate from '@/lib/useCanvasGate';
import useIsMobileViewport from '@/lib/useIsMobileViewport';
import { useSceneStore } from '@/lib/useSceneStore';
import { canvasLeanFactor, canvasLeftPct, canvasTopPct } from '@/lib/moduleTimeline';

const SLASH_PEAK_PCT = 12;
const WORK_PATH = /^\/work\/([^/]+)$/;

const SLUG_TO_INDEX: Record<string, number> = {
  'mission-bell': 0,
  'new-belgium': 1,
  'consume-and-create': 2,
  craftedkit: 3,
};

const FORWARD_DURATION = 1.1;
const BACK_FADE_DURATION = 0.4;
const FORWARD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type FrameLoopMode = 'always' | 'never';

export default function SceneCanvas() {
  const pathname = usePathname();
  const enableCanvas = useCanvasGate();
  const isMobile = useIsMobileViewport();
  const isHome = pathname === '/';

  // Pause the render loop while the tab is hidden. Browsers throttle rAF in
  // background tabs so this is largely defense-in-depth, but it also frees the
  // GPU instantly on tab-switch instead of waiting for the throttle ramp.
  const [frameloop, setFrameloop] = useState<FrameLoopMode>('always');
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVis = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  // `slug` is a primitive so it can sit in the choreography effect's dep array
  // without re-firing every render. A fresh array (e.g. `pathname.match(...)`)
  // would invalidate the deps each render, cancel the in-flight slide
  // animation, and snap the canvas instantly into case-study state.
  const slug = pathname?.match(WORK_PATH)?.[1] ?? null;
  const isCaseStudy = slug != null;
  const visible = enableCanvas && (isHome || isCaseStudy);
  const isMobileCaseStudy = isMobile && isCaseStudy;

  const [scrollProgress, setScrollProgress] = useState(() => useSceneStore.getState().scrollProgress);
  const [canvasSlide, setCanvasSlide] = useState(() => useSceneStore.getState().canvasSlide);
  useEffect(() => {
    return useSceneStore.subscribe((s) => {
      setScrollProgress(s.scrollProgress);
      setCanvasSlide(s.canvasSlide);
    });
  }, []);

  // Pathname-driven choreography. Forward = slide. Back = snap-position + fade-shader.
  // Direct entry = snap. Slug→slug = index swap only.
  useEffect(() => {
    const store = useSceneStore.getState();
    const prev = store.previousPathname;
    const prevIsCaseStudy = prev != null && WORK_PATH.test(prev);

    if (isCaseStudy && slug) {
      const idx = SLUG_TO_INDEX[slug] ?? 0;
      store.setCsHeroIndex(idx);
    }

    let cancelled = false;
    const stopHandles: Array<() => void> = [];

    if (isCaseStudy) {
      if (prev === '/' && !isMobile) {
        // Forward slide
        const aSlide = animate(store.canvasSlide, 1, {
          duration: FORWARD_DURATION,
          ease: FORWARD_EASE,
          onUpdate: (v) => {
            if (cancelled) return;
            store.setCanvasSlide(v);
          },
        });
        const aWeight = animate(store.csHeroWeight, 1, {
          duration: FORWARD_DURATION,
          ease: FORWARD_EASE,
          onUpdate: (v) => {
            if (cancelled) return;
            store.setCsHeroWeight(v);
          },
        });
        stopHandles.push(
          () => aSlide.stop(),
          () => aWeight.stop(),
        );
      } else {
        // Direct entry, slug→slug, or mobile — snap.
        store.setCanvasSlide(1);
        store.setCsHeroWeight(1);
      }
    } else if (isHome) {
      if (prevIsCaseStudy && !isMobile) {
        // Back navigation — snap canvas position, fade shader.
        store.setCanvasSlide(0);
        const aWeight = animate(store.csHeroWeight, 0, {
          duration: BACK_FADE_DURATION,
          ease: 'easeOut',
          onUpdate: (v) => {
            if (cancelled) return;
            store.setCsHeroWeight(v);
          },
        });
        stopHandles.push(() => aWeight.stop());
      } else {
        store.setCanvasSlide(0);
        store.setCsHeroWeight(0);
      }
    }

    store.setPreviousPathname(pathname);

    return () => {
      cancelled = true;
      stopHandles.forEach((stop) => stop());
    };
  }, [pathname, isCaseStudy, isHome, isMobile, slug]);

  if (!visible) return null;

  // Slot position. canvasSlide blends from home's scroll-driven slot → left (0%).
  const homeLeft = canvasLeftPct(scrollProgress);
  const homeTop = canvasTopPct(scrollProgress);
  const left = homeLeft + (0 - homeLeft) * canvasSlide;
  const top = homeTop + (0 - homeTop) * canvasSlide;

  // Lean fades out as we slide into case-study state.
  const leanScale = 1 - canvasSlide;
  const lean = canvasLeanFactor(scrollProgress) * SLASH_PEAK_PCT * leanScale;
  const tlx = Math.max(0, lean);
  const trx = 100 + Math.min(0, lean);
  const brx = 100 - Math.max(0, lean);
  const blx = -Math.min(0, lean);
  const clipDesktop = `polygon(${tlx}% 0%, ${trx}% 0%, ${brx}% 100%, ${blx}% 100%)`;

  const leanMobile = -canvasLeanFactor(scrollProgress) * SLASH_PEAK_PCT * leanScale;
  const tly = Math.max(0, leanMobile);
  const try_ = -Math.min(0, leanMobile);
  const bry = 100 - Math.max(0, leanMobile);
  const bly = 100 + Math.min(0, leanMobile);
  const clipMobile = `polygon(0% ${tly}%, 100% ${try_}%, 100% ${bry}%, 0% ${bly}%)`;

  return (
    <div
      aria-hidden="true"
      style={
        isMobileCaseStudy
          ? {
              // 1:1 strip pinned to top of viewport. zIndex 10 keeps the shader
              // above flow content (z-0) while staying beneath the case-study
              // back nav (z-20) and ScrollProgress bar (z-30).
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100vw',
              pointerEvents: 'none',
              zIndex: 10,
            }
          : isMobile
            ? {
                position: 'fixed',
                left: 0,
                width: '100%',
                height: '50%',
                top: `${top}%`,
                clipPath: clipMobile,
                pointerEvents: 'none',
                zIndex: 0,
              }
            : {
                position: 'fixed',
                top: 0,
                height: '100%',
                width: '50%',
                left: `${left}%`,
                clipPath: clipDesktop,
                pointerEvents: 'none',
                zIndex: 0,
              }
      }
    >
      <Canvas
        style={{ width: '100%', height: '100%' }}
        frameloop={frameloop}
        dpr={isMobileCaseStudy ? [1, 1] : isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !isMobile, alpha: true }}
      >
        <BackgroundField />
        <CaseStudyHeroLayer />
      </Canvas>
    </div>
  );
}
