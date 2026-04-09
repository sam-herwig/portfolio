'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Color, Mesh, Vector2, MathUtils } from 'three';
import {
  heroBiomes,
  LAYER_SPEED,
  LAYER_Z,
  LAYER_OPACITY,
  LAYER_PAPER_OPACITY,
  CAMERA_Z,
  seededRandom,
  getDaySeed,
  type HeroElement,
} from '@/lib/heroAssets';
import '@/components/shaders/WoodcutMaterial';
import type { WoodcutShaderMaterial as WoodcutShaderMaterialType } from '@/components/shaders/WoodcutMaterial';

/* ── Single woodcut sprite ──────────────────────────────── */

interface SpriteProps {
  element: HeroElement;
  worldX: number;
  worldY: number;
  worldScale: number;
  layerOpacity: number;
  layerPaperOpacity: number;
  scrollProgress: React.RefObject<number>;
  scrollVelocity: React.RefObject<number>;
  mouse: React.RefObject<{ x: number; y: number }>;
  accentColor: string;
  heroFade: React.RefObject<number>;
  isTouch: boolean;
}

function WoodcutSprite({
  element,
  worldX,
  worldY,
  worldScale,
  layerOpacity,
  layerPaperOpacity,
  scrollProgress,
  scrollVelocity,
  mouse,
  accentColor,
  heroFade,
  isTouch,
}: SpriteProps) {
  const texture = useTexture(element.src);
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<InstanceType<typeof WoodcutShaderMaterialType>>(null);
  const { viewport } = useThree();

  const layerSpeed = LAYER_SPEED[element.layer];
  const z = LAYER_Z[element.layer];

  // Compute aspect ratio from the loaded texture
  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 1;

  const baseY = worldY;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Parallax: translate Y based on scroll progress and layer speed
    const travel = viewport.height * 1.3; // total Y travel range
    const progress = scrollProgress.current ?? 0;
    const yOffset = -progress * layerSpeed * travel;
    meshRef.current.position.y = baseY + yOffset;

    // Fade with hero — multiply layer base opacity by hero fade-out
    const fade = heroFade.current ?? 1;
    if (matRef.current) {
      matRef.current.uOpacity = layerOpacity * fade;

      // Slow ambient time for watercolor flow distortion
      matRef.current.uTime = state.clock.elapsedTime * 0.15;

      if (isTouch) {
        // Mobile: wind + watercolor driven by scroll velocity
        const vel = scrollVelocity.current ?? 0;
        matRef.current.uWind = state.clock.elapsedTime * 0.1 + vel * 3;
        // Watercolor tracks scroll position vertically through the scene
        const scrollY = -(progress * 2 - 1);
        matRef.current.uMouse.set(0, scrollY);
      } else {
        // Desktop: gentle ambient sway, watercolor follows mouse hover
        matRef.current.uWind = state.clock.elapsedTime * 0.15;
        matRef.current.uMouse.set(mouse.current?.x ?? 0, mouse.current?.y ?? 0);
      }
    }
  });

  // Scale plane to preserve aspect ratio
  const planeW = worldScale;
  const planeH = worldScale / aspect;

  return (
    <mesh ref={meshRef} position={[worldX, baseY, z]}>
      <planeGeometry args={[planeW, planeH]} />
      {/* @ts-expect-error - R3F JSX element registered via extend() */}
      <woodcutShaderMaterial
        ref={matRef}
        uTexture={texture}
        uColorBase={new Color('#18181b')}
        uColorPaper={new Color('#f5f5f4')}
        uColorWater={new Color(accentColor)}
        uColorSun={new Color('#fcd34d')}
        uColorAlt={new Color(accentColor)}
        uOpacity={layerOpacity}
        uPaperOpacity={layerPaperOpacity}
        uWind={0}
        uMouse={new Vector2(0, 0)}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Full landscape ─────────────────────────────────────── */

interface LandscapeInnerProps {
  slug: string;
  accentColor: string;
  scrollProgress: React.RefObject<number>;
  scrollVelocity: React.RefObject<number>;
  mouse: React.RefObject<{ x: number; y: number }>;
}

function LandscapeInner({ slug, accentColor, scrollProgress, scrollVelocity, mouse }: LandscapeInnerProps) {
  const { viewport } = useThree();
  const heroFade = useRef(1);
  const [isTouch] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);

  // Resolve biome (fallback to new-belgium)
  const biome = heroBiomes[slug] ?? heroBiomes['new-belgium'];

  // Seed placement once per day
  const placements = useMemo(() => {
    const rng = seededRandom(getDaySeed() + slug.length);
    return biome.elements.map((el) => {
      const xOffset = (rng() - 0.5) * 2 * el.xVariance;
      return { xOffset };
    });
  }, [biome, slug]);

  // Update hero fade based on scroll progress
  useFrame(() => {
    const progress = scrollProgress.current ?? 0;
    // Fade out from 0.75 → 1.0
    heroFade.current = 1 - MathUtils.smoothstep(progress, 0.75, 1.0);
  });

  return (
    <group>
      {biome.elements.map((el, i) => {
        const placement = placements[i];
        const z = LAYER_Z[el.layer];
        // Visible area at this Z depth (perspective scaling)
        const depthScale = (CAMERA_Z - z) / CAMERA_Z;
        const visibleW = viewport.width * depthScale;
        const visibleH = viewport.height * depthScale;
        // Convert normalized coords to world coords at this depth
        const worldX = (el.basePosition[0] + placement.xOffset) * visibleW * 0.5;
        const worldY = el.basePosition[1] * visibleH * 0.5;
        // Scale = fraction of visible width at depth
        const worldScale = el.scale * visibleW;

        return (
          <WoodcutSprite
            key={`${el.src}-${i}`}
            element={el}
            worldX={worldX}
            worldY={worldY}
            worldScale={worldScale}
            layerOpacity={LAYER_OPACITY[el.layer]}
            layerPaperOpacity={LAYER_PAPER_OPACITY[el.layer]}
            scrollProgress={scrollProgress}
            scrollVelocity={scrollVelocity}
            mouse={mouse}
            accentColor={accentColor}
            heroFade={heroFade}
            isTouch={isTouch}
          />
        );
      })}
    </group>
  );
}

/* ── Exported wrapper with Suspense ─────────────────────── */

interface HeroLandscapeProps {
  slug: string;
  accentColor: string;
  scrollProgress: React.RefObject<number>;
  scrollVelocity: React.RefObject<number>;
  mouse: React.RefObject<{ x: number; y: number }>;
}

export default function HeroLandscape(props: HeroLandscapeProps) {
  return (
    <Suspense fallback={null}>
      <LandscapeInner {...props} />
    </Suspense>
  );
}
