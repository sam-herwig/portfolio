/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace, react-hooks/immutability, @next/next/no-img-element */
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useTexture } from '@react-three/drei';
import { useRef, useEffect, Suspense, useMemo, useState } from 'react';
import React from 'react';
import { MotionValue } from 'framer-motion';
import useWebGLSupport from '@/lib/useWebGLSupport';
import { useAppStore } from '@/store/useAppStore';
import {
  Group,
  Mesh,
  Points as THREEPoints,
  Texture,
  Vector2,
  MeshBasicMaterial,
  Color,
  MirroredRepeatWrapping,
  ClampToEdgeWrapping,
  LinearFilter,
  MathUtils,
  PerspectiveCamera,
} from 'three';
import PostProcessingStack from './PostProcessingStack';
import QualityMonitor from './QualityMonitor';
import { useQualityStore, qualityPresets } from '@/lib/quality';
import './shaders/WoodcutMaterial';
import './shaders/SilhouetteSunRakeMaterial';
import './shaders/SumiSkyMaterial';
import './shaders/CampDustMaterial';
import './shaders/DawnSkyMaterial';
import './shaders/DawnSunMaterial';
import './shaders/CloudSeaMaterial';
import './shaders/AlpineHazeMaterial';
import DeepForest from './DeepForest';
import ScrollLinkedSprite from './ScrollLinkedSprite';
import { MODULE_TIMELINE, sceneVisible, sceneOpacity, sceneChildRanges } from '@/lib/moduleTimeline';
import { type HeroParams, type PresetName, getPresetParams } from '@/lib/heroParams';

// ── Scene envelope helper ─────────────────────────────────────────────
// Applies sceneOpacity as a multiplier on all materials in a group,
// preserving each material's base opacity (set on first encounter).
function applyGroupOpacity(group: Group, envelope: number): void {
  group.traverse((child) => {
    const mesh = child as Mesh | THREEPoints;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      // Skip materials that manage their own opacity (e.g. video textures)
      if ((mat as any).__selfManagedOpacity) continue;

      if ('opacity' in mat) {
        // Store base opacity on first visit
        if ((mat as any).__baseOpacity === undefined) {
          (mat as any).__baseOpacity = mat.opacity;
        }
        mat.opacity = (mat as any).__baseOpacity * envelope;
        mat.transparent = true;
      }

      if ('uOpacity' in mat) {
        if ((mat as any).__baseUOpacity === undefined) {
          (mat as any).__baseUOpacity = (mat as any).uOpacity;
        }
        (mat as any).uOpacity = (mat as any).__baseUOpacity * envelope;
        mat.transparent = true;
      }
    }
  });
}

const WoodcutShader = 'woodcutShaderMaterial' as any;
const SilhouetteSunRakeShader = 'silhouetteSunRakeShaderMaterial' as any;
const SumiSkyShader = 'sumiSkyShaderMaterial' as any;
const CampDustShader = 'campDustShaderMaterial' as any;
const DawnSkyShader = 'dawnSkyShaderMaterial' as any;
const CloudSeaShader = 'cloudSeaShaderMaterial' as any;
const AlpineHazeShader = 'alpineHazeShaderMaterial' as any;
const DawnSunShader = 'dawnSunShaderMaterial' as any;
const DEFAULT_WATERCOLOR_WASH = '#38aeea';
const DEFAULT_WATERCOLOR_WARM = '#ffcc00';
declare global {
  namespace JSX {
    interface IntrinsicElements {
      woodcutShaderMaterial: any;
      silhouetteSunRakeShaderMaterial: any;
      sumiSkyShaderMaterial: any;
      campDustShaderMaterial: any;
      dawnSkyShaderMaterial: any;
      dawnSunShaderMaterial: any;
      cloudSeaShaderMaterial: any;
    }
  }
}

// =============================================================================
// UNIFIED CAMERA
// Single camera controller blending all zone behaviours.
// Uses MODULE_TIMELINE boundaries for zone transitions.
// =============================================================================

function UnifiedCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const { camera } = useThree();
  const lerpedProgress = useRef(0);

  useFrame((state, delta) => {
    lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
    const p = lerpedProgress.current;

    const hero = MODULE_TIMELINE.hero;
    const forest = MODULE_TIMELINE.forest;
    const camp = MODULE_TIMELINE.camp;
    const trailFork = MODULE_TIMELINE.trailFork;
    const alpine = MODULE_TIMELINE.alpine;
    const summit = MODULE_TIMELINE.summit;

    // Hero zone: z 20->-28, y 0->4, rotX 0->0.15
    const heroP = Math.min(1, Math.max(0, p / hero.exitEnd));
    const heroX = 0;
    const heroY = MathUtils.lerp(0, 4, heroP);
    const heroZ = MathUtils.lerp(20, -28, heroP);
    const heroRX = MathUtils.lerp(0, 0.15, heroP);

    // Forest zone: z -28->-90 (starts where hero ends), no bob — held steady, rotX=0.1
    const forestSpan = forest.ownEnd - forest.ownStart;
    const forestP = Math.min(1, Math.max(0, (p - forest.ownStart) / forestSpan));
    const forestX = 0;
    const forestY = 0;
    const forestZ = MathUtils.lerp(-28, -90, forestP);
    const forestRX = 0.1;

    // Camp zone: sway on X (clock), y -10->15, z 30->-10
    const campSpan = camp.ownEnd - camp.ownStart;
    const campP = Math.min(1, Math.max(0, (p - camp.ownStart) / campSpan));
    const campX = Math.sin(state.clock.elapsedTime * 0.5) * 1.5;
    const campY = MathUtils.lerp(-10, 15, campP);
    const campZ = MathUtils.lerp(30, -10, campP);
    const campRX = 0;

    // Trail Fork zone: pause camera at eye-level so the trail-fork backdrop
    // plane fills the view. Camp → TrailFork dives down from above-treeline;
    // TrailFork → Alpine continues the descent into the alpine valley.
    const trailForkX = 0;
    const trailForkY = 0;
    const trailForkZ = 8;
    const trailForkRX = 0;

    // Alpine zone: z=15 fixed, y -60->120 (start below lowest cliff so cliffs rise from below), climb sway, rotX=0.15
    const alpineSpan = alpine.ownEnd - alpine.ownStart;
    const alpineP = Math.min(1, Math.max(0, (p - alpine.ownStart) / alpineSpan));
    const alpineX = Math.sin(alpineP * Math.PI * 6) * 1.5;
    const alpineY = MathUtils.lerp(-60, 120, alpineP);
    const alpineZ = 15;
    const alpineRX = 0.15;

    // Summit zone: "step onto the ledge" — inherits alpine end-pose so there
    // is no handoff jump, then strides forward and tilts down so the cliff
    // foreground reveals as the camera crests the ridge.
    const summitSpan = summit.ownEnd - summit.ownStart;
    const summitP = Math.min(1, Math.max(0, (p - summit.ownStart) / summitSpan));
    const summitX = 0;
    const summitY = MathUtils.lerp(120, 128, summitP);
    const summitZ = MathUtils.lerp(15, 2, summitP);
    const summitRX = MathUtils.lerp(0.15, -0.18, summitP);

    // Blend weights using contract boundaries
    const blendWidth = 0.06; // transition width between zones

    const hw = Math.max(0, p < hero.ownEnd ? 1.0 : 1.0 - (p - hero.ownEnd) / blendWidth);
    const fw = Math.max(
      0,
      Math.min(
        1,
        p < forest.ownStart
          ? 0
          : p < forest.enterEnd
            ? (p - forest.ownStart) / (forest.enterEnd - forest.ownStart)
            : p < forest.exitStart
              ? 1
              : 1 - (p - forest.exitStart) / (forest.ownEnd - forest.exitStart),
      ),
    );
    const cw = Math.max(
      0,
      Math.min(
        1,
        p < camp.ownStart
          ? 0
          : p < camp.enterEnd
            ? (p - camp.ownStart) / (camp.enterEnd - camp.ownStart)
            : p < camp.exitStart
              ? 1
              : 1 - (p - camp.exitStart) / (camp.ownEnd - camp.exitStart),
      ),
    );
    const tw = Math.max(
      0,
      Math.min(
        1,
        p < trailFork.ownStart
          ? 0
          : p < trailFork.enterEnd
            ? (p - trailFork.ownStart) / (trailFork.enterEnd - trailFork.ownStart)
            : p < trailFork.exitStart
              ? 1
              : 1 - (p - trailFork.exitStart) / (trailFork.ownEnd - trailFork.exitStart),
      ),
    );
    const aw = Math.max(
      0,
      Math.min(
        1,
        p < alpine.ownStart
          ? 0
          : p < alpine.enterEnd
            ? (p - alpine.ownStart) / (alpine.enterEnd - alpine.ownStart)
            : p < alpine.exitStart
              ? 1
              : 1 - (p - alpine.exitStart) / (alpine.ownEnd - alpine.exitStart),
      ),
    );
    // Summit ramps in across alpine.exitStart → summit.ownStart so the camera
    // weight crossfades smoothly with alpine. The summit start-pose is set to
    // alpine's end-pose, so the pre-summit overlap blends two equal poses.
    const sw = Math.max(
      0,
      Math.min(1, p < alpine.exitStart ? 0 : (p - alpine.exitStart) / (summit.ownStart - alpine.exitStart)),
    );

    const tot = hw + fw + cw + tw + aw + sw || 1;
    const inv = 1 / tot;

    camera.position.x = (heroX * hw + forestX * fw + campX * cw + trailForkX * tw + alpineX * aw + summitX * sw) * inv;
    camera.position.y = (heroY * hw + forestY * fw + campY * cw + trailForkY * tw + alpineY * aw + summitY * sw) * inv;
    camera.position.z = (heroZ * hw + forestZ * fw + campZ * cw + trailForkZ * tw + alpineZ * aw + summitZ * sw) * inv;
    camera.rotation.x =
      (heroRX * hw + forestRX * fw + campRX * cw + trailForkRX * tw + alpineRX * aw + summitRX * sw) * inv;
  });

  return null;
}

// =============================================================================
// UNIFIED POST PROCESSING
// Single PostProcessingStack — bloom driven by camp zone via contract.
// =============================================================================

function UnifiedPostProcessing({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  // Throttled setState: only fires ~10-15 times during a scroll through camp,
  // not every frame. Acceptable per r3f perf guidance.
  const [bloomIntensity, setBloomIntensity] = useState(0);
  const lerpedP = useRef(0);
  const lerpedBloom = useRef(0);
  const lastSnap = useRef(0);

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const campOpacity = sceneOpacity('camp', p);
    const targetBloom = campOpacity > 0.05 ? 1.2 : 0;
    lerpedBloom.current = MathUtils.damp(lerpedBloom.current, targetBloom, 3, delta);
    if (Math.abs(lerpedBloom.current - lastSnap.current) > 0.1) {
      lastSnap.current = lerpedBloom.current;
      setBloomIntensity(lerpedBloom.current);
    }
  });

  return <PostProcessingStack bloomIntensity={bloomIntensity} disableDepthOfField disableChromaticAberration />;
}

// =============================================================================
// HERO SCENE GROUP
// =============================================================================

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
  uRadius = 0.2,
  uStrength = 0.05,
  uNoiseScale = 50.0,
  uSpeed = 0.5,
  uWashIntensity = 0.45,
  uEdgePool = 0.35,
  uGrainAmount = 0.08,
  uColorWater = DEFAULT_WATERCOLOR_WASH,
  uColorWarm = DEFAULT_WATERCOLOR_WARM,
  scrollProgress,
  drawParams,
  drawProgressRef,
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
  uRadius?: number;
  uStrength?: number;
  uNoiseScale?: number;
  uSpeed?: number;
  uWashIntensity?: number;
  uEdgePool?: number;
  uGrainAmount?: number;
  uColorWater?: string;
  uColorWarm?: string;
  scrollProgress: MotionValue<number>;
  // Liquid line-draw params (optional). When provided, the layer animates its
  // ink in via the soak shader using drawProgressRef as the 0..1 driver.
  drawParams?: HeroParams;
  drawProgressRef?: React.MutableRefObject<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const waterColor = useMemo(() => new Color(uColorWater), [uColorWater]);
  const warmColor = useMemo(() => new Color(uColorWarm), [uColorWarm]);
  const materialRef = useRef<any>(null);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame((state, delta) => {
    if (isActive && !isActive.current) return;

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uWind = 0;
      materialRef.current.uRadius = uRadius;
      materialRef.current.uStrength = uStrength;
      materialRef.current.uNoiseScale = uNoiseScale;
      materialRef.current.uSpeed = uSpeed;
      materialRef.current.uWashIntensity = uWashIntensity;
      materialRef.current.uEdgePool = uEdgePool;
      materialRef.current.uGrainAmount = uGrainAmount;
      materialRef.current.uScrollProgress = scrollProgress.get();
      materialRef.current.uUseLuminance = 0;
      materialRef.current.uColorWater.set(uColorWater);
      materialRef.current.uColorWarm.set(uColorWarm);

      // Liquid line-draw uniforms — only active when drawParams is provided.
      // Without drawParams the shader's defaults (uDrawProgress=1) leave the
      // layer fully drawn at all times, preserving prior behavior.
      if (drawParams && drawProgressRef) {
        materialRef.current.uDrawProgress = drawProgressRef.current;
        materialRef.current.uDrawMode = drawParams.drawMode;
        materialRef.current.uDrawDirection.copy(drawParams.drawDirection);
        materialRef.current.uSeedPoint0.copy(drawParams.seedPoint0);
        materialRef.current.uSeedPoint1.copy(drawParams.seedPoint1);
        materialRef.current.uHasSkeleton = 0.0;
        materialRef.current.uFrontWidth = drawParams.frontWidth;
        materialRef.current.uFrontPoolStrength = drawParams.frontPoolStrength;
        materialRef.current.uFrontFeather = drawParams.frontFeather;
        materialRef.current.uDrawNoiseScale = drawParams.drawNoiseScale;
        materialRef.current.uDrawNoiseStrength = drawParams.drawNoiseStrength;
        materialRef.current.uNoiseStretch = drawParams.noiseStretch;
        materialRef.current.uSoakContrast = drawParams.soakContrast;
        materialRef.current.uSoakBias = drawParams.soakBias;
        materialRef.current.uSoakDetailScale = drawParams.soakDetailScale;
        materialRef.current.uSoakDetailStrength = drawParams.soakDetailStrength;
        materialRef.current.uSweepWeight = drawParams.sweepWeight;
        materialRef.current.uActivationNoise = drawParams.activationNoise;
        materialRef.current.uActivationScale = drawParams.activationScale;
      }

      if (isMobile) {
        touchMouse.current.lerp(touchTarget.current, 0.1);
        materialRef.current.uMouse.copy(touchMouse.current);
      } else {
        materialRef.current.uMouse.lerp(mousePos.current, 0.1);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[scale[0], scale[1], 64, 64]} />
      <WoodcutShader
        ref={materialRef}
        transparent
        depthWrite={false}
        uTexture={tex}
        uColorWater={waterColor}
        uColorWarm={warmColor}
        uPaperOpacity={uPaperOpacity}
        uRadius={uRadius}
        uStrength={uStrength}
        uNoiseScale={uNoiseScale}
        uSpeed={uSpeed}
        uWashIntensity={uWashIntensity}
        uEdgePool={uEdgePool}
        uGrainAmount={uGrainAmount}
        uUseLuminance={0}
      />
    </mesh>
  );
}

