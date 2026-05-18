'use client';

import { Canvas } from '@react-three/fiber';
import { animate, m, useMotionValue, useTransform } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import BackgroundField from '@/components/sections/BackgroundField';
import CaseStudyHeroLayer from '@/components/CaseStudyHeroLayer';
import useCanvasGate from '@/lib/useCanvasGate';
import useIsMobileViewport from '@/lib/useIsMobileViewport';
import useWebGLSupport from '@/lib/useWebGLSupport';
import { useSceneStore } from '@/lib/useSceneStore';
import { canvasSlot, type CanvasSlot } from '@/lib/moduleTimeline';
import { heroBandVisibility } from '@/lib/caseStudyTimeline';

const WORK_PATH = /^\/work\/([^/]+)$/;

const SLUG_TO_INDEX: Record<string, number> = {
  'mission-bell': 0,
  'new-belgium': 1,
  'consume-and-create': 2,
  craftedkit: 3,
  'phantom-labs': 4,
};

// Forward slide is two-phase: clip-path contracts first (phase 1), then the
// case-study hero shader fades in atop the now-settled rect (phase 2). The
// 150ms overlap (morph starts at 0.45s while contract ends at 0.6s) hides the
// seam so the eye doesn't register a stop-and-restart. Back-nav stays a single
// fast shader fade; the geometry snap is invisible because csHeroWeight=0
// hides the case-study layer the moment the user is back on home.
const FORWARD_CONTRACT_DURATION = 0.6;
const FORWARD_CONTRACT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const FORWARD_MORPH_DURATION = 0.5;
const FORWARD_MORPH_DELAY = 0.45;
const BACK_FADE_DURATION = 0.4;

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

function computeTargetSlot(
  s: { scrollProgress: number; canvasSlide: number },
  isMobile: boolean,
  originOverride: CanvasSlot | null,
): CanvasSlot {
  // During a forward slide we pin `home` to the rect the canvas was actually
  // showing at click-time. Defense-in-depth against any scroll-driven write
  // landing on `scrollProgress` mid-transition (case-study ScrollProgress no
  // longer writes it, but the snapshot also captures the visual rect more
  // honestly than re-deriving from a global).
  const home = originOverride ?? canvasSlot(s.scrollProgress, isMobile);
  return isMobile ? home : blendSlot(home, CS_SLOT_DESKTOP, s.canvasSlide);
}

