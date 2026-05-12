'use client';

import { Canvas } from '@react-three/fiber';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackgroundField from '@/components/sections/BackgroundField';
import LetterFillField from '@/components/sections/LetterFillField';
import CaseStudyHeroLayer from '@/components/CaseStudyHeroLayer';
import useCanvasGate from '@/lib/useCanvasGate';
import useIsMobileViewport from '@/lib/useIsMobileViewport';
import { useSceneStore } from '@/lib/useSceneStore';
import { canvasSlot, type CanvasSlot } from '@/lib/moduleTimeline';

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

// Case-study mode slot — left half on desktop. Mobile case study uses its own
// 100vw 1:1 strip path below, so this rect is desktop-only.
const CS_SLOT_DESKTOP: CanvasSlot = { top: 0, left: 0, w: 50, h: 100 };

type FrameLoopMode = 'always' | 'never';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function blendSlot(home: CanvasSlot, cs: CanvasSlot, slide: number): CanvasSlot {
  return {
    top: lerp(home.top, cs.top, slide),
    left: lerp(home.left, cs.left, slide),
    w: lerp(home.w, cs.w, slide),
    h: lerp(home.h, cs.h, slide),
  };
}

function computeTargetSlot(s: { scrollProgress: number; canvasSlide: number }, isMobile: boolean): CanvasSlot {
  const home = canvasSlot(s.scrollProgress, isMobile);
  return isMobile ? home : blendSlot(home, CS_SLOT_DESKTOP, s.canvasSlide);
}

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

  // Source MotionValues for the slot rect. Driven from a per-rAF loop, not a
  // store subscription. Browser scroll events fire on input cadence (often
  // ~30Hz on mouse wheels) with discrete deltas — binding motion.div directly
  // to that chunked source produces a visible staircase on the wrapper rect.
  // Per-rAF lerp toward the latest store target filters that chunkiness into a
  // smooth 60Hz output. Smoothing rate `k` is high enough that perceived lag
  // stays under ~80ms (≈ 5 frames at 60fps) but low enough to absorb scroll
  // event boundaries without staircase.
  const initial = computeTargetSlot(useSceneStore.getState(), isMobile);
  const topRaw = useMotionValue(initial.top);
  const leftRaw = useMotionValue(initial.left);
  const wRaw = useMotionValue(initial.w);
  const hRaw = useMotionValue(initial.h);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const k = 30;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const factor = 1 - Math.exp(-k * dt);
      const t = computeTargetSlot(useSceneStore.getState(), isMobile);
      topRaw.set(topRaw.get() + (t.top - topRaw.get()) * factor);
      leftRaw.set(leftRaw.get() + (t.left - leftRaw.get()) * factor);
      wRaw.set(wRaw.get() + (t.w - wRaw.get()) * factor);
      hRaw.set(hRaw.get() + (t.h - hRaw.get()) * factor);
      // Push smoothed slot center to store for the shader's uModuleCenter.
      // Canvas is full viewport, so center is in vUv [0,1] across the whole
      // canvas. Anchors centered module content (Hero moon) to the visible rect.
      useSceneStore
        .getState()
        .setSlotCenter([(leftRaw.get() + wRaw.get() / 2) / 100, (topRaw.get() + hRaw.get() / 2) / 100]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isMobile, topRaw, leftRaw, wRaw, hRaw]);

  // Derive clip-path inset from the rect MotionValues. Wrapper stays full
  // viewport; clip-path masks the visible region. Animating clip-path is
  // GPU-composited — no layout, no paint, no Canvas resize, no WebGL drawing-
  // buffer reallocation. That's why the rect now glides per-frame even at
  // 60fps with a complex shader inside.
  const clipPath = useTransform(
    [topRaw, leftRaw, wRaw, hRaw],
    ([t, l, w, h]: number[]) => `inset(${t}% ${100 - l - w}% ${100 - t - h}% ${l}%)`,
  );

  if (!visible) return null;

  return (
    <motion.div
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
          : {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
              zIndex: 0,
              clipPath,
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
        <LetterFillField />
        <CaseStudyHeroLayer />
      </Canvas>
    </motion.div>
  );
}