// Home hero layered diorama: each layer draws in on a staggered time window
// after the page mounts, back-to-front. Uses the liquid line-draw shader
// path with per-layer presets matched to the layer's role in the scene.
type HomeHeroLayer = {
  key: string;
  url: string;
  preset: PresetName;
  // [start, end] expressed as hero-local scroll progress (0..1 across the
  // hero zone). Layers stagger back-to-front so the painting reveals as the
  // user scrolls. The hero canvas is already pinned (fixed background), so
  // scrolling through the hero zone literally draws the painting in.
  scrollWindow: [number, number];
  // Position + scale relative to the existing mountains/forest composition
  // (Leva-tunable defaults; tweak in dev to taste)
  position: [number, number, number];
  scale: [number, number];
};

// Draw order is closest-first → farthest-last. The framing tree commits
// first, then the near-bank, the forest, the mist, and finally the distant
// mountains "appear" to complete the painting. Array order remains
// back-to-front (z-position) for readability; the scrollWindow values drive
// reveal sequence, not the array order.
const HOME_HERO_LAYERS: readonly HomeHeroLayer[] = [
  // Mountains arrive last — the distant peaks that close the composition.
  {
    key: 'mountains',
    url: '/home-hero/02-mountains.webp',
    preset: 'Pure Soak',
    scrollWindow: [0.55, 0.72],
    position: [-8.0, 28.5, -92],
    scale: [207, 80],
  },
  // Mist precedes the mountains, bleeding outward to settle the haze.
  {
    key: 'mist',
    url: '/home-hero/05-mist.webp',
    preset: 'Pure Soak',
    scrollWindow: [0.42, 0.58],
    position: [0.0, 4.0, -85],
    scale: [180, 60],
  },
  // Forest mid-ground — the artist commits the treeline diagonally.
  {
    key: 'forest',
    url: '/home-hero/04-forest.webp',
    preset: 'Diagonal Brush',
    scrollWindow: [0.28, 0.44],
    position: [0.0, -12.5, -70],
    scale: [150, 40],
  },
  // Near-bank — closest element, draws first to anchor the foreground.
  {
    key: 'near-bank',
    url: '/home-hero/06-near-bank.webp',
    preset: 'Pop-Around',
    scrollWindow: [0.0, 0.16],
    position: [0.0, -22.0, -30],
    scale: [80, 28],
  },
] as const;

function HeroSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(true);

  const mousePos = useRef(new Vector2(0, 0));
  const touchMouse = useRef(new Vector2(10, 10));
  const touchTarget = useRef(new Vector2(10, 10));
  const [isMobile, setIsMobile] = useState(false);

  // Per-layer scroll-based draw progress. Each layer has its own scrollWindow
  // (HOME_HERO_LAYERS[i].scrollWindow) and is driven by hero-local scroll
  // progress (0..1 across the hero zone). The painting reveals as the user
  // scrolls down the pinned hero.
  const drawProgressMountains = useRef(0);
  const drawProgressMist = useRef(0);
  const drawProgressForest = useRef(0);
  const drawProgressNearBank = useRef(0);

  const drawParamsByKey = useMemo(
    () =>
      Object.fromEntries(HOME_HERO_LAYERS.map((l) => [l.key, getPresetParams(l.preset)])) as Record<string, HeroParams>,
    [],
  );

  const composition = useControls(
    'Home Hero',
    {
      mountains: folder({
        mX: { value: -8.0, min: -80, max: 80, step: 0.5 },
        mY: { value: 28.5, min: -20, max: 40, step: 0.5 },
        mZ: { value: -92, min: -200, max: -20, step: 1 },
        mW: { value: 207, min: 40, max: 400, step: 1 },
        mH: { value: 80, min: 10, max: 120, step: 1 },
      }),
      forest: folder({
        fX: { value: 0.0, min: -80, max: 80, step: 0.5 },
        fY: { value: -12.5, min: -40, max: 40, step: 0.5 },
        fZ: { value: -70, min: -200, max: -20, step: 1 },
        fW: { value: 150, min: 40, max: 400, step: 1 },
        fH: { value: 40, min: 10, max: 120, step: 1 },
      }),
    },
    { collapsed: false },
  );

  // SSR-safe mobile detection, matches Tailwind md: breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  // Desktop: ambient mousemove drives cursor. Mobile is scroll-driven in useFrame.
  useEffect(() => {
    if (isMobile) return;

    const onMouse = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => window.removeEventListener('mousemove', onMouse);
  }, [isMobile]);

  const drawProgressByKey: Record<string, React.MutableRefObject<number>> = {
    mountains: drawProgressMountains,
    mist: drawProgressMist,
    forest: drawProgressForest,
    'near-bank': drawProgressNearBank,
  };

  useFrame((_, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);

    // Hero-local scroll progress (0..1 across the pinned hero zone). Each
    // layer's scrollWindow maps a slice of this to its own draw progress so
    // the painting reveals back-to-front as the user scrolls.
    const heroWindow = MODULE_TIMELINE.hero;
    const heroP = MathUtils.clamp(
      (lerpedP.current - heroWindow.ownStart) / (heroWindow.ownEnd - heroWindow.ownStart),
      0,
      1,
    );
    for (const layer of HOME_HERO_LAYERS) {
      const [start, end] = layer.scrollWindow;
      const ref = drawProgressByKey[layer.key];
      if (ref) ref.current = MathUtils.smoothstep(heroP, start, end);
    }

    if (isMobile) {
      const heroWindow = MODULE_TIMELINE.hero;
      const heroP = MathUtils.clamp(
        (lerpedP.current - heroWindow.ownStart) / (heroWindow.ownEnd - heroWindow.ownStart),
        0,
        1,
      );
      const x = MathUtils.lerp(-0.55, 0.55, heroP) + Math.sin(heroP * Math.PI * 2) * 0.1;
      const y = MathUtils.lerp(0.55, -0.45, heroP);
      touchTarget.current.set(x, y);
    }

    if (groupRef.current) {
      const opacity = sceneOpacity('hero', lerpedP.current);
      isActive.current = opacity > 0;
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  // Resolve final position/scale per layer — mountains and forest still
  // honor Leva tuning; the new layers use their HOME_HERO_LAYERS defaults.
  const layerOverrides: Record<string, { position: [number, number, number]; scale: [number, number] }> = {
    mountains: {
      position: [composition.mX, composition.mY, composition.mZ],
      scale: [composition.mW, composition.mH],
    },
    forest: {
      position: [composition.fX, composition.fY, composition.fZ],
      scale: [composition.fW, composition.fH],
    },
  };

  return (
    <group ref={groupRef}>
      {/* Solid Paper Background */}
      <mesh position={[0, 0, -100]}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial color="#f9fafb" />
      </mesh>
      {HOME_HERO_LAYERS.map((layer) => {
        const override = layerOverrides[layer.key];
        const position = override?.position ?? layer.position;
        const scale = override?.scale ?? layer.scale;
        return (
          <Hero3DLayer
            key={layer.key}
            textureUrl={layer.url}
            position={position}
            scale={scale}
            uPaperOpacity={0}
            isActive={isActive}
            mousePos={mousePos}
            touchMouse={touchMouse}
            touchTarget={touchTarget}
            isMobile={isMobile}
            uWashIntensity={0}
            uEdgePool={0}
            uGrainAmount={0}
            scrollProgress={scrollProgress}
            drawParams={drawParamsByKey[layer.key]}
            drawProgressRef={drawProgressByKey[layer.key]}
          />
        );
      })}
    </group>
  );
}

// =============================================================================
// FOREST SCENE GROUP
// =============================================================================

const FOREST_PRESET_DEFAULT = 'Ink-Wash Grove';

// Launch presets for the simplified Forest stack. The old shaft, mote,
// floor, and fog-card controls remain present for debugging, but presets
// keep them explicitly off so switching looks cannot revive the trippy
// pre-launch composition.
const DISABLED_FOREST_EFFECTS = {
  shaftEnabled: false,
  motesEnabled: false,
  floorMistDensity: 0,
  fogCardOpacity: 0,
  shaftColor: '#ffffff',
  shaftIntensity: 0,
  shaftBrushScale: 3,
  shaftBrushSpeed: 0,
  shaftSplotchAmount: 0,
  shaftBleedStrength: 0,
  shaftBreathRate: 0,
  shaftBreathAmplitude: 0,
  shaftX: 0,
  shaftCenterY: -1,
  shaftZ: -100,
  shaftHeight: 32,
  shaftRadiusTop: 0.6,
  shaftRadiusBottom: 5,
  motesColor: '#ffffff',
  motesIntensity: 0,
  motesScale: 120,
  motesThreshold: 0.99,
  motesSoftness: 0.25,
  motesDriftSpeed: 0,
  motesOffset: 10,
  motesWidth: 24,
  motesHeight: 14,
} as const;

const FOREST_PRESETS = {
  'Pale Trailhead': {
    ...DISABLED_FOREST_EFFECTS,
    stagEnabled: true,
    canopyFarEnabled: true,
    treeOpacity: 0.9,
    treeWashIntensity: 0.35,
    canopyFarOpacity: 0.52,
    mistDensityOverride: 0.32,
    mistCoolColor: '#a8bacb',
    mistShadowColor: '#425160',
    treeInkColor: '#344352',
    backdropTintColor: '#496175',
    backdropX: 0,
    backdropY: 24,
    backdropZ: -520,
    backdropScale: 1120,
  },
  'Arctic Clearing': {
    ...DISABLED_FOREST_EFFECTS,
    stagEnabled: true,
    canopyFarEnabled: true,
    treeOpacity: 0.92,
    treeWashIntensity: 0.55,
    canopyFarOpacity: 0.46,
    mistDensityOverride: 0.28,
    mistCoolColor: '#c7e7ef',
    mistShadowColor: '#315467',
    treeInkColor: '#183746',
    backdropTintColor: '#376675',
    backdropX: -80,
    backdropY: 14,
    backdropZ: -560,
    backdropScale: 980,
  },
  'Lichen Signal': {
    ...DISABLED_FOREST_EFFECTS,
    stagEnabled: true,
    canopyFarEnabled: true,
    treeOpacity: 0.96,
    treeWashIntensity: 0.85,
    canopyFarOpacity: 0.52,
    mistDensityOverride: 0.46,
    mistCoolColor: '#8fc7a1',
    mistShadowColor: '#183325',
    treeInkColor: '#10241a',
    backdropTintColor: '#1f4a34',
    backdropX: 50,
    backdropY: 28,
    backdropZ: -500,
    backdropScale: 1200,
  },
  'Blue-Hour Passage': {
    ...DISABLED_FOREST_EFFECTS,
    stagEnabled: true,
    canopyFarEnabled: true,
    treeOpacity: 0.86,
    treeWashIntensity: 1.2,
    canopyFarOpacity: 0.58,
    mistDensityOverride: 0.68,
    mistCoolColor: '#667894',
    mistShadowColor: '#171f2d',
    treeInkColor: '#202b37',
    backdropTintColor: '#253449',
    backdropX: -70,
    backdropY: 20,
    backdropZ: -540,
    backdropScale: 1180,
  },
  'Plum Distance': {
    ...DISABLED_FOREST_EFFECTS,
    stagEnabled: true,
    canopyFarEnabled: true,
    treeOpacity: 0.88,
    treeWashIntensity: 1.35,
    canopyFarOpacity: 0.54,
    mistDensityOverride: 0.72,
    mistCoolColor: '#8b7ab8',
    mistShadowColor: '#19152d',
    treeInkColor: '#171826',
    backdropTintColor: '#2a2548',
    backdropX: 70,
    backdropY: 18,
    backdropZ: -520,
    backdropScale: 1100,
  },
  'Ink-Wash Grove': {
    ...DISABLED_FOREST_EFFECTS,
    stagEnabled: true,
    canopyFarEnabled: true,
    treeOpacity: 0.96,
    treeWashIntensity: 2.0,
    canopyFarOpacity: 0.5,
    mistDensityOverride: 0.5,
    mistCoolColor: '#c7cbca',
    mistShadowColor: '#2a2d31',
    treeInkColor: '#101418',
    backdropTintColor: '#202327',
    backdropX: 0,
    backdropY: 34,
    backdropZ: -580,
    backdropScale: 1240,
  },
} as const;

type ForestPresetName = keyof typeof FOREST_PRESETS;

function ForestSceneGroup({
  scrollProgress,
  scrollVelocity,
}: {
  scrollProgress: MotionValue<number>;
  scrollVelocity: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);

  const defaultForestPreset = FOREST_PRESETS[FOREST_PRESET_DEFAULT];
  const [controls, setForestControls] = useControls(
    'Home Forest',
    () => ({
      'scene · visibility': folder(
        {
          shaftEnabled: { label: 'shaft', value: defaultForestPreset.shaftEnabled },
          motesEnabled: { label: 'motes', value: defaultForestPreset.motesEnabled },
          stagEnabled: { label: 'stag', value: defaultForestPreset.stagEnabled },
          canopyFarEnabled: { label: 'backdrop', value: defaultForestPreset.canopyFarEnabled },
        },
        { collapsed: false },
      ),
      'scene · global': folder(
        {
          treeOpacity: { label: 'tree opacity', value: defaultForestPreset.treeOpacity, min: 0, max: 1, step: 0.01 },
          treeWashIntensity: {
            label: 'tree wash mul',
            value: defaultForestPreset.treeWashIntensity,
            min: 0,
            max: 2.5,
            step: 0.02,
          },
          canopyFarOpacity: {
            label: 'backdrop opacity',
            value: defaultForestPreset.canopyFarOpacity,
            min: 0,
            max: 1,
            step: 0.01,
          },
          mistDensityOverride: {
            label: 'mist override (-1 = auto)',
            value: defaultForestPreset.mistDensityOverride,
            min: -1,
            max: 1,
            step: 0.01,
          },
          floorMistDensity: {
            label: 'floor mist density',
            value: defaultForestPreset.floorMistDensity,
            min: 0,
            max: 1.2,
            step: 0.01,
          },
          fogCardOpacity: {
            label: 'fog card opacity',
            value: defaultForestPreset.fogCardOpacity,
            min: 0,
            max: 3.5,
            step: 0.05,
          },
        },
        { collapsed: false },
      ),
      'scene · color': folder(
        {
          mistCoolColor: { value: defaultForestPreset.mistCoolColor, label: 'mist cool' },
          mistShadowColor: { value: defaultForestPreset.mistShadowColor, label: 'mist shadow' },
          treeInkColor: { value: defaultForestPreset.treeInkColor, label: 'tree ink' },
          backdropTintColor: { value: defaultForestPreset.backdropTintColor, label: 'backdrop tint' },
        },
        { collapsed: true },
      ),
      'scene · backdrop': folder(
        {
          backdropX: { label: 'x', value: defaultForestPreset.backdropX, min: -120, max: 120, step: 1 },
          backdropY: { label: 'y', value: defaultForestPreset.backdropY, min: -60, max: 40, step: 0.5 },
          backdropZ: { label: 'z', value: defaultForestPreset.backdropZ, min: -800, max: -80, step: 5 },
          backdropScale: { label: 'scale', value: defaultForestPreset.backdropScale, min: 140, max: 1500, step: 5 },
        },
        { collapsed: true },
      ),
      shaft: folder(
        {
          shaftColor: { value: defaultForestPreset.shaftColor, label: 'shaft color' },
          shaftIntensity: {
            label: 'intensity',
            value: defaultForestPreset.shaftIntensity,
            min: 0,
            max: 2.5,
            step: 0.02,
          },
          shaftBrushScale: {
            label: 'brush scale',
            value: defaultForestPreset.shaftBrushScale,
            min: 1,
            max: 12,
            step: 0.1,
          },
          shaftBrushSpeed: {
            label: 'brush speed',
            value: defaultForestPreset.shaftBrushSpeed,
            min: 0,
            max: 0.6,
            step: 0.005,
          },
          shaftSplotchAmount: {
            label: 'splotch amount',
            value: defaultForestPreset.shaftSplotchAmount,
            min: 0,
            max: 1,
            step: 0.01,
          },
          shaftBleedStrength: {
            label: 'base bleed',
            value: defaultForestPreset.shaftBleedStrength,
            min: 0,
            max: 3,
            step: 0.05,
          },
          shaftBreathRate: {
            label: 'breath rate',
            value: defaultForestPreset.shaftBreathRate,
            min: 0,
            max: 2,
            step: 0.01,
          },
          shaftBreathAmplitude: {
            label: 'breath amount',
            value: defaultForestPreset.shaftBreathAmplitude,
            min: 0,
            max: 0.5,
            step: 0.01,
          },
        },
        { collapsed: true },
      ),
      'shaft · placement': folder(
        {
          shaftX: { label: 'x', value: defaultForestPreset.shaftX, min: -40, max: 40, step: 0.5 },
          shaftCenterY: { label: 'center y', value: defaultForestPreset.shaftCenterY, min: -20, max: 10, step: 0.25 },
          shaftZ: { label: 'z', value: defaultForestPreset.shaftZ, min: -160, max: -30, step: 1 },
          shaftHeight: { label: 'height', value: defaultForestPreset.shaftHeight, min: 10, max: 80, step: 0.5 },
          shaftRadiusTop: {
            label: 'radius top',
            value: defaultForestPreset.shaftRadiusTop,
            min: 0.2,
            max: 12,
            step: 0.1,
          },
          shaftRadiusBottom: {
            label: 'radius bottom',
            value: defaultForestPreset.shaftRadiusBottom,
            min: 1,
            max: 40,
            step: 0.25,
          },
        },
        { collapsed: true },
      ),
      motes: folder(
        {
          motesColor: { value: defaultForestPreset.motesColor, label: 'motes color' },
          motesIntensity: { label: 'intensity', value: defaultForestPreset.motesIntensity, min: 0, max: 2, step: 0.02 },
          motesScale: { label: 'cell scale', value: defaultForestPreset.motesScale, min: 20, max: 240, step: 1 },
          motesThreshold: {
            label: 'sparsity',
            value: defaultForestPreset.motesThreshold,
            min: 0.7,
            max: 0.999,
            step: 0.001,
          },
          motesSoftness: {
            label: 'fleck softness',
            value: defaultForestPreset.motesSoftness,
            min: 0.05,
            max: 0.5,
            step: 0.005,
          },
          motesDriftSpeed: {
            label: 'drift speed',
            value: defaultForestPreset.motesDriftSpeed,
            min: 0,
            max: 0.1,
            step: 0.001,
          },
          motesOffset: { label: 'camera offset', value: defaultForestPreset.motesOffset, min: 2, max: 20, step: 0.25 },
          motesWidth: { label: 'plane width', value: defaultForestPreset.motesWidth, min: 6, max: 60, step: 0.5 },
          motesHeight: { label: 'plane height', value: defaultForestPreset.motesHeight, min: 4, max: 40, step: 0.5 },
        },
        { collapsed: true },
      ),
    }),
    { collapsed: true },
  );

  useControls('Home Forest Presets', {
    preset: {
      options: Object.keys(FOREST_PRESETS),
      value: FOREST_PRESET_DEFAULT,
      onChange: (value: string) => {
        const preset = FOREST_PRESETS[value as ForestPresetName];
        if (preset) setForestControls(preset);
      },
    },
  });

  useFrame((_state, delta) => {
    if (groupRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const opacity = sceneOpacity('forest', lerpedP.current);
      groupRef.current.visible = opacity > 0;

      if (groupRef.current.visible) {
        applyGroupOpacity(groupRef.current, opacity);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <DeepForest scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} controls={controls} />
    </group>
  );
}

// =============================================================================
// CAMP SCENE GROUP
// =============================================================================

function SumiSky({
  isActive,
  campProgress,
  lutTexture,
  controls,
}: {
  isActive: React.MutableRefObject<boolean>;
  campProgress: React.MutableRefObject<number>;
  lutTexture: Texture;
  controls: any;
}) {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (!isActive.current) return;
    const m = matRef.current;
    if (!m) return;
    m.uTime = state.clock.elapsedTime;
    m.uColorHorizon.set(controls.horizonColor);
    m.uColorZenith.set(controls.zenithColor);
    m.uColorDust.set(controls.bandDustColor);
    m.uColorStar.set(controls.starColor);
    m.uColorStarCool.set(controls.starColorCool);
    m.uColorStarWarm.set(controls.starColorWarm);
    m.uBandAngle = (controls.bandAngleDeg * Math.PI) / 180;
    m.uBandWidth = controls.bandWidth;
    m.uMilkyStrength = controls.bandIntensity;
    m.uCoreWidth = controls.coreWidth;
    m.uColorStrength = controls.colorStrength;
    m.uDustLaneStrength = controls.dustLaneStrength;
    m.uAnimationSpeed = controls.driftSpeed;
    m.uStarDensity = controls.starDensity;
    m.uStarGrid = controls.starGrid;
    m.uStarFalloff = controls.starFalloff;
    m.uStarSizeBase = controls.starSizeBase;
    m.uStarSizeRange = controls.starSizeRange;
    m.uStarTwinkle = controls.twinkle;
    m.uStarTrim = controls.starTrim;
    m.uCoolMix = controls.coolMix;
    m.uWarmMix = controls.warmMix;
    m.uHeroThreshold = controls.heroThreshold;
    m.uHeroHalo = controls.heroHalo;
    m.uHeroHaloRadius = controls.heroHaloRadius;
    m.uHeroBoost = controls.heroBoost;
    m.uHorizonFadeStart = controls.horizonFadeStart;
    m.uHorizonFadeEnd = controls.horizonFadeEnd;
    m.uHazeAltitude = controls.hazeAltitude;
    m.uHazeStrength = controls.hazeStrength;
    m.uGrainAmount = controls.grain;
    m.uScrollFloor = controls.scrollFloor;
    m.uScrollProgress = campProgress.current;
  });

  return (
    <mesh position={[0, 30, -260]} renderOrder={-20} frustumCulled={false}>
      <planeGeometry args={[1000, 500]} />
      <SumiSkyShader ref={matRef} uLUT={lutTexture} transparent={false} depthWrite={false} />
    </mesh>
  );
}

function CampDustPlane({
  isActive,
  campProgress,
  controls,
}: {
  isActive: React.MutableRefObject<boolean>;
  campProgress: React.MutableRefObject<number>;
  controls: any;
}) {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (!isActive.current) return;
    const m = matRef.current;
    if (!m) return;
    m.uTime = state.clock.elapsedTime;
    m.uColorDust.set(controls.fgDustColor);
    m.uIntensity = controls.dustIntensity;
    m.uAlphaCap = controls.dustAlphaCap;
    m.uAnisotropyY = controls.dustAnisotropy;
    m.uDriftSpeed = controls.dustDriftSpeed;
    m.uThresholdLo = controls.dustThresholdLo;
    m.uThresholdHi = controls.dustThresholdHi;
    m.uAltitudeLo = controls.dustAltitudeLo;
    m.uAltitudeHi = controls.dustAltitudeHi;
    m.uScrollFloor = controls.scrollFloor;
    m.uScrollProgress = campProgress.current;
  });

  return (
    <mesh position={[0, 18, -80]} renderOrder={-15} frustumCulled={false}>
      <planeGeometry args={[300, 200]} />
      <CampDustShader ref={matRef} transparent depthWrite={false} />
    </mesh>
  );
}

function CampBillboard({
  url,
  position,
  scale,
  opacity = 1,
  depthWrite = true,
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
  depthWrite?: boolean;
}) {
  const tex = useTexture(url);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite,
        opacity,
      }),
    [tex, opacity, depthWrite],
  );

  return (
    <mesh position={position} material={material} frustumCulled={false}>
      <planeGeometry args={scale} />
    </mesh>
  );
}

