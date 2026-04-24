'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Color, Mesh, MathUtils, Vector2, Group, Texture, Points as THREEPoints } from 'three';

import { HERO_SCENES, HERO_SCENES_MOBILE, DEFAULT_HERO, DEFAULT_HERO_MOBILE } from '@/lib/heroAssets';
import '@/components/shaders/WoodcutMaterial';

/* ── Hoisted constants ──────────────────────────────────── */
const COLOR_BASE = new Color('#18181b'); // Foreground token — ink
const COLOR_PAPER = new Color('#f9fafb'); // Background token — paper
const COLOR_WATER = new Color('#38aeea'); // Clear blue watercolor bleed
const COLOR_WARM = new Color('#f6c400'); // Golden yellow cursor core
const MOBILE_QUERY = '(max-width: 767px)';
const WATER_RADIUS = 0.57;
const WASH_INTENSITY = 1.4;
const EDGE_POOL = 0.21;
const GRAIN_AMOUNT = 0.08;
const DISTORTION_STRENGTH = 0.12;
const NOISE_SCALE = 27.0;
const FLOW_SPEED = 0.2;
// Off-screen resting position so smoothstep(1.5, 0.0, distToMouse) → 0
const OFFSCREEN_MOUSE = new Vector2(10, 10);

/* ── Scene envelope helper ───────────────────────────────────────────── */
function applyGroupOpacity(group: Group, envelope: number): void {
  group.traverse((child) => {
    const mesh = child as Mesh | THREEPoints;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      // Skip materials that manage their own opacity
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mat as any).__selfManagedOpacity) continue;

      if ('opacity' in mat) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((mat as any).__baseOpacity === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mat as any).__baseOpacity = mat.opacity;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mat.opacity = (mat as any).__baseOpacity * envelope;
        mat.transparent = true;
      }

      if ('uOpacity' in mat) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((mat as any).__baseUOpacity === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mat as any).__baseUOpacity = (mat as any).uOpacity;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mat as any).uOpacity = (mat as any).__baseUOpacity * envelope;
        mat.transparent = true;
      }
    }
  });
}

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

/* ── Hero3DLayer ────────────────────────────────────────── */
function Hero3DLayer({
  textureUrl,
  position,
  scale,
  uPaperOpacity = 0,
  isActive,
  mousePos,
  touchMouse,
  touchTarget,
  isMobile,
  scrollProgress,
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
  uPaperOpacity?: number;
  isActive?: React.MutableRefObject<boolean>;
  mousePos: React.MutableRefObject<Vector2>;
  touchMouse: React.MutableRefObject<Vector2>;
  touchTarget: React.MutableRefObject<Vector2>;
  isMobile: boolean;
  scrollProgress: React.RefObject<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame((state) => {
    if (isActive && !isActive.current) return;

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime * 0.15;
      materialRef.current.uWind = state.clock.elapsedTime * 0.15;
      materialRef.current.uRadius = WATER_RADIUS;
      materialRef.current.uWashIntensity = WASH_INTENSITY;
      materialRef.current.uEdgePool = EDGE_POOL;
      materialRef.current.uGrainAmount = GRAIN_AMOUNT;
      materialRef.current.uStrength = DISTORTION_STRENGTH;
      materialRef.current.uNoiseScale = NOISE_SCALE;
      materialRef.current.uSpeed = FLOW_SPEED;
      materialRef.current.uScrollProgress = scrollProgress.current ?? 0;
      materialRef.current.uUseLuminance = 1;
      if (isMobile) {
        touchMouse.current.lerp(touchTarget.current, 0.1);
        materialRef.current.uMouse.copy(touchMouse.current);
      } else {
        materialRef.current.uMouse.lerp(mousePos.current, 0.1);
      }
    }

    // Desktop: gentle parallax tilt that follows the cursor
    if (!isMobile && meshRef.current) {
      meshRef.current.rotation.y = mousePos.current.x * 0.08;
      meshRef.current.rotation.x = -mousePos.current.y * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[scale[0], scale[1], 64, 64]} />
      <woodcutShaderMaterial
        ref={materialRef}
        uTexture={tex}
        uColorBase={COLOR_BASE}
        uColorPaper={COLOR_PAPER}
        uColorWater={COLOR_WATER}
        uColorWarm={COLOR_WARM}
        uOpacity={1}
        uPaperOpacity={uPaperOpacity}
        uWind={0}
        uRadius={WATER_RADIUS}
        uWashIntensity={WASH_INTENSITY}
        uEdgePool={EDGE_POOL}
        uGrainAmount={GRAIN_AMOUNT}
        uStrength={DISTORTION_STRENGTH}
        uNoiseScale={NOISE_SCALE}
        uSpeed={FLOW_SPEED}
        uUseLuminance={1}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Stacked hero scene ────────────────────────────── */

interface HeroPlaneProps {
  textureUrl: string;
  scrollProgress: React.RefObject<number>;
  isMobile: boolean;
}

function HeroPlane({ textureUrl, scrollProgress, isMobile }: HeroPlaneProps) {
  const groupRef = useRef<Group>(null);
  const isActive = useRef(true);

  const mousePos = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));
  const touchMouse = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));
  const touchTarget = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));

  // Desktop: ambient mousemove drives cursor. Mobile: scroll-driven.
  useEffect(() => {
    if (!isMobile) {
      const onMouse = (e: MouseEvent) => {
        mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouse, { passive: true });
      return () => window.removeEventListener('mousemove', onMouse);
    }
  }, [isMobile]);

  useFrame(() => {
    const progress = scrollProgress.current ?? 0;

    // Hero fade: start receding as the overlay text enters near 40% of the
    // plate height, fully out by 90%. Leaves breathing room before container fade.
    const heroFade = 1 - MathUtils.smoothstep(progress, 0.4, 0.9);
    isActive.current = heroFade > 0;

    if (groupRef.current) {
      groupRef.current.visible = heroFade > 0;
      if (groupRef.current.visible) {
        applyGroupOpacity(groupRef.current, heroFade);
      }
    }

    // Mobile: scroll becomes the "cursor" — y travels +1 (top) → -1 (bottom),
    // with a gentle x wobble so the bloom doesn't run in a straight line.
    if (isMobile) {
      const y = 1 - progress * 2;
      const x = Math.sin(progress * Math.PI * 2) * 0.35;
      touchTarget.current.set(x, y);
    }
  });

  return (
    <group ref={groupRef}>
      <Hero3DLayer
        textureUrl="/grove/02-mountains.webp"
        position={[13.0, 15.5, -92]}
        scale={[180, 35]}
        uPaperOpacity={1.0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        scrollProgress={scrollProgress}
      />
      <Hero3DLayer
        textureUrl="/grove/05-mist.webp"
        position={[0, 4.7, -96]}
        scale={[400, 9.7]}
        uPaperOpacity={0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        scrollProgress={scrollProgress}
      />
      <Hero3DLayer
        textureUrl={textureUrl}
        position={[0, 2.5, -58]}
        scale={[120, 75]}
        uPaperOpacity={0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        scrollProgress={scrollProgress}
      />
      <Hero3DLayer
        textureUrl="/grove/05-mist.webp"
        position={[0, 0.0, -35]}
        scale={[383, 2.4]}
        uPaperOpacity={0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        scrollProgress={scrollProgress}
      />
      <Hero3DLayer
        textureUrl="/grove/06-near-bank.webp"
        position={[0, -8, -20]}
        scale={[100, 30]}
        uPaperOpacity={0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        scrollProgress={scrollProgress}
      />
    </group>
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
