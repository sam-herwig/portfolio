'use client';

import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Color, Mesh, MathUtils, Vector2, Vector3 } from 'three';

import { HERO_SCENES, HERO_SCENES_MOBILE, DEFAULT_HERO, DEFAULT_HERO_MOBILE } from '@/lib/heroAssets';
import '@/components/shaders/WoodcutMaterial';
import type { WoodcutShaderMaterial as WoodcutShaderMaterialType } from '@/components/shaders/WoodcutMaterial';

/* ── Hoisted constants ──────────────────────────────────── */
const COLOR_BASE = new Color('#18181b'); // Foreground token — ink
const COLOR_PAPER = new Color('#f9fafb'); // Background token — paper
const PLANE_Z = -5;
const MOBILE_QUERY = '(max-width: 767px)';
// Off-screen resting position so smoothstep(1.5, 0.0, distToMouse) → 0
const OFFSCREEN_MOUSE = new Vector2(10, 10);

/* ── useIsMobile — SSR-safe media-query hook ────────────── */

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
}

/* ── Single-plane hero scene ────────────────────────────── */

interface HeroPlaneProps {
  textureUrl: string;
  scrollProgress: React.RefObject<number>;
  isMobile: boolean;
}

function HeroPlane({ textureUrl, scrollProgress, isMobile }: HeroPlaneProps) {
  const texture = useTexture(textureUrl);
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<InstanceType<typeof WoodcutShaderMaterialType>>(null);
  const mousePos = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));
  const touchTarget = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));
  const { viewport, camera } = useThree();

  // Contain-fit the texture to the viewport at this depth
  const zVec = useMemo(() => new Vector3(0, 0, PLANE_Z), []);
  const cv = viewport.getCurrentViewport(camera, zVec);
  const image = texture.image as { width?: number; height?: number } | undefined;
  const imageAspect = image?.width && image?.height ? image.width / image.height : 16 / 10;
  const viewportAspect = cv.width / cv.height;
  const containScale: [number, number] =
    imageAspect > viewportAspect
      ? [cv.width * 1.2, (cv.width * 1.2) / imageAspect]
      : [cv.height * 1.2 * imageAspect, cv.height * 1.2];

  // Desktop: cursor tracking for watercolor injection (always-on).
  // Mobile: scroll-driven — target drifts top→bottom as the reader descends,
  // so the watercolor bloom trails through the plate on every scroll.
  useEffect(() => {
    if (isMobile) return;

    const onMouse = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      touchTarget.current.set(nx, ny);
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
    };
  }, [isMobile]);

  useFrame((state) => {
    if (!matRef.current) return;
    // Hero fade: start receding as the overlay text enters near 40% of the
    // plate height, fully out by 90%. Leaves breathing room before container fade.
    const progress = scrollProgress.current ?? 0;
    const heroFade = 1 - MathUtils.smoothstep(progress, 0.4, 0.9);
    matRef.current.uOpacity = heroFade;
    // uTime drives fragment watercolor flow distortion (sin/cos ripple)
    matRef.current.uTime = state.clock.elapsedTime * 0.15;
    matRef.current.uWind = state.clock.elapsedTime * 0.15;
    // Mobile: scroll becomes the "cursor" — y travels +1 (top) → -1 (bottom),
    // with a gentle x wobble so the bloom doesn't run in a straight line.
    if (isMobile) {
      const y = 1 - progress * 2;
      const x = Math.sin(progress * Math.PI * 2) * 0.35;
      touchTarget.current.set(x, y);
    }
    // Lerp mousePos toward touchTarget (smooth chase for both desktop + mobile)
    mousePos.current.lerp(touchTarget.current, 0.1);
    matRef.current.uMouse.copy(mousePos.current);
    // Desktop: gentle parallax tilt that follows the cursor — plane leans toward
    // whichever corner you're hovering. Mobile stays flat (touchTarget is scroll-driven).
    if (!isMobile && meshRef.current) {
      meshRef.current.rotation.y = mousePos.current.x * 0.08;
      meshRef.current.rotation.x = -mousePos.current.y * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, PLANE_Z]}>
      {/* 64x64 subdivision kept for easy vertex-effect re-enable via shader uncomment */}
      <planeGeometry args={[containScale[0], containScale[1], 64, 64]} />
      {/* @ts-expect-error - R3F JSX element registered via extend() */}
      <woodcutShaderMaterial
        ref={matRef}
        uTexture={texture}
        uColorBase={COLOR_BASE}
        uColorPaper={COLOR_PAPER}
        uOpacity={1}
        uPaperOpacity={1}
        uWind={0}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Exported wrapper with Suspense ─────────────────────── */

interface HeroLandscapeProps {
  slug: string;
  scrollProgress: React.RefObject<number>;
}

export default function HeroLandscape({ slug, scrollProgress }: HeroLandscapeProps) {
  const isMobile = useIsMobile();
  const textureUrl = isMobile ? (HERO_SCENES_MOBILE[slug] ?? DEFAULT_HERO_MOBILE) : (HERO_SCENES[slug] ?? DEFAULT_HERO);

  return (
    <Suspense fallback={null}>
      <HeroPlane textureUrl={textureUrl} scrollProgress={scrollProgress} isMobile={isMobile} />
    </Suspense>
  );
}
