'use client';

import { useRef, useEffect, useMemo, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { folder, useControls } from 'leva';
import { Color, Mesh, MathUtils, Vector2, Group, Texture, Points as THREEPoints } from 'three';

import { HERO_SCENES, HERO_SCENES_MOBILE, DEFAULT_HERO, DEFAULT_HERO_MOBILE } from '@/lib/heroAssets';
import { getHeroParams, getPresetParams, getDefaultPreset, PRESET_NAMES, type PresetName } from '@/lib/heroParams';
import '@/components/shaders/WoodcutMaterial';

const IS_DEV = process.env.NODE_ENV !== 'production';

/* ── Hoisted constants ──────────────────────────────────── */
const COLOR_BASE = new Color('#18181b'); // Foreground token — ink
const COLOR_PAPER = new Color('#f9fafb'); // Background token — paper
const COLOR_WATER = new Color('#38aeea'); // Clear blue watercolor bleed
const COLOR_WARM = new Color('#f6c400'); // Golden yellow cursor core
const MOBILE_QUERY = '(max-width: 767px)';
// Pure B&W ink-on-paper: cursor halo and edge wash are disabled, so
// uColorWater/uColorWarm never enter the final color mix.
const WATER_RADIUS = 0.0;
const WASH_INTENSITY = 0.0;
const EDGE_POOL = 0.0;
const GRAIN_AMOUNT = 0.08;
const DISTORTION_STRENGTH = 0.0;
const NOISE_SCALE = 27.0;
const FLOW_SPEED = 0.2;
// Off-screen resting position so smoothstep(1.5, 0.0, distToMouse) → 0
const OFFSCREEN_MOUSE = new Vector2(10, 10);

// Case-study fade window (per-page scroll, not global timeline).
const CASE_STUDY_FADE_START = 0.5;
const CASE_STUDY_FADE_END = 0.9;

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

/* ── HeroPlane — single per-slug plane with liquid line-draw shader ──── */

interface HeroPlaneProps {
  slug: string;
  textureUrl: string;
  skeletonUrl: string | null;
  scrollProgress: React.RefObject<number>;
  isMobile: boolean;
}

function HeroPlane({ slug, textureUrl, skeletonUrl, scrollProgress, isMobile }: HeroPlaneProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const isActive = useRef(true);

  const tex = useTexture(textureUrl) as Texture;
  const skeletonTex = useTexture(skeletonUrl ?? textureUrl) as Texture;
  const hasSkeleton = !!skeletonUrl;

  const mousePos = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));
  const touchMouse = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));
  const touchTarget = useRef(new Vector2(OFFSCREEN_MOUSE.x, OFFSCREEN_MOUSE.y));

  const baseParams = useMemo(() => getHeroParams(slug), [slug]);
  const initialPreset = useMemo(() => getDefaultPreset(slug), [slug]);

  // Dev-only Leva controls — override the per-slug params at runtime so
  // presets can be A/B'd without rebuilding. The preset dropdown swaps
  // multiple controls at once via setLeva. In production the baseParams
  // from heroParams.ts apply unmodified.
  const [levaControls, setLeva] = useControls(
    'case-study hero',
    () => ({
      preset: { value: initialPreset as PresetName, options: PRESET_NAMES },
      drawMode: {
        value: (['sweep', 'soak', 'pool'][baseParams.drawMode] ?? 'soak') as 'sweep' | 'soak' | 'pool',
        options: ['sweep', 'soak', 'pool'] as const,
      },
      drawEnd: { value: baseParams.drawEnd, min: 0.2, max: 0.95, step: 0.01 },
      front: folder({
        frontWidth: { value: baseParams.frontWidth, min: 0.0, max: 0.3, step: 0.005 },
        frontPoolStrength: { value: baseParams.frontPoolStrength, min: 0.0, max: 1.0, step: 0.01 },
        frontFeather: { value: baseParams.frontFeather, min: 0.001, max: 0.15, step: 0.001 },
        drawNoiseScale: { value: baseParams.drawNoiseScale, min: 0.5, max: 12.0, step: 0.1 },
        drawNoiseStrength: { value: baseParams.drawNoiseStrength, min: 0.0, max: 1.5, step: 0.01 },
        noiseStretch: { value: baseParams.noiseStretch, min: 0.05, max: 1.0, step: 0.01 },
      }),
      soak: folder({
        soakContrast: { value: baseParams.soakContrast, min: 0.3, max: 4.0, step: 0.05 },
        soakBias: { value: baseParams.soakBias, min: -0.4, max: 0.4, step: 0.01 },
        soakDetailScale: { value: baseParams.soakDetailScale, min: 2.0, max: 30.0, step: 0.5 },
        soakDetailStrength: { value: baseParams.soakDetailStrength, min: 0.0, max: 0.6, step: 0.01 },
        sweepWeight: { value: baseParams.sweepWeight, min: 0.0, max: 1.0, step: 0.01 },
        activationNoise: { value: baseParams.activationNoise, min: 0.0, max: 1.0, step: 0.01 },
        activationScale: { value: baseParams.activationScale, min: 1.0, max: 16.0, step: 0.1 },
      }),
      sweep: folder({
        directionX: { value: baseParams.drawDirection.x, min: -1.0, max: 1.0, step: 0.05 },
        directionY: { value: baseParams.drawDirection.y, min: -1.0, max: 1.0, step: 0.05 },
      }),
      pool: folder({
        seed0X: { value: baseParams.seedPoint0.x, min: 0.0, max: 1.0, step: 0.02 },
        seed0Y: { value: baseParams.seedPoint0.y, min: 0.0, max: 1.0, step: 0.02 },
        seed1X: { value: baseParams.seedPoint1.x, min: 0.0, max: 1.0, step: 0.02 },
        seed1Y: { value: baseParams.seedPoint1.y, min: 0.0, max: 1.0, step: 0.02 },
      }),
    }),
    [slug],
  );

  // When the preset dropdown changes, swap all dependent controls in one go.
  // Subsequent slider tweaks layer on top of the preset's values.
  const prevPresetRef = useRef<PresetName>(initialPreset);
  useEffect(() => {
    const current = levaControls.preset as PresetName;
    if (current === prevPresetRef.current) return;
    prevPresetRef.current = current;
    const p = getPresetParams(current);
    setLeva({
      drawMode: (['sweep', 'soak', 'pool'] as const)[p.drawMode] ?? 'soak',
      drawEnd: p.drawEnd,
      frontWidth: p.frontWidth,
      frontPoolStrength: p.frontPoolStrength,
      frontFeather: p.frontFeather,
      drawNoiseScale: p.drawNoiseScale,
      drawNoiseStrength: p.drawNoiseStrength,
      noiseStretch: p.noiseStretch,
      soakContrast: p.soakContrast,
      soakBias: p.soakBias,
      soakDetailScale: p.soakDetailScale,
      soakDetailStrength: p.soakDetailStrength,
      sweepWeight: p.sweepWeight,
      activationNoise: p.activationNoise,
      activationScale: p.activationScale,
      directionX: p.drawDirection.x,
      directionY: p.drawDirection.y,
      seed0X: p.seedPoint0.x,
      seed0Y: p.seedPoint0.y,
      seed1X: p.seedPoint1.x,
      seed1Y: p.seedPoint1.y,
    });
  }, [levaControls.preset, setLeva]);

  // Resolve final params: in dev, Leva overrides; in prod, baseParams pass through.
  const drawModeMap: Record<string, 0 | 1 | 2> = { sweep: 0, soak: 1, pool: 2 };
  const params = IS_DEV
    ? {
        ...baseParams,
        drawMode: drawModeMap[levaControls.drawMode] ?? baseParams.drawMode,
        drawDirection: new Vector2(levaControls.directionX, levaControls.directionY),
        seedPoint0: new Vector2(levaControls.seed0X, levaControls.seed0Y),
        seedPoint1: new Vector2(levaControls.seed1X, levaControls.seed1Y),
        frontWidth: levaControls.frontWidth,
        frontPoolStrength: levaControls.frontPoolStrength,
        frontFeather: levaControls.frontFeather,
        drawNoiseScale: levaControls.drawNoiseScale,
        drawNoiseStrength: levaControls.drawNoiseStrength,
        noiseStretch: levaControls.noiseStretch,
        soakContrast: levaControls.soakContrast,
        soakBias: levaControls.soakBias,
        soakDetailScale: levaControls.soakDetailScale,
        soakDetailStrength: levaControls.soakDetailStrength,
        sweepWeight: levaControls.sweepWeight,
        activationNoise: levaControls.activationNoise,
        activationScale: levaControls.activationScale,
        drawEnd: levaControls.drawEnd,
      }
    : baseParams;

  useEffect(() => {
    return () => {
      tex.dispose();
      if (hasSkeleton) skeletonTex.dispose();
    };
  }, [tex, skeletonTex, hasSkeleton]);

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

  useFrame((state) => {
    const progress = scrollProgress.current ?? 0;

    // Choreography: draw → hold → fade.
    // 0.0 → params.drawEnd: draw-in (ink resolves into the per-slug image)
    // params.drawEnd → 0.85: hold (image fully drawn)
    // 0.85 → 1.0: fade out
    const drawProgress = MathUtils.smoothstep(progress, 0.0, params.drawEnd);
    const heroFade = 1 - MathUtils.smoothstep(progress, 0.85, 1.0);
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

    if (!isActive.current) {
      if (materialRef.current) {
        materialRef.current.uMouse.copy(OFFSCREEN_MOUSE);
      }
      if (isMobile) {
        touchMouse.current.copy(OFFSCREEN_MOUSE);
      }
      return;
    }

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime * 0.15;
      materialRef.current.uWind = 0.0;
      materialRef.current.uRadius = WATER_RADIUS;
      materialRef.current.uWashIntensity = WASH_INTENSITY;
      materialRef.current.uEdgePool = EDGE_POOL;
      materialRef.current.uGrainAmount = GRAIN_AMOUNT;
      materialRef.current.uStrength = DISTORTION_STRENGTH;
      materialRef.current.uNoiseScale = NOISE_SCALE;
      materialRef.current.uSpeed = FLOW_SPEED;
      materialRef.current.uScrollProgress = progress;
      materialRef.current.uUseLuminance = 1;
      materialRef.current.uFadeStart = CASE_STUDY_FADE_START;
      materialRef.current.uFadeEnd = CASE_STUDY_FADE_END;
      materialRef.current.uDrawProgress = drawProgress;
      materialRef.current.uDrawMode = params.drawMode;
      materialRef.current.uDrawDirection.copy(params.drawDirection);
      materialRef.current.uSeedPoint0.copy(params.seedPoint0);
      materialRef.current.uSeedPoint1.copy(params.seedPoint1);
      materialRef.current.uHasSkeleton = hasSkeleton ? 1.0 : 0.0;
      materialRef.current.uFrontWidth = params.frontWidth;
      materialRef.current.uFrontPoolStrength = params.frontPoolStrength;
      materialRef.current.uFrontFeather = params.frontFeather;
      materialRef.current.uDrawNoiseScale = params.drawNoiseScale;
      materialRef.current.uDrawNoiseStrength = params.drawNoiseStrength;
      materialRef.current.uSoakContrast = params.soakContrast;
      materialRef.current.uSoakBias = params.soakBias;
      materialRef.current.uSoakDetailScale = params.soakDetailScale;
      materialRef.current.uSoakDetailStrength = params.soakDetailStrength;
      materialRef.current.uSweepWeight = params.sweepWeight;
      materialRef.current.uNoiseStretch = params.noiseStretch;
      materialRef.current.uActivationNoise = params.activationNoise;
      materialRef.current.uActivationScale = params.activationScale;
      if (isMobile) {
        touchMouse.current.lerp(touchTarget.current, 0.1);
        materialRef.current.uMouse.copy(touchMouse.current);
      } else {
        materialRef.current.uMouse.lerp(mousePos.current, 0.1);
      }
    }

    // Desktop: gentle parallax tilt that follows the cursor
    if (!isMobile && meshRef.current) {
      meshRef.current.rotation.y = mousePos.current.x * 0.04;
      meshRef.current.rotation.x = -mousePos.current.y * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[16, 9, 64, 64]} />
        <woodcutShaderMaterial
          ref={materialRef}
          uTexture={tex}
          uSkeletonMap={hasSkeleton ? skeletonTex : null}
          uColorBase={COLOR_BASE}
          uColorPaper={COLOR_PAPER}
          uColorWater={COLOR_WATER}
          uColorWarm={COLOR_WARM}
          uOpacity={1}
          uPaperOpacity={1.0}
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
    </group>
  );
}

/* ── Exported wrapper with Suspense ─────────────────────── */

interface HeroLandscapeProps {
  slug: string;
  scrollProgress: React.RefObject<number>;
}

const SKELETON_BASE = '/assets/graphics/case-study-heroes';
const SKELETON_MAPS: Record<string, string> = {
  // Populated when a soak-mode skeleton has been generated for a slug.
  'mission-bell': `${SKELETON_BASE}/mission-bell-skeleton.webp`,
};

export default function HeroLandscape({ slug, scrollProgress }: HeroLandscapeProps) {
  const isMobile = useIsMobile();
  const textureUrl = isMobile
    ? (HERO_SCENES_MOBILE[slug] ?? HERO_SCENES_MOBILE['new-belgium'] ?? DEFAULT_HERO_MOBILE)
    : (HERO_SCENES[slug] ?? HERO_SCENES['new-belgium'] ?? DEFAULT_HERO);
  const skeletonUrl = SKELETON_MAPS[slug] ?? null;

  return (
    <Suspense fallback={null}>
      <HeroPlane
        slug={slug}
        textureUrl={textureUrl}
        skeletonUrl={skeletonUrl}
        scrollProgress={scrollProgress}
        isMobile={isMobile}
      />
    </Suspense>
  );
}