function CampSceneGroup({
  scrollProgress,
  scrollVelocity,
}: {
  scrollProgress: MotionValue<number>;
  scrollVelocity: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(false);
  const campProgress = useRef(0);

  const skyLUT = useTexture('/camp/sumi-sky-lut.png');
  useEffect(() => {
    skyLUT.minFilter = LinearFilter;
    skyLUT.magFilter = LinearFilter;
    skyLUT.wrapS = ClampToEdgeWrapping;
    skyLUT.wrapT = ClampToEdgeWrapping;
    skyLUT.generateMipmaps = false;
    skyLUT.needsUpdate = true;
  }, [skyLUT]);

  const controls = useControls(
    'Home Camp',
    {
      'sky · gradient': folder(
        {
          horizonColor: { value: '#01030a', label: 'horizon color' },
          zenithColor: { value: '#061126', label: 'zenith color' },
          hazeAltitude: { label: 'haze altitude', value: 0.3, min: 0, max: 0.6, step: 0.01 },
          hazeStrength: { label: 'haze strength', value: 0.15, min: 0, max: 0.5, step: 0.01 },
        },
        { collapsed: true },
      ),
      'sky · band': folder(
        {
          bandIntensity: { label: 'band intensity', value: 0.55, min: 0, max: 1.5, step: 0.01 },
          bandAngleDeg: { label: 'band angle (deg)', value: -15, min: -45, max: 45, step: 0.5 },
          bandWidth: { label: 'band width', value: 1.9, min: 0.8, max: 3.5, step: 0.05 },
          coreWidth: { label: 'core width', value: 0.14, min: 0, max: 0.4, step: 0.005 },
          colorStrength: { label: 'color saturation', value: 0.32, min: 0, max: 1, step: 0.01 },
          dustLaneStrength: { label: 'dust lane depth', value: 0.72, min: 0, max: 1.5, step: 0.01 },
          bandDustColor: { value: '#050818', label: 'dust ink color' },
          driftSpeed: { label: 'drift speed', value: 0.06, min: 0, max: 0.3, step: 0.005 },
        },
        { collapsed: false },
      ),
      'sky · stars': folder(
        {
          starDensity: { label: 'star sparsity', value: 0.995, min: 0.95, max: 0.999, step: 0.0005 },
          starGrid: { label: 'star grid', value: 420, min: 200, max: 1200, step: 10 },
          starFalloff: { label: 'brightness power', value: 8.0, min: 2, max: 16, step: 0.25 },
          starSizeBase: { label: 'star size base', value: 0.18, min: 0.05, max: 0.4, step: 0.005 },
          starSizeRange: { label: 'star size range', value: 0.2, min: 0, max: 0.5, step: 0.005 },
          twinkle: { label: 'twinkle rate', value: 0.7, min: 0, max: 3, step: 0.05 },
          starTrim: { label: 'star trim', value: 0.55, min: 0, max: 1.5, step: 0.01 },
          heroThreshold: { label: 'hero rarity', value: 0.997, min: 0.95, max: 0.999, step: 0.001 },
          heroHalo: { label: 'hero halo', value: 0.55, min: 0, max: 1.5, step: 0.02 },
          heroHaloRadius: { label: 'hero halo radius', value: 0.5, min: 0.1, max: 1.5, step: 0.02 },
          heroBoost: { label: 'hero bloom kick', value: 1.8, min: 0, max: 4, step: 0.05 },
          horizonFadeStart: { label: 'horizon fade start', value: 0.15, min: 0, max: 0.8, step: 0.01 },
          horizonFadeEnd: { label: 'horizon fade end', value: 0.5, min: 0, max: 0.8, step: 0.01 },
        },
        { collapsed: true },
      ),
      'sky · stars color': folder(
        {
          starColor: { value: '#f4e8cd', label: 'star (cream)' },
          starColorCool: { value: '#c8dcff', label: 'star (cool)' },
          starColorWarm: { value: '#ffc8a0', label: 'star (warm)' },
          coolMix: { label: 'cool ratio', value: 0.18, min: 0, max: 0.5, step: 0.01 },
          warmMix: { label: 'warm ratio', value: 0.15, min: 0, max: 0.5, step: 0.01 },
        },
        { collapsed: true },
      ),
      'sky · finish': folder(
        {
          grain: { label: 'paper grain', value: 0, min: 0, max: 0.1, step: 0.001 },
          scrollFloor: { label: 'scroll coupling floor', value: 0.4, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      dust: folder(
        {
          fgDustColor: { value: '#2a3a55', label: 'dust color' },
          dustIntensity: { label: 'dust intensity', value: 0.85, min: 0, max: 2, step: 0.02 },
          dustAlphaCap: { label: 'dust max alpha', value: 0.28, min: 0, max: 1, step: 0.01 },
          dustAnisotropy: { label: 'streak stretch', value: 7.5, min: 1, max: 16, step: 0.1 },
          dustDriftSpeed: { label: 'dust drift', value: 0.015, min: 0, max: 0.1, step: 0.001 },
          dustThresholdLo: { label: 'wisp threshold lo', value: 0.32, min: 0, max: 1, step: 0.01 },
          dustThresholdHi: { label: 'wisp threshold hi', value: 0.68, min: 0, max: 1, step: 0.01 },
          dustAltitudeLo: { label: 'dust altitude lo', value: 0.15, min: 0, max: 1.2, step: 0.01 },
          dustAltitudeHi: { label: 'dust altitude hi', value: 1.05, min: 0, max: 1.2, step: 0.01 },
        },
        { collapsed: true },
      ),
      ridge: folder(
        {
          ridgeY: { label: 'y', value: 30.0, min: 0, max: 50, step: 0.25 },
          ridgeZ: { label: 'z', value: -163, min: -200, max: -20, step: 1 },
          ridgeScale: { label: 'scale', value: 260, min: 80, max: 600, step: 2 },
          ridgeOpacity: { label: 'opacity', value: 0.7, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      campsite: folder(
        {
          campsiteX: { label: 'x', value: -1.0, min: -30, max: 30, step: 0.25 },
          campsiteY: { label: 'y', value: -0.5, min: -18, max: 8, step: 0.25 },
          campsiteZ: { label: 'z', value: -22, min: -60, max: 5, step: 1 },
          campsiteScale: { label: 'scale', value: 50, min: 20, max: 140, step: 1 },
          campsiteOpacity: { label: 'opacity', value: 0.9, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      foreground: folder(
        {
          foregroundX: { label: 'x', value: 1.0, min: -40, max: 40, step: 0.5 },
          foregroundY: { label: 'y', value: 5, min: 0, max: 10, step: 0.25 },
          foregroundZ: { label: 'z', value: -20, min: -30, max: 15, step: 1 },
          foregroundScale: { label: 'scale', value: 105, min: 40, max: 220, step: 1 },
          foregroundOpacity: { label: 'opacity', value: 0.86, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      fox: folder(
        {
          foxEnabled: { label: 'enabled', value: true },
          foxStartX: { label: 'start x', value: -24, min: -50, max: 20, step: 0.5 },
          foxEndX: { label: 'end x', value: -4, min: -30, max: 30, step: 0.5 },
          foxY: { label: 'y', value: -5.5, min: -18, max: 8, step: 0.25 },
          foxZ: { label: 'z', value: -14, min: -40, max: 5, step: 1 },
          foxScale: { label: 'scale', value: 12, min: 4, max: 28, step: 0.5 },
          foxOpacity: { label: 'opacity', value: 0.95, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
    },
    { collapsed: true },
  );

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('camp', p);
    isActive.current = opacity > 0;

    const w = MODULE_TIMELINE.camp;
    campProgress.current = MathUtils.clamp((p - w.ownStart) / (w.ownEnd - w.ownStart), 0, 1);

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  const campsiteAspect = 1774 / 887;
  const ridgeAspect = 1998 / 787;
  const foregroundAspect = 1881 / 836;

  return (
    <group ref={groupRef}>
      <SumiSky isActive={isActive} campProgress={campProgress} lutTexture={skyLUT} controls={controls} />

      {/* Distant ridge + treeline, generated as part of the Camp atmosphere family. */}
      <CampBillboard
        url="/camp/atmosphere/ridge.png"
        position={[0, controls.ridgeY, controls.ridgeZ]}
        scale={[controls.ridgeScale, controls.ridgeScale / ridgeAspect]}
        opacity={controls.ridgeOpacity}
      />

      {/* New composed campsite image. This replaces the old standalone campfire layer. */}
      <CampBillboard
        url="/camp/atmosphere/campsite.png"
        position={[controls.campsiteX, controls.campsiteY, controls.campsiteZ]}
        scale={[controls.campsiteScale, controls.campsiteScale / campsiteAspect]}
        opacity={controls.campsiteOpacity}
      />

      {controls.foxEnabled && (
        <ScrollLinkedSprite
          textureUrl="/sprites/wildlife/fox-walk-padded.webp"
          startPosition={[controls.foxStartX, controls.foxY, controls.foxZ]}
          endPosition={[controls.foxEndX, controls.foxY, controls.foxZ]}
          scale={[controls.foxScale, controls.foxScale]}
          frames={16}
          cols={4}
          rows={4}
          frameInsetPx={3}
          scrollStart={MODULE_TIMELINE.camp.enterEnd}
          scrollEnd={MODULE_TIMELINE.camp.exitStart}
          cycles={1}
          endBehavior="hold-last"
          opacity={controls.foxOpacity}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Foreground frame: trail, rocks, and underbrush generated in the same style as the campsite. */}
      <CampBillboard
        url="/camp/atmosphere/foreground.png"
        position={[controls.foregroundX, controls.foregroundY, controls.foregroundZ]}
        scale={[controls.foregroundScale, controls.foregroundScale / foregroundAspect]}
        opacity={controls.foregroundOpacity}
      />
    </group>
  );
}

// =============================================================================
// TRAIL FORK SCENE GROUP
// First-person Y-fork: woodcut backdrop + arching branch + bird flyby.
// Cursor-driven ink wetness on the backdrop foreshadows /off-trail's water
// ripples. Single click hit-area in HomeClient sits over the stream region.
// =============================================================================

function TrailForkSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const branchRef = useRef<Mesh>(null);
  const lerpedP = useRef(0);
  const mousePos = useRef(new Vector2(0, 0));

  const sceneTex = useTexture('/trail-fork/trail-fork-scene.webp');
  const branchTex = useTexture('/trail-fork/arch-branch.webp');

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => window.removeEventListener('mousemove', onMouse);
  }, []);

  useEffect(() => {
    return () => {
      sceneTex.dispose();
      branchTex.dispose();
    };
  }, [sceneTex, branchTex]);

  useFrame((_state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('trailFork', p);

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0;
      if (!groupRef.current.visible) return;
      applyGroupOpacity(groupRef.current, opacity);
    }

    // Branch micro-bend toward cursor — small Z rotation tracks cursor X.
    if (branchRef.current) {
      const targetTilt = mousePos.current.x * 0.05;
      branchRef.current.rotation.z = MathUtils.damp(branchRef.current.rotation.z, targetTilt, 4, delta);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Backdrop scene plane — Hasui woodblock illustration, rendered as-is. */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[32, 17.6]} />
        <meshBasicMaterial map={sceneTex} transparent depthWrite={false} />
      </mesh>

      {/* Arching branch — base at right, foliage clump arches over the stream */}
      <mesh ref={branchRef} position={[5, 4.5, -7]}>
        <planeGeometry args={[20, 11.2]} />
        <meshBasicMaterial map={branchTex} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

// =============================================================================
// ALPINE SCENE GROUP
// =============================================================================

function RockLedge({
  textureUrl,
  position,
  scale,
  rotation = 0,
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
  rotation?: number;
}) {
  const tex = useTexture(textureUrl) as Texture;
  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);
  return (
    <mesh position={position} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} />
    </mesh>
  );
}

/**
 * Alpine haze — pre-dawn cool sky behind the alpine ridge silhouettes.
 * Replaces the auto-panning `alpine_wall.webp`. uAltitudePulse hero dial
 * couples to the climb (camera y -60 → 120), brightening the upper sky as
 * the user crests. NO warm tones — that's Summit's job.
 */
function AlpineHaze({
  isActive,
  altitudePulseRef,
  position,
  scale,
  fbmScale,
  fogScale,
  fogSpeed,
  grainAmount,
  baseColor,
  highColor,
  horizonColor,
  fogColor,
  altitudePulseOverride,
}: {
  isActive: React.MutableRefObject<boolean>;
  altitudePulseRef: React.MutableRefObject<number>;
  position: [number, number, number];
  scale: [number, number];
  fbmScale: number;
  fogScale?: number;
  fogSpeed?: number;
  grainAmount?: number;
  baseColor?: string;
  highColor?: string;
  horizonColor?: string;
  fogColor?: string;
  altitudePulseOverride?: number;
}) {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (!isActive.current) return;
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    matRef.current.uFbmScale = fbmScale;
    if (typeof fogScale === 'number') matRef.current.uFogScale = fogScale;
    if (typeof fogSpeed === 'number') matRef.current.uFogSpeed = fogSpeed;
    if (typeof grainAmount === 'number') matRef.current.uGrainAmount = grainAmount;
    if (baseColor) matRef.current.uColorHazeBase.set(baseColor);
    if (highColor) matRef.current.uColorHazeHigh.set(highColor);
    if (horizonColor) matRef.current.uColorHorizon.set(horizonColor);
    if (fogColor) matRef.current.uColorFog.set(fogColor);

    if (typeof altitudePulseOverride === 'number' && altitudePulseOverride >= 0) {
      matRef.current.uAltitudePulse = altitudePulseOverride;
    } else {
      matRef.current.uAltitudePulse = altitudePulseRef.current;
    }
  });
  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <AlpineHazeShader ref={matRef} transparent={false} depthWrite={true} />
    </mesh>
  );
}

function SyncedRockLedge({
  textureUrl,
  position,
  scale,
  range,
  lerpedP,
  opacityMul = 1,
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
  range: readonly [number, number, number, number];
  lerpedP: React.RefObject<number>;
  opacityMul?: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = lerpedP.current;
    let opacity = 0;
    if (p <= range[0] || p >= range[3]) opacity = 0;
    else if (p < range[1]) opacity = (p - range[0]) / (range[1] - range[0]);
    else if (p > range[2]) opacity = (range[3] - p) / (range[3] - range[2]);
    else opacity = 1;
    opacity *= opacityMul;
    groupRef.current.visible = opacity > 0;
    if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
  });

  return (
    <group ref={groupRef}>
      <RockLedge textureUrl={textureUrl} position={position} scale={scale} />
    </group>
  );
}

const ALPINE_PRESET_DEFAULT = 'Crisp Crest';

const ALPINE_PRESETS = {
  // Current baked-in look — captured exactly so default is unchanged.
  'Crisp Crest': {
    skyY: 60,
    skyZ: -300,
    skyW: 1000,
    skyH: 500,
    skyFbmScale: 2.0,
    skyFogScale: 3.0,
    skyFogSpeed: 0.04,
    skyGrainAmount: 0.025,
    skyBaseColor: '#5a6878',
    skyHighColor: '#a4b0c4',
    skyHorizonColor: '#6a7888',
    skyFogColor: '#7f8f9f',
    altitudePulseOverride: -1, // -1 = use scroll-coupled computed value
    ridgeFarY: 88,
    ridgeFarZ: -260,
    ridgeFarW: 320,
    ridgeFarH: 179,
    ridgeFarOpacity: 1.0,
    ridgeMidY: 100,
    ridgeMidZ: -200,
    ridgeMidW: 360,
    ridgeMidH: 201,
    ridgeMidOpacity: 1.0,
    cloudY: 60,
    cloudZ: -180,
    cloudSize: 800,
    cloudFbmScale: 1.6,
    cloudDriftSpeed: 0.4,
    cloudCoverageMax: 0.6,
    cloudContrast: 1.0,
    cloudRimStrength: 1.0,
    cloudShadowStrength: 1.0,
    cloudOpacity: 1.0,
    cloudVeilY: 84,
    cloudVeilZ: -235,
    cloudVeilW: 1220,
    cloudVeilH: 270,
    cloudVeilFbmScale: 1.05,
    cloudVeilDriftSpeed: 0.18,
    cloudVeilCoverageMax: 0.58,
    cloudVeilContrast: 0.78,
    cloudVeilShadowStrength: 0.55,
    cloudVeilOpacity: 0.34,
    ledgeOpacityMul: 1.0,
  },
  // Heavier atmospheric perspective — ridges dissolve harder, low altitude pulse.
  'Vast Cold': {
    skyY: 60,
    skyZ: -300,
    skyW: 1000,
    skyH: 500,
    skyFbmScale: 1.7,
    skyFogScale: 2.3,
    skyFogSpeed: 0.03,
    skyGrainAmount: 0.03,
    skyBaseColor: '#4a5666',
    skyHighColor: '#8a98ad',
    skyHorizonColor: '#5a6878',
    skyFogColor: '#6f7e90',
    altitudePulseOverride: 0.15,
    ridgeFarY: 88,
    ridgeFarZ: -260,
    ridgeFarW: 320,
    ridgeFarH: 179,
    ridgeFarOpacity: 0.45,
    ridgeMidY: 100,
    ridgeMidZ: -200,
    ridgeMidW: 360,
    ridgeMidH: 201,
    ridgeMidOpacity: 0.7,
    cloudY: 55,
    cloudZ: -180,
    cloudSize: 900,
    cloudFbmScale: 1.4,
    cloudDriftSpeed: 0.2,
    cloudCoverageMax: 0.85,
    cloudContrast: 0.85,
    cloudRimStrength: 0.6,
    cloudShadowStrength: 1.2,
    cloudOpacity: 1.0,
    cloudVeilY: 82,
    cloudVeilZ: -240,
    cloudVeilW: 1320,
    cloudVeilH: 300,
    cloudVeilFbmScale: 0.95,
    cloudVeilDriftSpeed: 0.12,
    cloudVeilCoverageMax: 0.76,
    cloudVeilContrast: 0.7,
    cloudVeilShadowStrength: 0.82,
    cloudVeilOpacity: 0.48,
    ledgeOpacityMul: 0.85,
  },
  // Frozen-quiet — fog still, no drift, dense mist.
  'Held Breath': {
    skyY: 60,
    skyZ: -300,
    skyW: 1000,
    skyH: 500,
    skyFbmScale: 2.4,
    skyFogScale: 3.6,
    skyFogSpeed: 0.005,
    skyGrainAmount: 0.022,
    skyBaseColor: '#5e6c7e',
    skyHighColor: '#b6c0cf',
    skyHorizonColor: '#717f90',
    skyFogColor: '#8a99ab',
    altitudePulseOverride: 0.4,
    ridgeFarY: 88,
    ridgeFarZ: -260,
    ridgeFarW: 320,
    ridgeFarH: 179,
    ridgeFarOpacity: 0.7,
    ridgeMidY: 100,
    ridgeMidZ: -200,
    ridgeMidW: 360,
    ridgeMidH: 201,
    ridgeMidOpacity: 0.95,
    cloudY: 60,
    cloudZ: -180,
    cloudSize: 800,
    cloudFbmScale: 1.8,
    cloudDriftSpeed: 0.05,
    cloudCoverageMax: 0.7,
    cloudContrast: 1.05,
    cloudRimStrength: 0.85,
    cloudShadowStrength: 0.95,
    cloudOpacity: 1.0,
    cloudVeilY: 84,
    cloudVeilZ: -235,
    cloudVeilW: 1260,
    cloudVeilH: 290,
    cloudVeilFbmScale: 1.15,
    cloudVeilDriftSpeed: 0.02,
    cloudVeilCoverageMax: 0.68,
    cloudVeilContrast: 0.76,
    cloudVeilShadowStrength: 0.65,
    cloudVeilOpacity: 0.42,
    ledgeOpacityMul: 1.0,
  },
  // Wind-shaped — stretched fbm, fast cloud drift, kinetic atmosphere.
  'Wind-Carved': {
    skyY: 60,
    skyZ: -300,
    skyW: 1000,
    skyH: 500,
    skyFbmScale: 2.4,
    skyFogScale: 4.5,
    skyFogSpeed: 0.12,
    skyGrainAmount: 0.025,
    skyBaseColor: '#586676',
    skyHighColor: '#a8b6c8',
    skyHorizonColor: '#697787',
    skyFogColor: '#85949f',
    altitudePulseOverride: -1,
    ridgeFarY: 88,
    ridgeFarZ: -260,
    ridgeFarW: 320,
    ridgeFarH: 179,
    ridgeFarOpacity: 0.85,
    ridgeMidY: 100,
    ridgeMidZ: -200,
    ridgeMidW: 360,
    ridgeMidH: 201,
    ridgeMidOpacity: 1.0,
    cloudY: 60,
    cloudZ: -180,
    cloudSize: 850,
    cloudFbmScale: 2.2,
    cloudDriftSpeed: 1.6,
    cloudCoverageMax: 0.55,
    cloudContrast: 1.25,
    cloudRimStrength: 1.35,
    cloudShadowStrength: 0.85,
    cloudOpacity: 1.0,
    cloudVeilY: 86,
    cloudVeilZ: -230,
    cloudVeilW: 1260,
    cloudVeilH: 250,
    cloudVeilFbmScale: 1.65,
    cloudVeilDriftSpeed: 0.9,
    cloudVeilCoverageMax: 0.48,
    cloudVeilContrast: 0.92,
    cloudVeilShadowStrength: 0.5,
    cloudVeilOpacity: 0.34,
    ledgeOpacityMul: 1.0,
  },
  // Clear high-altitude — sharp ridges, light haze, paler palette.
  'Thin Air': {
    skyY: 60,
    skyZ: -300,
    skyW: 1000,
    skyH: 500,
    skyFbmScale: 2.0,
    skyFogScale: 3.0,
    skyFogSpeed: 0.04,
    skyGrainAmount: 0.02,
    skyBaseColor: '#7d8a9d',
    skyHighColor: '#cad4e0',
    skyHorizonColor: '#92a0b1',
    skyFogColor: '#a3b1c1',
    altitudePulseOverride: 0.95,
    ridgeFarY: 88,
    ridgeFarZ: -260,
    ridgeFarW: 320,
    ridgeFarH: 179,
    ridgeFarOpacity: 1.0,
    ridgeMidY: 100,
    ridgeMidZ: -200,
    ridgeMidW: 360,
    ridgeMidH: 201,
    ridgeMidOpacity: 1.0,
    cloudY: 60,
    cloudZ: -180,
    cloudSize: 800,
    cloudFbmScale: 1.4,
    cloudDriftSpeed: 0.3,
    cloudCoverageMax: 0.35,
    cloudContrast: 1.4,
    cloudRimStrength: 1.5,
    cloudShadowStrength: 0.55,
    cloudOpacity: 1.0,
    cloudVeilY: 88,
    cloudVeilZ: -240,
    cloudVeilW: 1100,
    cloudVeilH: 220,
    cloudVeilFbmScale: 1.0,
    cloudVeilDriftSpeed: 0.12,
    cloudVeilCoverageMax: 0.32,
    cloudVeilContrast: 0.88,
    cloudVeilShadowStrength: 0.35,
    cloudVeilOpacity: 0.18,
    ledgeOpacityMul: 1.0,
  },
  // Ominous — darker slate, heavier coverage, low atmosphere.
  'Storm Brewing': {
    skyY: 60,
    skyZ: -300,
    skyW: 1000,
    skyH: 500,
    skyFbmScale: 1.6,
    skyFogScale: 2.6,
    skyFogSpeed: 0.06,
    skyGrainAmount: 0.035,
    skyBaseColor: '#3a4452',
    skyHighColor: '#677484',
    skyHorizonColor: '#48535f',
    skyFogColor: '#5a6573',
    altitudePulseOverride: 0.05,
    ridgeFarY: 88,
    ridgeFarZ: -260,
    ridgeFarW: 320,
    ridgeFarH: 179,
    ridgeFarOpacity: 0.55,
    ridgeMidY: 100,
    ridgeMidZ: -200,
    ridgeMidW: 360,
    ridgeMidH: 201,
    ridgeMidOpacity: 0.85,
    cloudY: 50,
    cloudZ: -180,
    cloudSize: 950,
    cloudFbmScale: 1.5,
    cloudDriftSpeed: 0.7,
    cloudCoverageMax: 0.95,
    cloudContrast: 1.15,
    cloudRimStrength: 0.4,
    cloudShadowStrength: 1.5,
    cloudOpacity: 1.0,
    cloudVeilY: 76,
    cloudVeilZ: -235,
    cloudVeilW: 1380,
    cloudVeilH: 320,
    cloudVeilFbmScale: 1.1,
    cloudVeilDriftSpeed: 0.28,
    cloudVeilCoverageMax: 0.88,
    cloudVeilContrast: 0.82,
    cloudVeilShadowStrength: 1.0,
    cloudVeilOpacity: 0.56,
    ledgeOpacityMul: 0.95,
  },
} as const;

type AlpinePresetName = keyof typeof ALPINE_PRESETS;

function AlpineSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(false);
  const altitudePulse = useRef(0);
  const cloudCoverage = useRef(0);
  const cloudVeilCoverage = useRef(0);
  const sunPulseZero = useRef(0);
  const alpine = MODULE_TIMELINE.alpine;
  const summit = MODULE_TIMELINE.summit;
  const ranges = useMemo(() => sceneChildRanges('alpine', 4), []);

  const defaultAlpinePreset = ALPINE_PRESETS[ALPINE_PRESET_DEFAULT];
  const [controls, setAlpineControls] = useControls(
    'Home Alpine',
    () => ({
      'scene · visibility': folder(
        {
          hazeEnabled: { label: 'haze', value: true },
          ridgeFarEnabled: { label: 'ridge far', value: true },
          ridgeMidEnabled: { label: 'ridge mid', value: true },
          cloudSeaEnabled: { label: 'cloud sea', value: true },
          cloudVeilEnabled: { label: 'cloud veil', value: true },
          ledgesEnabled: { label: 'ledges', value: true },
          birdEnabled: { label: 'bird', value: true },
        },
        { collapsed: false },
      ),
      'sky · placement': folder(
        {
          skyY: { value: defaultAlpinePreset.skyY, min: 0, max: 200, step: 1 },
          skyZ: { value: defaultAlpinePreset.skyZ, min: -500, max: -100, step: 1 },
          skyW: { value: defaultAlpinePreset.skyW, min: 400, max: 2000, step: 10 },
          skyH: { value: defaultAlpinePreset.skyH, min: 200, max: 1200, step: 10 },
        },
        { collapsed: true },
      ),
      'sky · haze': folder(
        {
          skyFbmScale: { value: defaultAlpinePreset.skyFbmScale, min: 0.5, max: 6, step: 0.05 },
          skyFogScale: { value: defaultAlpinePreset.skyFogScale, min: 0.5, max: 8, step: 0.05 },
          skyFogSpeed: { value: defaultAlpinePreset.skyFogSpeed, min: 0, max: 0.3, step: 0.005 },
          skyGrainAmount: { value: defaultAlpinePreset.skyGrainAmount, min: 0, max: 0.1, step: 0.001 },
          altitudePulseOverride: {
            label: 'altitude pulse (-1=auto)',
            value: defaultAlpinePreset.altitudePulseOverride,
            min: -1,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true },
      ),
      'sky · color': folder(
        {
          skyBaseColor: { value: defaultAlpinePreset.skyBaseColor, label: 'haze base' },
          skyHighColor: { value: defaultAlpinePreset.skyHighColor, label: 'haze high' },
          skyHorizonColor: { value: defaultAlpinePreset.skyHorizonColor, label: 'horizon' },
          skyFogColor: { value: defaultAlpinePreset.skyFogColor, label: 'fog' },
        },
        { collapsed: true },
      ),
      'ridge · far': folder(
        {
          ridgeFarY: { value: defaultAlpinePreset.ridgeFarY, min: 0, max: 200, step: 1 },
          ridgeFarZ: { value: defaultAlpinePreset.ridgeFarZ, min: -400, max: -100, step: 1 },
          ridgeFarW: { value: defaultAlpinePreset.ridgeFarW, min: 100, max: 600, step: 2 },
          ridgeFarH: { value: defaultAlpinePreset.ridgeFarH, min: 60, max: 360, step: 1 },
          ridgeFarOpacity: { value: defaultAlpinePreset.ridgeFarOpacity, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      'ridge · mid': folder(
        {
          ridgeMidY: { value: defaultAlpinePreset.ridgeMidY, min: 0, max: 200, step: 1 },
          ridgeMidZ: { value: defaultAlpinePreset.ridgeMidZ, min: -400, max: -100, step: 1 },
          ridgeMidW: { value: defaultAlpinePreset.ridgeMidW, min: 100, max: 700, step: 2 },
          ridgeMidH: { value: defaultAlpinePreset.ridgeMidH, min: 60, max: 400, step: 1 },
          ridgeMidOpacity: { value: defaultAlpinePreset.ridgeMidOpacity, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      'cloud sea': folder(
        {
          cloudY: { value: defaultAlpinePreset.cloudY, min: 0, max: 160, step: 1 },
          cloudZ: { value: defaultAlpinePreset.cloudZ, min: -300, max: -50, step: 1 },
          cloudSize: { value: defaultAlpinePreset.cloudSize, min: 200, max: 1800, step: 10 },
          cloudFbmScale: { value: defaultAlpinePreset.cloudFbmScale, min: 0.6, max: 3.5, step: 0.05 },
          cloudDriftSpeed: { value: defaultAlpinePreset.cloudDriftSpeed, min: 0, max: 4, step: 0.05 },
          cloudCoverageMax: { value: defaultAlpinePreset.cloudCoverageMax, min: 0, max: 1, step: 0.01 },
          cloudContrast: { value: defaultAlpinePreset.cloudContrast, min: 0.5, max: 3, step: 0.02 },
          cloudRimStrength: { value: defaultAlpinePreset.cloudRimStrength, min: 0, max: 4, step: 0.05 },
          cloudShadowStrength: { value: defaultAlpinePreset.cloudShadowStrength, min: 0, max: 1.6, step: 0.02 },
          cloudOpacity: { value: defaultAlpinePreset.cloudOpacity, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      'cloud veil': folder(
        {
          cloudVeilY: { value: defaultAlpinePreset.cloudVeilY, min: 0, max: 180, step: 1 },
          cloudVeilZ: { value: defaultAlpinePreset.cloudVeilZ, min: -340, max: -80, step: 1 },
          cloudVeilW: { value: defaultAlpinePreset.cloudVeilW, min: 400, max: 2200, step: 10 },
          cloudVeilH: { value: defaultAlpinePreset.cloudVeilH, min: 80, max: 700, step: 5 },
          cloudVeilFbmScale: { value: defaultAlpinePreset.cloudVeilFbmScale, min: 0.5, max: 3.5, step: 0.05 },
          cloudVeilDriftSpeed: { value: defaultAlpinePreset.cloudVeilDriftSpeed, min: 0, max: 2, step: 0.02 },
          cloudVeilCoverageMax: { value: defaultAlpinePreset.cloudVeilCoverageMax, min: 0, max: 1, step: 0.01 },
          cloudVeilContrast: { value: defaultAlpinePreset.cloudVeilContrast, min: 0.4, max: 2.4, step: 0.02 },
          cloudVeilShadowStrength: { value: defaultAlpinePreset.cloudVeilShadowStrength, min: 0, max: 1.6, step: 0.02 },
          cloudVeilOpacity: { value: defaultAlpinePreset.cloudVeilOpacity, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
      ledges: folder(
        {
          ledgeOpacityMul: { value: defaultAlpinePreset.ledgeOpacityMul, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true },
      ),
    }),
    { collapsed: true },
  );

  useControls('Home Alpine Presets', {
    preset: {
      options: Object.keys(ALPINE_PRESETS),
      value: ALPINE_PRESET_DEFAULT,
      onChange: (value: string) => {
        const preset = ALPINE_PRESETS[value as AlpinePresetName];
        if (preset) setAlpineControls(preset);
      },
    },
  });

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('alpine', p);
    isActive.current = opacity > 0;

    const altSpan = alpine.exitEnd - alpine.enterStart;
    const altRaw = altSpan > 0 ? Math.min(1, Math.max(0, (p - alpine.enterStart) / altSpan)) : 0;
    altitudePulse.current = altRaw * altRaw * (3.0 - 2.0 * altRaw);

    // Coverage comes in during Alpine entry, then preserves the baked
    // Alpine-to-Summit hand-off into the full cloud carpet.
    const peak = controls.cloudCoverageMax;
    const entrySpan = alpine.enterEnd - alpine.ownStart;
    const exitSpan = summit.ownStart - alpine.exitStart;
    let coverage: number;
    if (p < alpine.ownStart) coverage = 0;
    else if (p < alpine.enterEnd) coverage = peak * Math.min(1, (p - alpine.ownStart) / entrySpan);
    else if (p < alpine.exitStart) coverage = peak;
    else if (p < summit.ownStart) coverage = peak + (1.0 - peak) * Math.min(1, (p - alpine.exitStart) / exitSpan);
    else coverage = 1.0;
    cloudCoverage.current = coverage;

    const veilPeak = controls.cloudVeilCoverageMax;
    let veilCoverage: number;
    if (p < alpine.ownStart) veilCoverage = 0;
    else if (p < alpine.enterEnd) veilCoverage = veilPeak * Math.min(1, (p - alpine.ownStart) / entrySpan);
    else if (p < alpine.exitStart) veilCoverage = veilPeak;
    else if (p < summit.ownStart)
      veilCoverage = veilPeak + Math.min(0.2, 1.0 - veilPeak) * Math.min(1, (p - alpine.exitStart) / exitSpan);
    else veilCoverage = 1.0;
    cloudVeilCoverage.current = veilCoverage;

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  return (
    <group ref={groupRef}>
      {controls.hazeEnabled && (
        <AlpineHaze
          isActive={isActive}
          altitudePulseRef={altitudePulse}
          position={[0, controls.skyY, controls.skyZ]}
          scale={[controls.skyW, controls.skyH]}
          fbmScale={controls.skyFbmScale}
          fogScale={controls.skyFogScale}
          fogSpeed={controls.skyFogSpeed}
          grainAmount={controls.skyGrainAmount}
          baseColor={controls.skyBaseColor}
          highColor={controls.skyHighColor}
          horizonColor={controls.skyHorizonColor}
          fogColor={controls.skyFogColor}
          altitudePulseOverride={controls.altitudePulseOverride}
        />
      )}

      {controls.cloudVeilEnabled && (
        <CloudSea
          isActive={isActive}
          scrollProgress={scrollProgress}
          sunPulseRef={sunPulseZero}
          coverageRef={cloudVeilCoverage}
          position={[0, controls.cloudVeilY, controls.cloudVeilZ]}
          size={controls.cloudVeilW}
          planeScale={[controls.cloudVeilW, controls.cloudVeilH]}
          rotationX={0}
          fbmScale={controls.cloudVeilFbmScale}
          driftSpeed={controls.cloudVeilDriftSpeed}
          contrast={controls.cloudVeilContrast}
          rimStrength={0}
          shadowStrength={controls.cloudVeilShadowStrength}
          opacity={controls.cloudVeilOpacity}
          horizonColor={controls.skyFogColor}
          renderOrder={-4}
        />
      )}

      {controls.ridgeFarEnabled && (
        <SunRakeSilhouette
          url="/alpine/ridge-far.webp"
          position={[0, controls.ridgeFarY, controls.ridgeFarZ]}
          scale={[controls.ridgeFarW, controls.ridgeFarH]}
          sunPulseRef={sunPulseZero}
          sunDir={[0.6, 0.5]}
          warmStrength={0}
          opacity={controls.ridgeFarOpacity}
        />
      )}

      {controls.ridgeMidEnabled && (
        <SunRakeSilhouette
          url="/alpine/ridge-mid.webp"
          position={[0, controls.ridgeMidY, controls.ridgeMidZ]}
          scale={[controls.ridgeMidW, controls.ridgeMidH]}
          sunPulseRef={sunPulseZero}
          sunDir={[0.6, 0.5]}
          warmStrength={0}
          opacity={controls.ridgeMidOpacity}
        />
      )}

      {controls.cloudSeaEnabled && (
        <CloudSea
          isActive={isActive}
          scrollProgress={scrollProgress}
          sunPulseRef={sunPulseZero}
          coverageRef={cloudCoverage}
          position={[0, controls.cloudY, controls.cloudZ]}
          size={controls.cloudSize}
          fbmScale={controls.cloudFbmScale}
          driftSpeed={controls.cloudDriftSpeed}
          contrast={controls.cloudContrast}
          rimStrength={controls.cloudRimStrength}
          shadowStrength={controls.cloudShadowStrength}
          opacity={controls.cloudOpacity}
        />
      )}

      {controls.ledgesEnabled && (
        <>
          <SyncedRockLedge
            textureUrl="/alpine_ledge_left.webp"
            position={[-12, 0, -5]}
            scale={[25, 25]}
            range={ranges[0]}
            lerpedP={lerpedP}
            opacityMul={controls.ledgeOpacityMul}
          />
          <SyncedRockLedge
            textureUrl="/alpine_ledge_right.webp"
            position={[12, 30, -10]}
            scale={[25, 25]}
            range={ranges[1]}
            lerpedP={lerpedP}
            opacityMul={controls.ledgeOpacityMul}
          />
          <SyncedRockLedge
            textureUrl="/alpine_ledge_left_variant_2.webp"
            position={[-12, 60, -15]}
            scale={[25, 25]}
            range={ranges[2]}
            lerpedP={lerpedP}
            opacityMul={controls.ledgeOpacityMul}
          />
          <SyncedRockLedge
            textureUrl="/alpine_ledge_right_variant_2.webp"
            position={[12, 90, -20]}
            scale={[25, 25]}
            range={ranges[3]}
            lerpedP={lerpedP}
            opacityMul={controls.ledgeOpacityMul}
          />
        </>
      )}

      {controls.birdEnabled && (
        <ScrollLinkedSprite
          textureUrl="/sprites/wildlife/bird-flight-padded.webp"
          startPosition={[-45, 105, -30]}
          endPosition={[45, 105, -30]}
          scrollStart={alpine.exitStart}
          scrollEnd={alpine.ownEnd}
          scale={[30, 15]}
          frames={12}
          cols={6}
          rows={2}
          cycles={8}
          endBehavior="loop"
          scrollProgress={scrollProgress}
        />
      )}
    </group>
  );
}

// =============================================================================
// SUMMIT SCENE GROUP
// =============================================================================

function DawnSky({
  isActive,
  fbmScale,
  sunPulseRef,
  position,
  scale,
}: {
  isActive: React.MutableRefObject<boolean>;
  fbmScale: number;
  sunPulseRef: React.MutableRefObject<number>;
  position: [number, number, number];
  scale: [number, number];
}) {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (!isActive.current) return;
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uFbmScale = fbmScale;
      matRef.current.uSunPulse = sunPulseRef.current;
    }
  });
  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <DawnSkyShader ref={matRef} transparent={false} depthWrite={true} />
    </mesh>
  );
}

function CloudSea({
  isActive,
  scrollProgress,
  sunPulseRef,
  coverageRef,
  position,
  size,
  planeScale,
  rotationX = -Math.PI / 2,
  fbmScale,
  driftSpeed,
  coverage = 1,
  contrast = 1,
  rimStrength = 1,
  shadowStrength = 1,
  opacity = 1,
  sunDir,
  horizonColor,
  renderOrder = 0,
}: {
  isActive: React.MutableRefObject<boolean>;
  scrollProgress: MotionValue<number>;
  sunPulseRef: React.MutableRefObject<number>;
  coverageRef?: React.MutableRefObject<number>;
  position: [number, number, number];
  size: number;
  planeScale?: [number, number];
  rotationX?: number;
  fbmScale: number;
  driftSpeed: number;
  coverage?: number;
  contrast?: number;
  rimStrength?: number;
  shadowStrength?: number;
  opacity?: number;
  sunDir?: [number, number];
  horizonColor?: string;
  renderOrder?: number;
}) {
  const matRef = useRef<any>(null);
  const horizonColorObj = useMemo(() => (horizonColor ? new Color(horizonColor) : null), [horizonColor]);
  useFrame((state) => {
    if (!isActive.current) return;
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uScrollProgress = scrollProgress.get();
      matRef.current.uFbmScale = fbmScale;
      matRef.current.uDriftSpeed = driftSpeed;
      matRef.current.uSunPulse = sunPulseRef.current;
      // Coverage: Summit defaults to 1.0 (full carpet); Alpine drives it
      // 0 → 0.6 across the climb so the cloud sea condenses into being.
      matRef.current.uCoverage = coverageRef ? coverageRef.current : coverage;
      matRef.current.uContrast = contrast;
      matRef.current.uRimStrength = rimStrength;
      matRef.current.uShadowStrength = shadowStrength;
      matRef.current.uOpacity = opacity;
      if (sunDir) {
        matRef.current.uSunDir.set(sunDir[0], sunDir[1]);
      }
      if (horizonColorObj) {
        matRef.current.uHorizonColor.copy(horizonColorObj);
      }
    }
  });
  return (
    <mesh position={position} rotation={[rotationX, 0, 0]} renderOrder={renderOrder} frustumCulled={false}>
      <planeGeometry args={planeScale ?? [size, size]} />
      <CloudSeaShader ref={matRef} transparent depthTest={false} depthWrite={false} />
    </mesh>
  );
}

function SunRakeSilhouette({
  url,
  position,
  scale,
  sunPulseRef,
  sunDir,
  warmStrength,
  opacity = 1,
  atmosphericMix = 0,
  atmosphericColor,
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number];
  sunPulseRef: React.MutableRefObject<number>;
  sunDir: [number, number];
  warmStrength: number;
  opacity?: number;
  atmosphericMix?: number;
  atmosphericColor?: string;
}) {
  const tex = useTexture(url);
  const matRef = useRef<any>(null);
  const atmosphericColorObj = useMemo(
    () => (atmosphericColor ? new Color(atmosphericColor) : null),
    [atmosphericColor],
  );

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uSunPulse = sunPulseRef.current;
    matRef.current.uSunDir.set(sunDir[0], sunDir[1]);
    matRef.current.uWarmStrength = warmStrength;
    matRef.current.uOpacity = opacity;
    matRef.current.uAtmosphericMix = atmosphericMix;
    if (atmosphericColorObj) {
      matRef.current.uAtmosphericColor.copy(atmosphericColorObj);
    }
  });

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <SilhouetteSunRakeShader ref={matRef} uTexture={tex} transparent depthWrite={true} />
    </mesh>
  );
}

function SummitCloudImage({
  url,
  position,
  scale,
  opacity = 1,
  renderOrder = 0,
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
  renderOrder?: number;
}) {
  const tex = useTexture(url);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        opacity,
        toneMapped: false,
      }),
    [tex, opacity],
  );

  useEffect(() => {
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.needsUpdate = true;

    return () => material.dispose();
  }, [material, tex]);

  return (
    <mesh position={position} material={material} renderOrder={renderOrder} frustumCulled={false}>
      <planeGeometry args={scale} />
    </mesh>
  );
}

function DawnSun({
  position,
  scale,
  sunPulseRef,
  intensity,
  sunColor,
  haloColor,
}: {
  position: [number, number, number];
  scale: [number, number];
  sunPulseRef: React.MutableRefObject<number>;
  intensity: number;
  sunColor: string;
  haloColor: string;
}) {
  const matRef = useRef<any>(null);
  const sunColorObj = useMemo(() => new Color(sunColor), [sunColor]);
  const haloColorObj = useMemo(() => new Color(haloColor), [haloColor]);

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uSunPulse = sunPulseRef.current;
    matRef.current.uIntensity = intensity;
    matRef.current.uSunColor.copy(sunColorObj);
    matRef.current.uHaloColor.copy(haloColorObj);
  });

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <DawnSunShader ref={matRef} transparent depthWrite={false} />
    </mesh>
  );
}

// Project the screen-bottom edge ray onto a world-Z plane, accounting for
// camera tilt. The original pinning math assumed the camera looks straight
// ahead; with the summit camera tilted down (-0.18 rad), the screen-bottom
// in world space is well below `camera.y - viewport.height/2`, which is why
// the cliff and flag were drifting offscreen regardless of Leva tweaks.
function screenBottomYAtZ(camera: PerspectiveCamera, z: number): number {
  const halfV = (camera.fov * Math.PI) / 180 / 2;
  const angle = camera.rotation.x - halfV;
  const dirY = Math.sin(angle);
  const dirZ = -Math.cos(angle);
  // Avoid division by ~0 when camera is parallel to the plane.
  if (Math.abs(dirZ) < 1e-4) return camera.position.y;
  const t = (z - camera.position.z) / dirZ;
  return camera.position.y + t * dirY;
}

// Project the screen-left edge ray onto a world-Z plane. Used to corner-pin
// the cliff and closing-beat assets in the lower-left of the frame.
// Horizontal FOV is derived from the vertical FOV and aspect ratio.
function screenLeftXAtZ(camera: PerspectiveCamera, z: number): number {
  const fovYRad = (camera.fov * Math.PI) / 180;
  const halfV = fovYRad / 2;
  const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
  const dirX = -Math.sin(halfH);
  const dirZ = -Math.cos(halfH) * Math.cos(camera.rotation.x);
  if (Math.abs(dirZ) < 1e-4) return camera.position.x;
  const t = (z - camera.position.z) / dirZ;
  return camera.position.x + t * dirX;
}

// Corner-pinned cliff — anchors to the lower-left of the viewport at the
// cliff's z. cornerOffsetX / cornerOffsetY are small fine-tune offsets in
// world units (positive cornerOffsetX pulls the cliff inward from the left
// edge, positive cornerOffsetY lifts it off the bottom edge). The cliff also
// publishes its current rock-surface world Y/X to the optional anchorRef so
// the flag sprite can plant on it without having to recompute the corner pin.
function SunRakeForegroundCliff({
  textureUrl,
  z,
  scale,
  cornerOffsetX,
  cornerOffsetY,
  rockSurfaceUv,
  sunPulseRef,
  sunDir,
  warmStrength,
  anchorRef,
}: {
  textureUrl: string;
  z: number;
  scale: [number, number];
  cornerOffsetX: number;
  cornerOffsetY: number;
  rockSurfaceUv: [number, number];
  sunPulseRef: React.MutableRefObject<number>;
  sunDir: [number, number];
  warmStrength: number;
  anchorRef?: React.MutableRefObject<{ x: number; y: number; z: number } | null>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uSunPulse = sunPulseRef.current;
      matRef.current.uSunDir.set(sunDir[0], sunDir[1]);
      matRef.current.uWarmStrength = warmStrength;
    }
    if (meshRef.current && (camera as PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as PerspectiveCamera;
      const screenBottomY = screenBottomYAtZ(cam, z);
      const screenLeftX = screenLeftXAtZ(cam, z);
      // Pin plane left-edge to viewport left-edge, plane bottom-edge to
      // viewport bottom-edge, with offsets for fine tune.
      const centerX = screenLeftX + scale[0] / 2 + cornerOffsetX;
      const centerY = screenBottomY + scale[1] / 2 + cornerOffsetY;
      meshRef.current.position.x = centerX;
      meshRef.current.position.y = centerY;

      // Publish the rock-surface anchor in world space so the flag can plant
      // on it. UV (0,0) = bottom-left of plane, (1,1) = top-right.
      if (anchorRef) {
        anchorRef.current = {
          x: centerX + (rockSurfaceUv[0] - 0.5) * scale[0],
          y: centerY + (rockSurfaceUv[1] - 0.5) * scale[1],
          z,
        };
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, z]} renderOrder={10} frustumCulled={false}>
      <planeGeometry args={scale} />
      <SilhouetteSunRakeShader ref={matRef} uTexture={tex} transparent depthWrite={true} />
    </mesh>
  );
}

// Anchor-driven flag sprite. The pole base in flag.webp sits at roughly
// UV (0.70, 0.05) — not bottom-center — so naively centering the plane on
// the plant point left the flag floating well above the cliff. Instead, the
// plane positions itself such that the (poleBaseU, poleBaseV) point on the
// texture lands exactly on the cliff anchor (with optional fine-tune offset).
function SunRakeFlagSprite({
  textureUrl,
  scale,
  anchorOffsetX,
  anchorOffsetY,
  anchorOffsetZ,
  poleBaseUv,
  cliffAnchorRef,
  sunPulseRef,
  sunDir,
  warmStrength,
}: {
  textureUrl: string;
  scale: [number, number];
  anchorOffsetX: number;
  anchorOffsetY: number;
  anchorOffsetZ: number;
  poleBaseUv: [number, number];
  cliffAnchorRef: React.MutableRefObject<{ x: number; y: number; z: number } | null>;
  sunPulseRef: React.MutableRefObject<number>;
  sunDir: [number, number];
  warmStrength: number;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uSunPulse = sunPulseRef.current;
      matRef.current.uSunDir.set(sunDir[0], sunDir[1]);
      matRef.current.uWarmStrength = warmStrength;
    }
    const anchor = cliffAnchorRef.current;
    if (meshRef.current && anchor) {
      // Position plane center such that the pole-base UV point lands on the
      // cliff anchor. UV (0,0)=bottom-left, (1,1)=top-right.
      meshRef.current.position.x = anchor.x + anchorOffsetX - (poleBaseUv[0] - 0.5) * scale[0];
      meshRef.current.position.y = anchor.y + anchorOffsetY - (poleBaseUv[1] - 0.5) * scale[1];
      meshRef.current.position.z = anchor.z + anchorOffsetZ;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={11} frustumCulled={false}>
      <planeGeometry args={scale} />
      <SilhouetteSunRakeShader ref={matRef} uTexture={tex} transparent depthWrite={true} />
    </mesh>
  );
}

const SUMMIT_PRESET_DEFAULT = 'Crisp Summit';

const SUMMIT_PRESETS = {
  'Cinematic Cloud Reveal': {
    skyZ: -205,
    skyY: 126,
    skyW: 1500,
    skyH: 760,
    skyFbmScale: 2.1,
    cloudY: 28,
    cloudZ: -76,
    cloudSize: 900,
    cloudHeight: 110,
    cloudFbmScale: 1.35,
    cloudDriftSpeed: 0.65,
    cloudOpacity: 0.18,
    cloudCoverage: 0.38,
    cloudContrast: 1.35,
    cloudRimStrength: 1.2,
    cloudShadowStrength: 0.42,
    cloudForegroundY: 4,
    cloudForegroundZ: -42,
    cloudForegroundSize: 940,
    cloudForegroundHeight: 80,
    cloudForegroundOpacity: 0.08,
    cloudForegroundCoverage: 0.28,
    cloudHorizonColor: '#bbc7d8',
    cloudImageX: -18,
    cloudImageY: 108,
    cloudImageZ: -150,
    cloudImageW: 310,
    cloudImageH: 174,
    cloudImageOpacity: 1,
    cloudImageNearX: -14,
    cloudImageNearY: 10,
    cloudImageNearZ: -48,
    cloudImageNearW: 232,
    cloudImageNearH: 111,
    cloudImageNearOpacity: 0.3,
    cliffZ: -2,
    cliffW: 7.6,
    cliffH: 4.2,
    cliffCornerX: -1.35,
    cliffCornerY: -0.05,
    cliffRockUvX: 0.55,
    cliffRockUvY: 0.65,
    cliffWarm: 0.62,
    flagScale: 2.85,
    flagPoleUvX: 0.7,
    flagPoleUvY: 0.05,
    flagOffsetX: -0.04,
    flagOffsetY: 0.02,
    flagOffsetZ: 1.0,
    flagWarm: 0.82,
    sunDirX: 0.82,
    sunDirY: 0.22,
    sunGlowX: 14,
    sunGlowY: 124,
    sunGlowZ: -155,
    sunGlowScale: 86,
    sunGlowIntensity: 1.35,
    sunGlowColor: '#fff3c7',
    sunGlowHaloColor: '#f2a86d',
  },
  'Cloud Sea Wow': {
    skyZ: -215,
    skyY: 128,
    skyW: 1600,
    skyH: 820,
    skyFbmScale: 1.8,
    cloudY: 30,
    cloudZ: -82,
    cloudSize: 1000,
    cloudHeight: 120,
    cloudFbmScale: 1.15,
    cloudDriftSpeed: 0.75,
    cloudOpacity: 0.24,
    cloudCoverage: 0.42,
    cloudContrast: 1.5,
    cloudRimStrength: 1.45,
    cloudShadowStrength: 0.5,
    cloudForegroundY: 6,
    cloudForegroundZ: -36,
    cloudForegroundSize: 1080,
    cloudForegroundHeight: 92,
    cloudForegroundOpacity: 0.12,
    cloudForegroundCoverage: 0.34,
    cloudHorizonColor: '#c0c9d4',
    cloudImageX: -16,
    cloudImageY: 110,
    cloudImageZ: -154,
    cloudImageW: 350,
    cloudImageH: 197,
    cloudImageOpacity: 1,
    cloudImageNearX: -16,
    cloudImageNearY: 12,
    cloudImageNearZ: -42,
    cloudImageNearW: 264,
    cloudImageNearH: 127,
    cloudImageNearOpacity: 0.36,
    cliffZ: -2,
    cliffW: 7.8,
    cliffH: 4.25,
    cliffCornerX: -1.45,
    cliffCornerY: -0.08,
    cliffRockUvX: 0.55,
    cliffRockUvY: 0.65,
    cliffWarm: 0.68,
    flagScale: 2.9,
    flagPoleUvX: 0.7,
    flagPoleUvY: 0.05,
    flagOffsetX: -0.04,
    flagOffsetY: 0.02,
    flagOffsetZ: 1.0,
    flagWarm: 0.88,
    sunDirX: 0.78,
    sunDirY: 0.28,
    sunGlowX: 10,
    sunGlowY: 126,
    sunGlowZ: -160,
    sunGlowScale: 104,
    sunGlowIntensity: 1.55,
    sunGlowColor: '#fff4cf',
    sunGlowHaloColor: '#ef9d66',
  },
  'Crisp Summit': {
    skyZ: -195,
    skyY: 124,
    skyW: 1400,
    skyH: 700,
    skyFbmScale: 2.8,
    cloudY: 24,
    cloudZ: -72,
    cloudSize: 760,
    cloudHeight: 90,
    cloudFbmScale: 1.8,
    cloudDriftSpeed: 0.45,
    cloudOpacity: 0.12,
    cloudCoverage: 0.3,
    cloudContrast: 1.25,
    cloudRimStrength: 0.95,
    cloudShadowStrength: 0.35,
    cloudForegroundY: 2,
    cloudForegroundZ: -44,
    cloudForegroundSize: 780,
    cloudForegroundHeight: 68,
    cloudForegroundOpacity: 0.04,
    cloudForegroundCoverage: 0.22,
    cloudHorizonColor: '#b8c4d8',
    cloudImageX: -14,
    cloudImageY: 106,
    cloudImageZ: -148,
    cloudImageW: 300,
    cloudImageH: 169,
    cloudImageOpacity: 1,
    cloudImageNearX: -14,
    cloudImageNearY: 8,
    cloudImageNearZ: -46,
    cloudImageNearW: 224,
    cloudImageNearH: 108,
    cloudImageNearOpacity: 0.24,
    cliffZ: -2,
    cliffW: 7.4,
    cliffH: 4.1,
    cliffCornerX: -1.25,
    cliffCornerY: -0.02,
    cliffRockUvX: 0.55,
    cliffRockUvY: 0.65,
    cliffWarm: 0.58,
    flagScale: 2.75,
    flagPoleUvX: 0.7,
    flagPoleUvY: 0.05,
    flagOffsetX: -0.04,
    flagOffsetY: 0.02,
    flagOffsetZ: 1.0,
    flagWarm: 0.78,
    sunDirX: 0.9,
    sunDirY: 0.12,
    sunGlowX: 20,
    sunGlowY: 123,
    sunGlowZ: -150,
    sunGlowScale: 68,
    sunGlowIntensity: 1.1,
    sunGlowColor: '#fff1c2',
    sunGlowHaloColor: '#f4b072',
  },
} as const;

type SummitPresetName = keyof typeof SUMMIT_PRESETS;

function SummitSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(false);
  const sunPulse = useRef(0);
  const appliedDefaultPreset = useRef(false);
  // Cliff publishes its rock-surface world position here every frame so the
  // flag sprite can anchor to it without recomputing the corner pin.
  const cliffAnchor = useRef<{ x: number; y: number; z: number } | null>(null);
  const summit = MODULE_TIMELINE.summit;

  const defaultSummitPreset = SUMMIT_PRESETS[SUMMIT_PRESET_DEFAULT];
  const [controls, setSummitControls] = useControls(
    'Home Summit',
    () => ({
      // Dawn sky
      skyZ: { value: defaultSummitPreset.skyZ, min: -260, max: -80, step: 1 },
      skyY: { value: defaultSummitPreset.skyY, min: 60, max: 160, step: 1 },
      skyW: { value: defaultSummitPreset.skyW, min: 400, max: 2000, step: 10 },
      skyH: { value: defaultSummitPreset.skyH, min: 200, max: 1200, step: 10 },
      skyFbmScale: { value: defaultSummitPreset.skyFbmScale, min: 0.5, max: 8.0, step: 0.1 },
      // Cloud sea — layered horizon carpet + closer rolling lip
      cloudY: { value: defaultSummitPreset.cloudY, min: -40, max: 130, step: 1 },
      cloudZ: { value: defaultSummitPreset.cloudZ, min: -200, max: 80, step: 1 },
      cloudSize: { value: defaultSummitPreset.cloudSize, min: 200, max: 3000, step: 20 },
      cloudHeight: { value: defaultSummitPreset.cloudHeight, min: 80, max: 700, step: 10 },
      cloudFbmScale: { value: defaultSummitPreset.cloudFbmScale, min: 0.6, max: 3.5, step: 0.05 },
      cloudDriftSpeed: { value: defaultSummitPreset.cloudDriftSpeed, min: 0, max: 4.0, step: 0.05 },
      cloudOpacity: { value: defaultSummitPreset.cloudOpacity, min: 0, max: 1, step: 0.01 },
      cloudCoverage: { value: defaultSummitPreset.cloudCoverage, min: 0, max: 1, step: 0.01 },
      cloudContrast: { value: defaultSummitPreset.cloudContrast, min: 0.5, max: 3.2, step: 0.02 },
      cloudRimStrength: { value: defaultSummitPreset.cloudRimStrength, min: 0, max: 4, step: 0.05 },
      cloudShadowStrength: { value: defaultSummitPreset.cloudShadowStrength, min: 0, max: 1.5, step: 0.02 },
      cloudForegroundY: { value: defaultSummitPreset.cloudForegroundY, min: -40, max: 130, step: 1 },
      cloudForegroundZ: { value: defaultSummitPreset.cloudForegroundZ, min: -120, max: 80, step: 1 },
      cloudForegroundSize: { value: defaultSummitPreset.cloudForegroundSize, min: 120, max: 2600, step: 10 },
      cloudForegroundHeight: { value: defaultSummitPreset.cloudForegroundHeight, min: 60, max: 600, step: 5 },
      cloudForegroundOpacity: { value: defaultSummitPreset.cloudForegroundOpacity, min: 0, max: 1, step: 0.01 },
      cloudForegroundCoverage: { value: defaultSummitPreset.cloudForegroundCoverage, min: 0, max: 1, step: 0.01 },
      // Generated cloud plates — painterly opaque shape, with shader clouds as atmosphere.
      cloudHorizonColor: { value: defaultSummitPreset.cloudHorizonColor },
      cloudImageX: { value: defaultSummitPreset.cloudImageX, min: -100, max: 100, step: 0.5 },
      cloudImageY: { value: defaultSummitPreset.cloudImageY, min: -20, max: 180, step: 0.5 },
      cloudImageZ: { value: defaultSummitPreset.cloudImageZ, min: -260, max: -20, step: 1 },
      cloudImageW: { value: defaultSummitPreset.cloudImageW, min: 80, max: 520, step: 2 },
      cloudImageH: { value: defaultSummitPreset.cloudImageH, min: 30, max: 260, step: 1 },
      cloudImageOpacity: { value: defaultSummitPreset.cloudImageOpacity, min: 0, max: 1, step: 0.01 },
      cloudImageNearX: { value: defaultSummitPreset.cloudImageNearX, min: -100, max: 100, step: 0.5 },
      cloudImageNearY: { value: defaultSummitPreset.cloudImageNearY, min: -40, max: 140, step: 0.5 },
      cloudImageNearZ: { value: defaultSummitPreset.cloudImageNearZ, min: -120, max: 20, step: 1 },
      cloudImageNearW: { value: defaultSummitPreset.cloudImageNearW, min: 60, max: 420, step: 2 },
      cloudImageNearH: { value: defaultSummitPreset.cloudImageNearH, min: 20, max: 220, step: 1 },
      cloudImageNearOpacity: { value: defaultSummitPreset.cloudImageNearOpacity, min: 0, max: 1, step: 0.01 },
      // Cliff — bottom-left foreground ledge, anchored to viewport corner
      cliffZ: { value: defaultSummitPreset.cliffZ, min: -10, max: 6, step: 0.25 },
      cliffW: { value: defaultSummitPreset.cliffW, min: 1, max: 14, step: 0.05 },
      cliffH: { value: defaultSummitPreset.cliffH, min: 0.6, max: 9, step: 0.05 },
      cliffCornerX: { value: defaultSummitPreset.cliffCornerX, min: -4, max: 6, step: 0.05 },
      cliffCornerY: { value: defaultSummitPreset.cliffCornerY, min: -1, max: 3, step: 0.05 },
      // Where the visible rock surface sits in the cliff texture (UV space).
      // Asset-specific — the `cliff.webp` rock-top sits around (0.55, 0.65).
      cliffRockUvX: { value: defaultSummitPreset.cliffRockUvX, min: 0, max: 1, step: 0.01 },
      cliffRockUvY: { value: defaultSummitPreset.cliffRockUvY, min: 0, max: 1, step: 0.01 },
      cliffWarm: { value: defaultSummitPreset.cliffWarm, min: 0, max: 1, step: 0.01 },
      // Flag — closing-beat sprite anchored to the cliff's rock-surface point
      flagScale: { value: defaultSummitPreset.flagScale, min: 0.2, max: 8, step: 0.05 },
      // Where the pole base sits in the flag texture (UV space). Asset has
      // pole base at the bottom-right cluster of rocks: ≈ (0.70, 0.05).
      flagPoleUvX: { value: defaultSummitPreset.flagPoleUvX, min: 0, max: 1, step: 0.01 },
      flagPoleUvY: { value: defaultSummitPreset.flagPoleUvY, min: 0, max: 1, step: 0.01 },
      // Fine-tune offsets from the cliff anchor, in world units.
      flagOffsetX: { value: defaultSummitPreset.flagOffsetX, min: -2, max: 2, step: 0.02 },
      flagOffsetY: { value: defaultSummitPreset.flagOffsetY, min: -1, max: 1, step: 0.02 },
      flagOffsetZ: { value: defaultSummitPreset.flagOffsetZ, min: -2, max: 4, step: 0.05 },
      flagWarm: { value: defaultSummitPreset.flagWarm, min: 0, max: 1, step: 0.01 },
      // Sun — low-right, just-risen rake
      sunDirX: { value: defaultSummitPreset.sunDirX, min: -1, max: 1, step: 0.02 },
      sunDirY: { value: defaultSummitPreset.sunDirY, min: -1, max: 1, step: 0.02 },
      // Visible sun glow halo — sits behind mid ridge so the peak silhouettes
      // against the bright disc; only the broad halo bleeds around the edge.
      sunGlowX: { value: defaultSummitPreset.sunGlowX, min: -60, max: 60, step: 0.5 },
      sunGlowY: { value: defaultSummitPreset.sunGlowY, min: 60, max: 200, step: 0.5 },
      sunGlowZ: { value: defaultSummitPreset.sunGlowZ, min: -260, max: -60, step: 1 },
      sunGlowScale: { value: defaultSummitPreset.sunGlowScale, min: 10, max: 200, step: 1 },
      sunGlowIntensity: { value: defaultSummitPreset.sunGlowIntensity, min: 0, max: 2.5, step: 0.05 },
      sunGlowColor: { value: defaultSummitPreset.sunGlowColor },
      sunGlowHaloColor: { value: defaultSummitPreset.sunGlowHaloColor },
    }),
    { collapsed: true },
  );

  useControls('Home Summit Presets', {
    preset: {
      options: Object.keys(SUMMIT_PRESETS),
      value: SUMMIT_PRESET_DEFAULT,
      onChange: (value: string) => {
        const preset = SUMMIT_PRESETS[value as SummitPresetName];
        if (preset) setSummitControls(preset);
      },
    },
  });

  useEffect(() => {
    if (appliedDefaultPreset.current) return;
    appliedDefaultPreset.current = true;
    setSummitControls(SUMMIT_PRESETS[SUMMIT_PRESET_DEFAULT]);
  }, [setSummitControls]);

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('summit', p);
    isActive.current = opacity > 0;

    // Single hero dial — uSunPulse ramps 0→1 across summit's enter window
    // (0.86→0.92), then holds at 1. Dawn arrives and stays.
    const span = summit.enterEnd - summit.enterStart;
    const raw = span > 0 ? Math.min(1, Math.max(0, (p - summit.enterStart) / span)) : 1;

    // Luxurious Ease-In-Out (Cubic) for a very smooth dawn transition
    sunPulse.current = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  const sunDir: [number, number] = [controls.sunDirX, controls.sunDirY];

  return (
    <group ref={groupRef}>
      {/* Painted dawn-sky backdrop — sits behind the far ridge */}
      <DawnSky
        isActive={isActive}
        fbmScale={controls.skyFbmScale}
        sunPulseRef={sunPulse}
        position={[0, controls.skyY, controls.skyZ]}
        scale={[controls.skyW, controls.skyH]}
      />

      {/* Visible sun halo — sits behind the mid ridge so the peak silhouettes
          against it. Center gets occluded; halo bleeds around the edge. */}
      <DawnSun
        position={[controls.sunGlowX, controls.sunGlowY, controls.sunGlowZ]}
        scale={[controls.sunGlowScale, controls.sunGlowScale]}
        sunPulseRef={sunPulse}
        intensity={controls.sunGlowIntensity}
        sunColor={controls.sunGlowColor}
        haloColor={controls.sunGlowHaloColor}
      />

      {/* Generated distant peak + cloud-bank plate — replaces the dominant old ridge image. */}
      <SummitCloudImage
        url="/summit/cloud-peak.webp"
        position={[controls.cloudImageX, controls.cloudImageY, controls.cloudImageZ]}
        scale={[controls.cloudImageW, controls.cloudImageH]}
        opacity={controls.cloudImageOpacity}
        renderOrder={3}
      />

      {/* Cloud sea — horizontal painted carpet, sun-coupled crests + horizon fog */}
      <CloudSea
        isActive={isActive}
        scrollProgress={scrollProgress}
        sunPulseRef={sunPulse}
        position={[0, controls.cloudY, controls.cloudZ]}
        size={controls.cloudSize}
        planeScale={[controls.cloudSize, controls.cloudHeight]}
        rotationX={0}
        fbmScale={controls.cloudFbmScale}
        driftSpeed={controls.cloudDriftSpeed}
        coverage={controls.cloudCoverage}
        contrast={controls.cloudContrast}
        rimStrength={controls.cloudRimStrength}
        shadowStrength={controls.cloudShadowStrength}
        opacity={controls.cloudOpacity}
        sunDir={sunDir}
        horizonColor={controls.cloudHorizonColor}
      />

      {/* Closer generated cloud lip, kept behind the cliff/flag foreground. */}
      <SummitCloudImage
        url="/summit/cloud-sea.webp"
        position={[controls.cloudImageNearX, controls.cloudImageNearY, controls.cloudImageNearZ]}
        scale={[controls.cloudImageNearW, controls.cloudImageNearH]}
        opacity={controls.cloudImageNearOpacity}
        renderOrder={4}
      />

      {/* Foreground cloud lip — closer, partial coverage, parallaxed by scroll. */}
      <CloudSea
        isActive={isActive}
        scrollProgress={scrollProgress}
        sunPulseRef={sunPulse}
        position={[0, controls.cloudForegroundY, controls.cloudForegroundZ]}
        size={controls.cloudForegroundSize}
        planeScale={[controls.cloudForegroundSize, controls.cloudForegroundHeight]}
        rotationX={0}
        fbmScale={controls.cloudFbmScale * 1.35}
        driftSpeed={controls.cloudDriftSpeed * 1.45}
        coverage={controls.cloudForegroundCoverage}
        contrast={controls.cloudContrast * 1.12}
        rimStrength={controls.cloudRimStrength * 1.2}
        shadowStrength={controls.cloudShadowStrength}
        opacity={controls.cloudForegroundOpacity}
        sunDir={sunDir}
        horizonColor={controls.cloudHorizonColor}
      />

      {/* Cliff — bottom-left foreground ledge, anchored to viewport corner */}
      <SunRakeForegroundCliff
        textureUrl="/summit/cliff.webp"
        z={controls.cliffZ}
        scale={[controls.cliffW, controls.cliffH]}
        cornerOffsetX={controls.cliffCornerX}
        cornerOffsetY={controls.cliffCornerY}
        rockSurfaceUv={[controls.cliffRockUvX, controls.cliffRockUvY]}
        sunPulseRef={sunPulse}
        sunDir={sunDir}
        warmStrength={controls.cliffWarm}
        anchorRef={cliffAnchor}
      />

      {/* Summit flag — closing-beat hero object planted on the cliff's rock
          surface anchor (published by SunRakeForegroundCliff each frame). */}
      <SunRakeFlagSprite
        textureUrl="/summit/flag.webp"
        scale={[controls.flagScale, controls.flagScale]}
        anchorOffsetX={controls.flagOffsetX}
        anchorOffsetY={controls.flagOffsetY}
        anchorOffsetZ={controls.flagOffsetZ}
        poleBaseUv={[controls.flagPoleUvX, controls.flagPoleUvY]}
        cliffAnchorRef={cliffAnchor}
        sunPulseRef={sunPulse}
        sunDir={sunDir}
        warmStrength={controls.flagWarm}
      />
    </group>
  );
}

// =============================================================================
// ROOT EXPORT: UnifiedScene
// One Canvas, all scenes inside. Used by HomeClient via dynamic import.
// =============================================================================

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export default function UnifiedScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const webglSupported = useWebGLSupport();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Tab visibility — pause rendering when the tab is hidden (Phase 6.20 GPU pause)
  const [isHidden, setIsHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  // Pause render loop while the user is navigating away (brush wash overlay covers us)
  const transitionState = useAppStore((s) => s.transitionState);
  const isPaused = isHidden || transitionState === 'entering';
  const scrollVelocity = useRef(0);
  const lastProgress = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const onVisibility = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (v) => {
      scrollVelocity.current = Math.abs(v - lastProgress.current) * 60;
      lastProgress.current = v;
    });
    return unsubscribe;
  }, [scrollProgress]);

  // Static fallback for reduced-motion OR no-WebGL (Phase 6.21).
  // Treat unresolved (null) as supported to avoid a flash during first paint.
  if (prefersReducedMotion || webglSupported === false) {
    return (
      <div className="fixed inset-0 z-0">
        <img src="/bg_layer.webp" alt="Mountain landscape" className="w-full h-full object-cover opacity-30" />
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 50 }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      frameloop={isPaused ? 'demand' : 'always'}
    >
      <Suspense fallback={null}>
        <QualityMonitor />
        <ambientLight intensity={0.6} />
        <UnifiedCamera scrollProgress={scrollProgress} />

        <HeroSceneGroup scrollProgress={scrollProgress} />
        <ForestSceneGroup scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />
        <CampSceneGroup scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />
        <TrailForkSceneGroup scrollProgress={scrollProgress} />
        <AlpineSceneGroup scrollProgress={scrollProgress} />
        <SummitSceneGroup scrollProgress={scrollProgress} />

        <UnifiedPostProcessing scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