export default function SceneCanvas() {
  const pathname = usePathname();
  const enableCanvas = useCanvasGate();
  const webgl = useWebGLSupport();
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

  // Snapshot of the canvas slot rect the user saw at click-time. Kept in a
  // ref (not the store) because only the rAF tick in this component reads it,
  // and ref reads bypass React re-render cycles entirely. Non-null only while
  // a forward slide is animating; cleared on completion, back-nav, slug→slug,
  // or any cancel.
  const slideOriginRef = useRef<CanvasSlot | null>(null);

  // Source MotionValues for the slot rect. Driven from a per-rAF loop, not a
  // store subscription. Declared before the pathname effect so its slide-start
  // snapshot can read the current visual rect via `.get()`.
  const initial = computeTargetSlot(useSceneStore.getState(), isMobile, null);
  const topRaw = useMotionValue(initial.top);
  const leftRaw = useMotionValue(initial.left);
  const wRaw = useMotionValue(initial.w);
  const hRaw = useMotionValue(initial.h);
  const heroOpacityRaw = useMotionValue(1);

  // Pathname-driven choreography. Forward = two-phase slide (contract then
  // identity-morph). Back = snap-position + fade-shader. Direct entry = snap.
  // Slug→slug = index swap only.
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
        const reducedMotion =
          typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
          slideOriginRef.current = null;
          store.setCanvasSlide(1);
          store.setCsHeroWeight(1);
        } else {
          // Capture the rect the user just saw. The MotionValues hold the last
          // rAF-tick output regardless of what the store has done since.
          slideOriginRef.current = {
            top: topRaw.get(),
            left: leftRaw.get(),
            w: wRaw.get(),
            h: hRaw.get(),
          };
          // Phase 1: clip-path contracts from origin slot → CS_SLOT_DESKTOP.
          const aSlide = animate(store.canvasSlide, 1, {
            duration: FORWARD_CONTRACT_DURATION,
            ease: FORWARD_CONTRACT_EASE,
            onUpdate: (v) => {
              if (cancelled) return;
              store.setCanvasSlide(v);
            },
            onComplete: () => {
              if (cancelled) return;
              slideOriginRef.current = null;
            },
          });
          // Phase 2: case-study hero shader fades in inside the settled slot.
          // Delayed so the contraction reads against a stable Work-mode shader
          // for most of phase 1; the 150ms overlap softens the join.
          const aWeight = animate(store.csHeroWeight, 1, {
            duration: FORWARD_MORPH_DURATION,
            delay: FORWARD_MORPH_DELAY,
            ease: 'easeInOut',
            onUpdate: (v) => {
              if (cancelled) return;
              store.setCsHeroWeight(v);
            },
          });
          stopHandles.push(
            () => aSlide.stop(),
            () => aWeight.stop(),
          );
        }
      } else {
        // Direct entry, slug→slug, or mobile — snap.
        slideOriginRef.current = null;
        store.setCanvasSlide(1);
        store.setCsHeroWeight(1);
      }
    } else if (isHome) {
      slideOriginRef.current = null;
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
  }, [pathname, isCaseStudy, isHome, isMobile, slug, topRaw, leftRaw, wRaw, hRaw]);

  // Per-rAF lerp from current MotionValue toward the computed target slot.
  // Browser scroll events fire on input cadence (often ~30Hz on mouse wheels)
  // with discrete deltas — binding m.div directly to that chunked source
  // produces a visible staircase. Per-rAF smoothing at `k=10` (~69ms half-life)
  // lets the slot trail the scroll with weight while absorbing scroll-event
  // boundaries. heroOpacityRaw tracks the case-study Hero band exit fade —
  // stays 1 on home and inside the band; fades 1→0 as scroll exits the band.
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const k = 10;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const factor = 1 - Math.exp(-k * dt);
      const state = useSceneStore.getState();
      const t = computeTargetSlot(state, isMobile, slideOriginRef.current);
      topRaw.set(topRaw.get() + (t.top - topRaw.get()) * factor);
      leftRaw.set(leftRaw.get() + (t.left - leftRaw.get()) * factor);
      wRaw.set(wRaw.get() + (t.w - wRaw.get()) * factor);
      hRaw.set(hRaw.get() + (t.h - hRaw.get()) * factor);
      // Push smoothed slot center to store for the shader's uModuleCenter.
      // Canvas is full viewport, so center is in vUv [0,1] across the whole
      // canvas. Slots are defined in CSS top-down (slot.top = % from top), but
      // vUv is bottom-up — flip Y so the moon centers inside the visible slot
      // rect on mobile (where slots are 50% tall, exposing the bug). Same flip
      // convention HomeSceneRoot uses for pointer → uMouse.
      useSceneStore
        .getState()
        .setSlotCenter([(leftRaw.get() + wRaw.get() / 2) / 100, 1 - (topRaw.get() + hRaw.get() / 2) / 100]);
      const targetOpacity = isCaseStudy ? heroBandVisibility(state.csHeroBandProgress) : 1;
      heroOpacityRaw.set(heroOpacityRaw.get() + (targetOpacity - heroOpacityRaw.get()) * factor);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isMobile, isCaseStudy, topRaw, leftRaw, wRaw, hRaw, heroOpacityRaw]);

  // Derive clip-path inset from the rect MotionValues. Wrapper stays full
  // viewport; clip-path masks the visible region. Animating clip-path is
  // GPU-composited — no layout, no paint, no Canvas resize, no WebGL drawing-
  // buffer reallocation. That's why the rect now glides per-frame even at
  // 60fps with a complex shader inside.
  const clipPath = useTransform(
    [topRaw, leftRaw, wRaw, hRaw],
    ([t, l, w, h]: number[]) => `inset(${t}% ${100 - l - w}% ${100 - t - h}% ${l}%)`,
  );

  if (!visible) {
    // Last-resort backdrop for browsers without WebGL. Reduced-motion users get
    // the static overlay path in HomeSceneRoot instead, so we only render this
    // when WebGL is explicitly unsupported — keeps the dark void from looking
    // broken on home / case study without competing with the real shader.
    if (webgl === false && (isHome || isCaseStudy)) {
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(196, 245, 122, 0.06) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(120, 160, 220, 0.05) 0%, transparent 60%), var(--color-background)',
          }}
        />
      );
    }
    return null;
  }

  return (
    <m.div
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
              opacity: heroOpacityRaw,
            }
          : {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              // Canvas wrapper and sticky overlay (HomeSceneRoot) both use
              // 100dvh so the work slot's 50/50 seam stays aligned across
              // every mobile browser as the URL/toolbar chrome collapses
              // and expands on scroll.
              height: '100dvh',
              pointerEvents: 'none',
              zIndex: 0,
              clipPath,
              opacity: heroOpacityRaw,
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
    </m.div>
  );
}
