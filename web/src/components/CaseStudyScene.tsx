'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useCallback } from 'react';
import { useScroll, useVelocity, useSpring, useMotionValueEvent } from 'framer-motion';
import { Color, Mesh, Vector2 } from 'three';
import '@/components/shaders/PaperAtmosphereMaterial';
import type { PaperAtmosphereMaterial as PaperAtmosphereMaterialType } from '@/components/shaders/PaperAtmosphereMaterial';
import HeroLandscape from '@/components/HeroLandscape';

/* ── Atmosphere fullscreen quad ─────────────────────────── */

function AtmosphereLayer({ accentColor, velocity }: { accentColor: string; velocity: React.RefObject<number> }) {
  const { viewport } = useThree();
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<InstanceType<typeof PaperAtmosphereMaterialType>>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Atmosphere is at z=-10, camera at z=5 → depth ratio = 15/5 = 3
      // Scale quad to cover the full visible frustum at that depth
      const depthScale = 3;
      meshRef.current.scale.set(viewport.width * depthScale, viewport.height * depthScale, 1);
    }
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    const current = matRef.current.uVelocity;
    matRef.current.uVelocity += ((velocity.current ?? 0) - current) * 0.08;
    matRef.current.uResolution.set(viewport.width, viewport.height);
  });

  useEffect(() => {
    if (matRef.current) {
      matRef.current.uAccentColor = new Color(accentColor);
    }
  }, [accentColor]);

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-expect-error - R3F JSX element registered via extend() */}
      <paperAtmosphereMaterial
        ref={matRef}
        uAccentColor={new Color(accentColor)}
        uPaperColor={new Color('#f5f5f4')}
        uInkColor={new Color('#18181b')}
        uResolution={new Vector2(viewport.width, viewport.height)}
      />
    </mesh>
  );
}

/* ── Main scene wrapper ──────────────────────────────────── */

interface CaseStudySceneProps {
  slug: string;
  accentColor: string;
}

export default function CaseStudyScene({ slug, accentColor }: CaseStudySceneProps) {
  const velocityRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, { stiffness: 100, damping: 30 });

  useMotionValueEvent(smoothVelocity, 'change', (v) => {
    velocityRef.current = Math.min(Math.abs(v) / 2000, 1);
  });

  // Track scroll progress through hero section (first 130vh)
  useMotionValueEvent(scrollY, 'change', (y) => {
    const heroHeight = window.innerHeight * 1.3;
    scrollProgressRef.current = Math.min(y / heroHeight, 1);
  });

  // Normalized mouse position (-1 to 1)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true" onMouseMove={handleMouseMove}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: false }}>
        <AtmosphereLayer accentColor={accentColor} velocity={velocityRef} />
        <HeroLandscape
          slug={slug}
          accentColor={accentColor}
          scrollProgress={scrollProgressRef}
          scrollVelocity={velocityRef}
          mouse={mouseRef}
        />
      </Canvas>
    </div>
  );
}
