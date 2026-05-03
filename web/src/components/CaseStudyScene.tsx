'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { Color, Mesh, Vector2, MathUtils } from 'three';

/* ── Hoisted constants (avoid per-render allocations) ──── */
const PAPER_COLOR = new Color('#f9fafb'); // Background token — paper
const INK_COLOR = new Color('#18181b'); // Foreground token — ink

import '@/components/shaders/PaperAtmosphereMaterial';
import type { PaperAtmosphereMaterial as PaperAtmosphereMaterialType } from '@/components/shaders/PaperAtmosphereMaterial';
import HeroLandscape from '@/components/HeroLandscape';
import useWebGLSupport from '@/lib/useWebGLSupport';
import { useAppStore } from '@/store/useAppStore';

/* ── Atmosphere fullscreen quad ─────────────────────────── */

function AtmosphereLayer() {
  const { viewport } = useThree();
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<InstanceType<typeof PaperAtmosphereMaterialType>>(null);
  const resolution = useMemo(() => new Vector2(viewport.width, viewport.height), [viewport.width, viewport.height]);

  useFrame((state) => {
    if (meshRef.current) {
      const depthScale = 3;
      meshRef.current.scale.set(viewport.width * depthScale, viewport.height * depthScale, 1);
    }
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    matRef.current.uResolution.set(viewport.width, viewport.height);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-expect-error - R3F JSX element registered via extend() */}
      <paperAtmosphereMaterial ref={matRef} uPaperColor={PAPER_COLOR} uInkColor={INK_COLOR} uResolution={resolution} />
    </mesh>
  );
}

/* ── Main scene wrapper ──────────────────────────────────── */

interface CaseStudySceneProps {
  slug: string;
}

function CaseStudyCamera({ scrollProgress }: { scrollProgress: React.RefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    const p = scrollProgress.current ?? 0;
    // Single hero plane at z=0; camera dollies gently forward across the
    // hero zone so the plate breathes without parallaxing past geometry.
    const heroZ = MathUtils.lerp(12, 8, p);
    camera.position.set(0, 0, heroZ);
    camera.rotation.set(0, 0, 0);
  });
  return null;
}

export default function CaseStudyScene({ slug }: CaseStudySceneProps) {
  const webglSupported = useWebGLSupport();
  const scrollProgressRef = useRef(0);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [isHidden, setIsHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const transitionState = useAppStore((s) => s.transitionState);
  const isPaused = isHidden || transitionState === 'entering';

  useEffect(() => {
    const onVisibility = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const { scrollY } = useScroll();

  // Track hero scroll progress (0 → 1 across exactly one viewport = 100vh)
  // and fade the whole scene out as we cross past the hero moment.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const heroHeight = window.innerHeight;
    scrollProgressRef.current = Math.min(y / heroHeight, 1);

    // Fade the fixed canvas from 1 → 0 as we cross 100vh → 110vh.
    // Past that, the content scrolls on clean theme background.
    const fadeStart = heroHeight;
    const fadeEnd = heroHeight * 1.1;
    const op = 1 - Math.max(0, Math.min(1, (y - fadeStart) / (fadeEnd - fadeStart)));
    setContainerOpacity(op);
  });

  // Set initial scroll progress on mount for static first paint
  useEffect(() => {
    scrollProgressRef.current = Math.min(window.scrollY / window.innerHeight, 1);
  }, []);

  // No-WebGL fallback: skip the fixed Canvas entirely — content + masthead
  // already look complete standalone on the clean paper background.
  if (webglSupported === false) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      style={{ opacity: containerOpacity, transition: 'opacity 0.12s linear' }}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        frameloop={isPaused ? 'demand' : 'always'}
      >
        <CaseStudyCamera scrollProgress={scrollProgressRef} />
        <AtmosphereLayer />
        <HeroLandscape slug={slug} scrollProgress={scrollProgressRef} />
      </Canvas>
    </div>
  );
}
