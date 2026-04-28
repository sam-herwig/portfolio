/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace, react-hooks/immutability, react-hooks/purity, @next/next/no-img-element */
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useTexture, Points, PointMaterial } from '@react-three/drei';
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
  Vector3,
  MeshBasicMaterial,
  PointsMaterial,
  BufferAttribute,
  AmbientLight,
  Color,
  MirroredRepeatWrapping,
  MathUtils,
  AdditiveBlending,
  PerspectiveCamera,
} from 'three';
import PostProcessingStack from './PostProcessingStack';
import QualityMonitor from './QualityMonitor';
import { useQualityStore, qualityPresets } from '@/lib/quality';
import './shaders/WoodcutMaterial';
import './shaders/FireHaloMaterial';
import './shaders/SilhouetteWarmMaterial';
import './shaders/SilhouetteSunRakeMaterial';
import './shaders/SumiSkyMaterial';
import './shaders/DawnSkyMaterial';
import './shaders/DawnSunMaterial';
import './shaders/CloudSeaMaterial';
import './shaders/AlpineHazeMaterial';
import './shaders/GroundMaterial';
import './shaders/NightAtmosphereMaterial';
import DeepForest from './DeepForest';
import { MODULE_TIMELINE, sceneVisible, sceneOpacity, sceneChildRanges } from '@/lib/moduleTimeline';
import { configureSpriteSheetTexture, setSpriteSheetFrame } from '@/lib/spriteSheetTexture';

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
const FireHaloShader = 'fireHaloShaderMaterial' as any;
const SilhouetteWarmShader = 'silhouetteWarmShaderMaterial' as any;
const SilhouetteSunRakeShader = 'silhouetteSunRakeShaderMaterial' as any;
const SumiSkyShader = 'sumiSkyShaderMaterial' as any;
const DawnSkyShader = 'dawnSkyShaderMaterial' as any;
const CloudSeaShader = 'cloudSeaShaderMaterial' as any;
const AlpineHazeShader = 'alpineHazeShaderMaterial' as any;
const DawnSunShader = 'dawnSunShaderMaterial' as any;
const GroundShader = 'groundShaderMaterial' as any;
const NightAtmosphereShader = 'nightAtmosphereMaterial' as any;
const DEFAULT_WATERCOLOR_WASH = '#38aeea';
const DEFAULT_WATERCOLOR_WARM = '#ffcc00';
declare global {
  namespace JSX {
    interface IntrinsicElements {
      woodcutShaderMaterial: any;
      fireHaloShaderMaterial: any;
      silhouetteWarmShaderMaterial: any;
      silhouetteSunRakeShaderMaterial: any;
      sumiSkyShaderMaterial: any;
      dawnSkyShaderMaterial: any;
      dawnSunShaderMaterial: any;
      cloudSeaShaderMaterial: any;
      groundShaderMaterial: any;
      nightAtmosphereMaterial: any;
    }
  }
}

// =============================================================================
// UNIFIED CAMERA
// Single camera controller blending all 5 zone behaviours.
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
    const alpine = MODULE_TIMELINE.alpine;
    const summit = MODULE_TIMELINE.summit;

    // Hero zone: z 20->-28, y 0->4, rotX 0->0.15
    const heroP = Math.min(1, Math.max(0, p / hero.exitEnd));
    const heroX = 0;
    const heroY = MathUtils.lerp(0, 4, heroP);
    const heroZ = MathUtils.lerp(20, -28, heroP);
    const heroRX = MathUtils.lerp(0, 0.15, heroP);

    // Forest zone: z -28->-90 (starts where hero ends), walk sway on X/Y, rotX=0.1
    const forestSpan = forest.ownEnd - forest.ownStart;
    const forestP = Math.min(1, Math.max(0, (p - forest.ownStart) / forestSpan));
    const forestX = Math.sin(forestP * Math.PI * 10) * 0.5;
    const forestY = Math.abs(Math.sin(forestP * Math.PI * 10)) * 0.5;
    const forestZ = MathUtils.lerp(-28, -90, forestP);
    const forestRX = 0.1;

    // Camp zone: sway on X (clock), y -10->15, z 30->-10
    const campSpan = camp.ownEnd - camp.ownStart;
    const campP = Math.min(1, Math.max(0, (p - camp.ownStart) / campSpan));
    const campX = Math.sin(state.clock.elapsedTime * 0.5) * 1.5;
    const campY = MathUtils.lerp(-10, 15, campP);
    const campZ = MathUtils.lerp(30, -10, campP);
    const campRX = 0;

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

    const tot = hw + fw + cw + aw + sw || 1;
    const inv = 1 / tot;

    camera.position.x = (heroX * hw + forestX * fw + campX * cw + alpineX * aw + summitX * sw) * inv;
    camera.position.y = (heroY * hw + forestY * fw + campY * cw + alpineY * aw + summitY * sw) * inv;
    camera.position.z = (heroZ * hw + forestZ * fw + campZ * cw + alpineZ * aw + summitZ * sw) * inv;
    camera.rotation.x = (heroRX * hw + forestRX * fw + campRX * cw + alpineRX * aw + summitRX * sw) * inv;
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
    const camp = MODULE_TIMELINE.camp;
    const targetBloom = p > camp.ownStart && p < camp.ownEnd ? 1.5 : 0;
    lerpedBloom.current = MathUtils.damp(lerpedBloom.current, targetBloom, 3, delta);
    if (Math.abs(lerpedBloom.current - lastSnap.current) > 0.1) {
      lastSnap.current = lerpedBloom.current;
      setBloomIntensity(lerpedBloom.current);
    }
  });

  return <PostProcessingStack bloomIntensity={bloomIntensity} />;
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
      materialRef.current.uWind = state.clock.elapsedTime * 0.5;
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

function HeroSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(true);

  const mousePos = useRef(new Vector2(0, 0));
  const touchMouse = useRef(new Vector2(10, 10));
  const touchTarget = useRef(new Vector2(10, 10));
  const [isMobile, setIsMobile] = useState(false);

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
      watercolor: folder({
        waterColor: { value: DEFAULT_WATERCOLOR_WASH },
        warmColor: { value: DEFAULT_WATERCOLOR_WARM },
        radius: { value: 0.35, min: 0.0, max: 1.2, step: 0.01 },
        washIntensity: { value: 1.4, min: 0.0, max: 1.4, step: 0.01 },
        edgePool: { value: 0.12, min: 0.0, max: 1.0, step: 0.01 },
        grainAmount: { value: 0.03, min: 0.0, max: 0.3, step: 0.005 },
        strength: { value: 0.01, min: 0.0, max: 0.2, step: 0.005 },
        noiseScale: { value: 15.0, min: 10.0, max: 200.0, step: 1.0 },
        speed: { value: 0.05, min: 0.0, max: 2.0, step: 0.05 },
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

  useFrame((_, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);

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

  return (
    <group ref={groupRef}>
      {/* Solid Paper Background */}
      <mesh position={[0, 0, -100]}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial color="#f9fafb" />
      </mesh>
      <Hero3DLayer
        textureUrl="/home-hero/02-mountains.webp"
        position={[composition.mX, composition.mY, composition.mZ]}
        scale={[composition.mW, composition.mH]}
        uPaperOpacity={0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        uRadius={composition.radius}
        uStrength={composition.strength}
        uNoiseScale={composition.noiseScale}
        uSpeed={composition.speed}
        uWashIntensity={composition.washIntensity}
        uEdgePool={composition.edgePool}
        uGrainAmount={composition.grainAmount}
        uColorWater={composition.waterColor}
        uColorWarm={composition.warmColor}
        scrollProgress={scrollProgress}
      />
      <Hero3DLayer
        textureUrl="/home-hero/04-forest.webp"
        position={[composition.fX, composition.fY, composition.fZ]}
        scale={[composition.fW, composition.fH]}
        uPaperOpacity={0}
        isActive={isActive}
        mousePos={mousePos}
        touchMouse={touchMouse}
        touchTarget={touchTarget}
        isMobile={isMobile}
        uRadius={composition.radius}
        uStrength={composition.strength}
        uNoiseScale={composition.noiseScale}
        uSpeed={composition.speed}
        uWashIntensity={composition.washIntensity}
        uEdgePool={composition.edgePool}
        uGrainAmount={composition.grainAmount}
        uColorWater={composition.waterColor}
        uColorWarm={composition.warmColor}
        scrollProgress={scrollProgress}
      />
    </group>
  );
}

// =============================================================================
// FOREST SCENE GROUP
// =============================================================================

function ForestSceneGroup({
  scrollProgress,
  scrollVelocity,
}: {
  scrollProgress: MotionValue<number>;
  scrollVelocity: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const opacity = sceneOpacity('forest', lerpedP.current);
      groupRef.current.visible = opacity > 0;

      if (groupRef.current.visible) {
        applyGroupOpacity(groupRef.current, opacity);
        const vel = Math.min(scrollVelocity.current * 30, 1.5);
        const wind = Math.sin(state.clock.elapsedTime * 2) * vel * 0.02;
        groupRef.current.rotation.x = MathUtils.damp(groupRef.current.rotation.x, wind, 4, delta);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <DeepForest scrollProgress={scrollProgress} />
    </group>
  );
}

// =============================================================================
// CAMP SCENE GROUP
// =============================================================================

function SumiSky({ isActive, fbmScale }: { isActive: React.MutableRefObject<boolean>; fbmScale: number }) {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (!isActive.current) return;
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uFbmScale = fbmScale;
    }
  });
  // Large plane covering the camp sky. z=-180 sits behind everything else in
  // the module (video ledge is at z=-250 but the sky should read as the
  // backdrop against the silhouettes at z=-40..+5).
  return (
    <mesh position={[0, 20, -180]} frustumCulled={false}>
      <planeGeometry args={[800, 400]} />
      <SumiSkyShader ref={matRef} transparent={false} depthWrite={true} />
    </mesh>
  );
}

function NightAtmosphere({
  isActive,
  scrollProgress,
}: {
  isActive: React.MutableRefObject<boolean>;
  scrollProgress: MotionValue<number>;
}) {
  const matRef = useRef<any>(null);
  const lerpedP = useRef(0);
  const camp = MODULE_TIMELINE.camp;

  useFrame((state, delta) => {
    if (!isActive.current) return;
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);

    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;

      // Calculate fog density based on scroll progress.
      // At enterStart (coming from forest), fog is thick (1.0).
      // By ownStart (settled at camp), fog thins out to reveal stars (0.1).
      const enterSpan = camp.ownStart - camp.enterStart;
      let density = 0.1;

      if (enterSpan > 0) {
        const raw = Math.min(1, Math.max(0, (lerpedP.current - camp.enterStart) / enterSpan));
        // Inverse lerp: 0 -> 1.0 (thick), 1 -> 0.1 (thin)
        density = MathUtils.lerp(1.0, 0.1, raw);
      }

      matRef.current.uFogDensity = density;
    }
  });

  // Placed slightly in front of SumiSky so it layers the fog over the stars.
  return (
    <mesh position={[0, 20, -170]} frustumCulled={false}>
      <planeGeometry args={[800, 400]} />
      <NightAtmosphereShader ref={matRef} transparent={true} depthWrite={false} uOpacity={0.8} />
    </mesh>
  );
}

function CampsiteGround({
  isActive,
  firePulse,
  fireAnchor,
  position,
  scale,
}: {
  isActive: React.MutableRefObject<boolean>;
  firePulse: React.MutableRefObject<number>;
  fireAnchor: [number, number, number];
  position: [number, number, number];
  scale: [number, number];
}) {
  const matRef = useRef<any>(null);
  const vecAnchor = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    if (!isActive.current) return;
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uFirePulse = firePulse.current;
      matRef.current.uFireAnchor = vecAnchor.set(...fireAnchor);
    }
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={scale} />
      <GroundShader
        ref={matRef}
        transparent={true}
        depthWrite={true}
        uInfluenceRadius={12.0}
        uWarmStrength={0.85}
        uHorizonFade={0.8}
      />
    </mesh>
  );
}

type EmberClusterProps = {
  count: number;
  color: string;
  size: number;
  opacity: number;
  life: number; // seconds to rise from base to top
  riseSpeed: number;
  spread: number; // horizontal drift radius
  coneWidth: number; // initial spawn radius
  scrollVelocity: React.MutableRefObject<number>;
  isActive: React.MutableRefObject<boolean>;
};

function EmberCluster({
  count,
  color,
  size,
  opacity,
  life,
  riseSpeed,
  spread,
  coneWidth,
  scrollVelocity,
  isActive,
}: EmberClusterProps) {
  const meshRef = useRef<THREEPoints>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * coneWidth;
      pos[i * 3 + 1] = -3 + Math.random() * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * coneWidth;
      vel[i * 3] = (Math.random() - 0.5) * spread;
      vel[i * 3 + 1] = riseSpeed * (0.7 + Math.random() * 0.6);
      vel[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return [pos, vel];
  }, [count, coneWidth, spread, riseSpeed]);

  useFrame((state, delta) => {
    if (!isActive.current) return;
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as BufferAttribute;
    const vel2 = Math.min(scrollVelocity.current * 30, 2);
    const emissionRate = 1 + vel2 * 2;

    const arr = posAttr.array as Float32Array;
    // Top-of-life y, derived from vertical speed × life — keeps the two
    // clusters visually distinct (hot = quick burst, cool = long drift).
    const topY = -3 + riseSpeed * life;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * delta * emissionRate;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta * emissionRate;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta * emissionRate;

      if (arr[i * 3 + 1] > topY) {
        arr[i * 3] = (Math.random() - 0.5) * coneWidth;
        arr[i * 3 + 1] = -3;
        arr[i * 3 + 2] = (Math.random() - 0.5) * coneWidth;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={opacity} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function CampSilhouette({
  url,
  position,
  scale,
  firePulse,
  fireAnchor,
  influenceRadius,
  warmStrength,
  opacity = 1,
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number];
  firePulse: React.MutableRefObject<number>;
  fireAnchor: [number, number, number];
  influenceRadius: number;
  warmStrength: number;
  opacity?: number;
}) {
  const tex = useTexture(url);
  const matRef = useRef<any>(null);

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uFirePulse = firePulse.current;
    matRef.current.uFireAnchor.set(fireAnchor[0], fireAnchor[1], fireAnchor[2]);
    matRef.current.uInfluenceRadius = influenceRadius;
    matRef.current.uWarmStrength = warmStrength;
    matRef.current.uOpacity = opacity;
  });

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <SilhouetteWarmShader ref={matRef} uTexture={tex} transparent depthWrite={true} />
    </mesh>
  );
}

function CampBillboard({
  url,
  position,
  scale,
  opacity = 1,
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
}) {
  const tex = useTexture(url);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity,
      }),
    [tex, opacity],
  );

  return (
    <mesh position={position} material={material} frustumCulled={false}>
      <planeGeometry args={scale} />
    </mesh>
  );
}

function FireHalo({
  position,
  scale,
  firePulse,
  radius,
  fbmScale,
  intensity,
}: {
  position: [number, number, number];
  scale: [number, number];
  firePulse: React.MutableRefObject<number>;
  radius: number;
  fbmScale: number;
  intensity: number;
}) {
  const matRef = useRef<any>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    matRef.current.uEmberPulse = firePulse.current;
    matRef.current.uRadius = radius;
    matRef.current.uFbmScale = fbmScale;
    matRef.current.uIntensity = intensity;
  });

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <FireHaloShader ref={matRef} transparent depthWrite={false} blending={AdditiveBlending} />
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
  const lightRef = useRef<AmbientLight>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(false);
  const firePulse = useRef(0);
  const colorNight = useMemo(() => new Color('#020617'), []);
  const colorFire = useMemo(() => new Color('#ea580c'), []);
  const camp = MODULE_TIMELINE.camp;

  const controls = useControls(
    'Home Camp',
    {
      tentX: { value: -11.0, min: -20, max: 20, step: 0.25 },
      tentY: { value: -2.75, min: -10, max: 10, step: 0.25 },
      tentZ: { value: -15, min: -40, max: 0, step: 1 },
      tentScale: { value: 20, min: 8, max: 80, step: 1 },
      branchX: { value: -22.5, min: -40, max: 40, step: 0.5 },
      branchY: { value: 9.0, min: -10, max: 20, step: 0.5 },
      branchZ: { value: 0.0, min: -20, max: 20, step: 0.5 },
      branchScale: { value: 43, min: 10, max: 120, step: 1 },
      ridgeY: { value: 20.0, min: -20, max: 20, step: 0.25 },
      ridgeZ: { value: -102, min: -200, max: -20, step: 1 },
      ridgeScale: { value: 250, min: 60, max: 600, step: 2 },
      moonX: { value: 60.0, min: -60, max: 60, step: 0.5 },
      moonY: { value: 40.0, min: 0, max: 40, step: 0.5 },
      moonZ: { value: -166, min: -220, max: -30, step: 1 },
      moonScale: { value: 41.0, min: 4, max: 60, step: 0.5 },
      moonOpacity: { value: 0.69, min: 0, max: 1, step: 0.01 },
      fireX: { value: 1.0, min: -20, max: 20, step: 0.25 },
      fireY: { value: -3.75, min: -10, max: 10, step: 0.25 },
      fireZ: { value: -17.5, min: -30, max: 0, step: 0.5 },
      fireScale: { value: 12.5, min: 2, max: 40, step: 0.5 },
      haloIntensity: { value: 2.2, min: 0.2, max: 3.0, step: 0.05 },
      haloRadius: { value: 0.48, min: 0.1, max: 0.5, step: 0.01 },
      haloFbmScale: { value: 3.4, min: 0.5, max: 8.0, step: 0.1 },
      haloScale: { value: 14, min: 2, max: 40, step: 0.5 },
      warmInfluence: { value: 28.0, min: 2.0, max: 80.0, step: 0.5 },
      warmStrength: { value: 0.35, min: 0.0, max: 1.0, step: 0.01 },
      groundPlateX: { value: -11.0, min: -30, max: 30, step: 0.5 },
      groundPlateY: { value: -11.0, min: -25, max: 5, step: 0.5 },
      groundPlateZ: { value: -60, min: -60, max: 5, step: 1 },
      groundPlateScale: { value: 65, min: 20, max: 180, step: 1 },
      groundPlateOpacity: { value: 0.28, min: 0, max: 1, step: 0.01 },
      underbrushX: { value: 6.0, min: -30, max: 30, step: 0.5 },
      underbrushY: { value: -10.5, min: -25, max: 5, step: 0.5 },
      underbrushZ: { value: 5, min: -30, max: 15, step: 1 },
      underbrushScale: { value: 96, min: 20, max: 200, step: 1 },
      underbrushOpacity: { value: 1, min: 0, max: 1, step: 0.01 },
      skyFbmScale: { value: 2.7, min: 0.5, max: 8.0, step: 0.1 },
      hotCount: { value: 72, min: 0, max: 120, step: 2 },
      coolCount: { value: 30, min: 0, max: 120, step: 2 },
    },
    { collapsed: true },
  );

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('camp', p);
    isActive.current = opacity > 0;

    // Damp the velocity-derived fire pulse; scroll bursts → halo + warm
    // tint breathe briefly, then settle.
    const rawPulse = Math.min(1, scrollVelocity.current * 30);
    firePulse.current = MathUtils.damp(firePulse.current, rawPulse, 6, delta);

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
    if (lightRef.current) {
      const mix = Math.min(1, Math.max(0, (p - camp.ownStart) / (camp.enterEnd - camp.ownStart)));
      lightRef.current.color.lerpColors(colorNight, colorFire, mix);
      lightRef.current.intensity = (0.2 + mix * 1.5) * opacity;
    }
  });

  const fireAnchor: [number, number, number] = [controls.fireX, controls.fireY, controls.fireZ];
  const tentPos: [number, number, number] = [controls.tentX, controls.tentY, controls.tentZ];
  // Halo sits just behind the fire silhouette so the painted flames stay crisp
  // while the additive glow pools around them.
  const haloPos: [number, number, number] = [controls.fireX, controls.fireY, controls.fireZ - 2];

  return (
    <group ref={groupRef}>
      <ambientLight ref={lightRef} intensity={0.2} color="#020617" />

      {/* Painted ink-wash sky */}
      <SumiSky isActive={isActive} fbmScale={controls.skyFbmScale} />

      {/* Volumetric fog layer */}
      <NightAtmosphere isActive={isActive} scrollProgress={scrollProgress} />

      {/* Moon anchor — an asset billboard, kept cool so the fire remains the warm focal point */}
      <CampBillboard
        url="/camp_moon.webp"
        position={[controls.moonX, controls.moonY, controls.moonZ]}
        scale={[controls.moonScale, controls.moonScale]}
        opacity={controls.moonOpacity}
      />

      {/* Distant treeline + peak shoulder — cold, no fire warm tint */}
      <CampSilhouette
        url="/camp/ridge.webp"
        position={[0, controls.ridgeY, controls.ridgeZ]}
        scale={[controls.ridgeScale, controls.ridgeScale * 0.375]}
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        influenceRadius={1.0}
        warmStrength={0.0}
      />

      {/* Authored campsite floor plate — procedural shader with pulsing fire light pool */}
      <CampsiteGround
        isActive={isActive}
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        position={[controls.groundPlateX, controls.groundPlateY, controls.groundPlateZ]}
        scale={[controls.groundPlateScale, controls.groundPlateScale * 1.13]}
      />

      {/* Foreground side-tree — repurposed branch asset, left edge of frame */}
      <CampSilhouette
        url="/camp/branch.webp"
        position={[controls.branchX, controls.branchY, controls.branchZ]}
        scale={[controls.branchScale, controls.branchScale * 0.56]}
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        influenceRadius={controls.warmInfluence * 0.6}
        warmStrength={controls.warmStrength * 0.8}
      />

      {/* Tent (mid-ground, nestled beside the fire) */}
      <CampSilhouette
        url="/camp/tent.webp"
        position={tentPos}
        scale={[controls.tentScale, controls.tentScale]}
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        influenceRadius={controls.warmInfluence}
        warmStrength={controls.warmStrength}
      />

      {/* Fire-glow halo billboard — sits behind the painted campfire */}
      <FireHalo
        position={haloPos}
        scale={[controls.haloScale, controls.haloScale]}
        firePulse={firePulse}
        radius={controls.haloRadius}
        fbmScale={controls.haloFbmScale}
        intensity={controls.haloIntensity}
      />

      {/* Campfire silhouette — painted flames with baked-in amber glow */}
      <CampSilhouette
        url="/camp/fire.webp"
        position={fireAnchor}
        scale={[controls.fireScale, controls.fireScale]}
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        influenceRadius={controls.warmInfluence * 1.2}
        warmStrength={controls.warmStrength * 1.2}
      />

      {/* Foreground underbrush — closest parallax frame, leaving an open path into camp */}
      <CampSilhouette
        url="/camp/generated/underbrush-frame.png"
        position={[controls.underbrushX, controls.underbrushY, controls.underbrushZ]}
        scale={[controls.underbrushScale, controls.underbrushScale * 1.13]}
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        influenceRadius={controls.warmInfluence * 0.9}
        warmStrength={controls.warmStrength * 0.9}
        opacity={controls.underbrushOpacity}
      />

      {/* Embers rise from the fire anchor. Parent group handles translation so
          EmberCluster keeps its simple origin-relative motion math. */}
      <group position={fireAnchor}>
        {/* Hot-fast embers — short life, tight cone, bright core */}
        <EmberCluster
          count={controls.hotCount}
          color="#fde68a"
          size={0.09}
          opacity={0.85}
          life={1.5}
          riseSpeed={1.6}
          spread={0.25}
          coneWidth={1.2}
          scrollVelocity={scrollVelocity}
          isActive={isActive}
        />

        {/* Cool-slow embers — long drift, warm amber, wider cone */}
        <EmberCluster
          count={controls.coolCount}
          color="#ea580c"
          size={0.07}
          opacity={0.55}
          life={3.5}
          riseSpeed={0.9}
          spread={0.45}
          coneWidth={2.2}
          scrollVelocity={scrollVelocity}
          isActive={isActive}
        />
      </group>
    </group>
  );
}

// =============================================================================
// ALPINE SCENE GROUP
// =============================================================================

function AlpineAnimatedSprite({
  textureUrl,
  startX,
  endX,
  y,
  z,
  scale,
  rotation = 0,
  frames = 8,
  cols = 8,
  rows = 1,
  frameInsetPx = 4,
  scrollStart,
  scrollEnd,
  cycles = 6,
  scrollProgress,
}: {
  textureUrl: string;
  startX: number;
  endX: number;
  y: number;
  z: number;
  scale: [number, number];
  rotation?: number;
  frames?: number;
  cols?: number;
  rows?: number;
  frameInsetPx?: number;
  scrollStart: number;
  scrollEnd: number;
  cycles?: number;
  scrollProgress: MotionValue<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<any>(null);
  const lerpedP = useRef(0);
  const playhead = useRef(0);

  const clonedTex = useMemo(() => {
    const c = configureSpriteSheetTexture(tex.clone());
    setSpriteSheetFrame(c, { frame: 0, cols, rows, insetPx: frameInsetPx });
    return c;
  }, [tex, cols, rows, frameInsetPx]);

  useEffect(() => {
    return () => {
      tex.dispose();
      clonedTex.dispose();
    };
  }, [tex, clonedTex]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const clamped = Math.min(1, Math.max(0, (lerpedP.current - scrollStart) / (scrollEnd - scrollStart)));
      meshRef.current.position.x = MathUtils.lerp(startX, endX, clamped);
      if (clamped > 0 && clamped < 1) {
        playhead.current = clamped * cycles * frames;
      } else if (clamped >= 1) {
        playhead.current = cycles * frames;
      } else {
        playhead.current = 0;
      }
      const frame = Math.floor(playhead.current) % frames;
      setSpriteSheetFrame(clonedTex, { frame, cols, rows, insetPx: frameInsetPx });
    }
  });

  return (
    <mesh ref={meshRef} position={[startX, y, z]} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={clonedTex} transparent depthWrite={true} alphaTest={0.5} />
    </mesh>
  );
}

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
}: {
  isActive: React.MutableRefObject<boolean>;
  altitudePulseRef: React.MutableRefObject<number>;
  position: [number, number, number];
  scale: [number, number];
  fbmScale: number;
}) {
  const matRef = useRef<any>(null);
  useFrame((state) => {
    if (!isActive.current) return;
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uFbmScale = fbmScale;
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
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
  range: readonly [number, number, number, number];
  lerpedP: React.RefObject<number>;
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
    groupRef.current.visible = opacity > 0;
    if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
  });

  return (
    <group ref={groupRef}>
      <RockLedge textureUrl={textureUrl} position={position} scale={scale} />
    </group>
  );
}

function AlpineSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(false);
  const altitudePulse = useRef(0);
  const cloudCoverage = useRef(0);
  const sunPulseZero = useRef(0);
  const alpine = MODULE_TIMELINE.alpine;
  const summit = MODULE_TIMELINE.summit;
  const ranges = useMemo(() => sceneChildRanges('alpine', 4), []);

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('alpine', p);
    isActive.current = opacity > 0;

    // Altitude pulse — couples to climb (alpine.enterStart → exitEnd).
    // Smoothstep-eased so the brightening feels graded, not linear.
    const altSpan = alpine.exitEnd - alpine.enterStart;
    const altRaw = altSpan > 0 ? Math.min(1, Math.max(0, (p - alpine.enterStart) / altSpan)) : 0;
    altitudePulse.current = altRaw * altRaw * (3.0 - 2.0 * altRaw);

    // Cloud coverage — alpine ramps 0 → 0.6 across its full window, then
    // hands off into Summit's full carpet (1.0) across the seam.
    let coverage: number;
    if (p < alpine.ownStart) coverage = 0;
    else if (p < alpine.exitStart)
      coverage = 0.6 * Math.min(1, (p - alpine.ownStart) / (alpine.exitStart - alpine.ownStart));
    else if (p < summit.ownStart)
      coverage = 0.6 + 0.4 * Math.min(1, (p - alpine.exitStart) / (summit.ownStart - alpine.exitStart));
    else coverage = 1.0;
    cloudCoverage.current = coverage;

    if (groupRef.current) {
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Painterly pre-dawn haze sky — replaces auto-panning alpine_wall */}
      <AlpineHaze
        isActive={isActive}
        altitudePulseRef={altitudePulse}
        position={[0, 60, -300]}
        scale={[1000, 500]}
        fbmScale={2.0}
      />

      {/* Far ridge silhouette — atmospheric, very pale, sets horizon */}
      <SunRakeSilhouette
        url="/alpine/ridge-far.webp"
        position={[0, 88, -260]}
        scale={[320, 179]}
        sunPulseRef={sunPulseZero}
        sunDir={[0.6, 0.5]}
        warmStrength={0}
      />

      {/* Mid ridge silhouette — definite peaks rising into view as user climbs */}
      <SunRakeSilhouette
        url="/alpine/ridge-mid.webp"
        position={[0, 100, -200]}
        scale={[360, 201]}
        sunPulseRef={sunPulseZero}
        sunDir={[0.6, 0.5]}
        warmStrength={0}
      />

      {/* Distant cloud sea — condenses across the climb, hands off to Summit's full carpet */}
      <CloudSea
        isActive={isActive}
        scrollProgress={scrollProgress}
        sunPulseRef={sunPulseZero}
        coverageRef={cloudCoverage}
        position={[0, 60, -180]}
        size={800}
        fbmScale={1.6}
        driftSpeed={0.4}
      />

      <SyncedRockLedge
        textureUrl="/alpine_ledge_left.webp"
        position={[-12, 0, -5]}
        scale={[25, 25]}
        range={ranges[0]}
        lerpedP={lerpedP}
      />
      <SyncedRockLedge
        textureUrl="/alpine_ledge_right.webp"
        position={[12, 30, -10]}
        scale={[25, 25]}
        range={ranges[1]}
        lerpedP={lerpedP}
      />
      <SyncedRockLedge
        textureUrl="/alpine_ledge_left_variant_2.webp"
        position={[-12, 60, -15]}
        scale={[25, 25]}
        range={ranges[2]}
        lerpedP={lerpedP}
      />
      <SyncedRockLedge
        textureUrl="/alpine_ledge_right_variant_2.webp"
        position={[12, 90, -20]}
        scale={[25, 25]}
        range={ranges[3]}
        lerpedP={lerpedP}
      />
      <AlpineAnimatedSprite
        textureUrl="/bird_sprite.webp"
        startX={-45}
        endX={45}
        y={105}
        z={-30}
        scrollStart={alpine.exitStart}
        scrollEnd={alpine.ownEnd}
        scale={[15, 15]}
        scrollProgress={scrollProgress}
        frames={12}
        cols={6}
        rows={2}
        cycles={8}
      />
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
  fbmScale,
  driftSpeed,
  sunDir,
  horizonColor,
}: {
  isActive: React.MutableRefObject<boolean>;
  scrollProgress: MotionValue<number>;
  sunPulseRef: React.MutableRefObject<number>;
  coverageRef?: React.MutableRefObject<number>;
  position: [number, number, number];
  size: number;
  fbmScale: number;
  driftSpeed: number;
  sunDir?: [number, number];
  horizonColor?: string;
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
      matRef.current.uCoverage = coverageRef ? coverageRef.current : 1.0;
      if (sunDir) {
        matRef.current.uSunDir.set(sunDir[0], sunDir[1]);
      }
      if (horizonColorObj) {
        matRef.current.uHorizonColor.copy(horizonColorObj);
      }
    }
  });
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[size, size]} />
      <CloudSeaShader ref={matRef} transparent depthWrite={false} />
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

// Project the screen-right edge ray onto a world-Z plane. Used to corner-pin
// the cliff and any closing-beat assets in the lower-right of the frame.
// Horizontal FOV is derived from the vertical FOV and aspect ratio.
function screenRightXAtZ(camera: PerspectiveCamera, z: number): number {
  const fovYRad = (camera.fov * Math.PI) / 180;
  const halfV = fovYRad / 2;
  const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
  const dirX = Math.sin(halfH);
  const dirZ = -Math.cos(halfH) * Math.cos(camera.rotation.x);
  if (Math.abs(dirZ) < 1e-4) return camera.position.x;
  const t = (z - camera.position.z) / dirZ;
  return camera.position.x + t * dirX;
}

// Corner-pinned cliff — anchors to the lower-right of the viewport at the
// cliff's z. cornerOffsetX / cornerOffsetY are small fine-tune offsets in
// world units (negative cornerOffsetX pulls the cliff inward from the right
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
      const screenRightX = screenRightXAtZ(cam, z);
      // Pin plane right-edge to viewport right-edge, plane bottom-edge to
      // viewport bottom-edge, with offsets for fine tune.
      const centerX = screenRightX - scale[0] / 2 + cornerOffsetX;
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
    <mesh ref={meshRef} position={[0, 0, z]} frustumCulled={false}>
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
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={scale} />
      <SilhouetteSunRakeShader ref={matRef} uTexture={tex} transparent depthWrite={true} />
    </mesh>
  );
}

function SummitSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const isActive = useRef(false);
  const sunPulse = useRef(0);
  // Cliff publishes its rock-surface world position here every frame so the
  // flag sprite can anchor to it without recomputing the corner pin.
  const cliffAnchor = useRef<{ x: number; y: number; z: number } | null>(null);
  const summit = MODULE_TIMELINE.summit;

  const controls = useControls(
    'Home Summit',
    {
      // Dawn sky
      skyZ: { value: -200, min: -260, max: -80, step: 1 },
      skyY: { value: 125, min: 60, max: 160, step: 1 },
      skyW: { value: 1400, min: 400, max: 2000, step: 10 },
      skyH: { value: 700, min: 200, max: 1200, step: 10 },
      skyFbmScale: { value: 2.4, min: 0.5, max: 8.0, step: 0.1 },
      // Cloud sea — sliver of horizon haze between cliff foreground and ridges
      cloudY: { value: 95, min: 0, max: 130, step: 1 },
      cloudZ: { value: -60, min: -200, max: 30, step: 1 },
      cloudSize: { value: 800, min: 200, max: 3000, step: 20 },
      cloudFbmScale: { value: 1.8, min: 0.4, max: 6.0, step: 0.1 },
      cloudDriftSpeed: { value: 0.6, min: 0, max: 4.0, step: 0.05 },
      // Far ridge — atmospheric whisper, dissolves into sky-color
      farX: { value: 22, min: -80, max: 80, step: 0.5 },
      farY: { value: 118, min: 60, max: 200, step: 0.5 },
      farZ: { value: -180, min: -300, max: -40, step: 1 },
      farScale: { value: 200, min: 100, max: 800, step: 2 },
      farWarm: { value: 0.0, min: 0, max: 1, step: 0.01 },
      // Light atmospheric tint only — the asset is already a layered watercolor
      // with built-in atmospheric perspective. High mix erases its detail.
      farAtmosphericMix: { value: 0.25, min: 0, max: 1, step: 0.01 },
      farAtmosphericColor: { value: '#b8c4d8' },
      // Mid ridge — hero peak, slight off-center for compositional balance
      midX: { value: 4, min: -60, max: 60, step: 0.5 },
      midY: { value: 128, min: 60, max: 200, step: 0.5 },
      midZ: { value: -110, min: -240, max: -30, step: 1 },
      midScale: { value: 220, min: 80, max: 600, step: 2 },
      midWarm: { value: 0.5, min: 0, max: 1, step: 0.01 },
      // Cliff — small lower-right accent corner, anchored to viewport corner
      cliffZ: { value: -2, min: -10, max: 6, step: 0.25 },
      cliffW: { value: 2.0, min: 0.5, max: 8, step: 0.05 },
      cliffH: { value: 1.1, min: 0.3, max: 6, step: 0.05 },
      cliffCornerX: { value: 0.0, min: -3, max: 1, step: 0.05 },
      cliffCornerY: { value: 0.0, min: -1, max: 3, step: 0.05 },
      // Where the visible rock surface sits in the cliff texture (UV space).
      // Asset-specific — the `cliff.webp` rock-top sits around (0.55, 0.65).
      cliffRockUvX: { value: 0.55, min: 0, max: 1, step: 0.01 },
      cliffRockUvY: { value: 0.65, min: 0, max: 1, step: 0.01 },
      cliffWarm: { value: 0.55, min: 0, max: 1, step: 0.01 },
      // Flag — closing-beat sprite anchored to the cliff's rock-surface point
      flagScale: { value: 1.6, min: 0.2, max: 6, step: 0.05 },
      // Where the pole base sits in the flag texture (UV space). Asset has
      // pole base at the bottom-right cluster of rocks: ≈ (0.70, 0.05).
      flagPoleUvX: { value: 0.7, min: 0, max: 1, step: 0.01 },
      flagPoleUvY: { value: 0.05, min: 0, max: 1, step: 0.01 },
      // Fine-tune offsets from the cliff anchor, in world units.
      flagOffsetX: { value: 0.0, min: -2, max: 2, step: 0.02 },
      flagOffsetY: { value: 0.0, min: -1, max: 1, step: 0.02 },
      flagOffsetZ: { value: 1.0, min: -2, max: 4, step: 0.05 },
      flagWarm: { value: 0.75, min: 0, max: 1, step: 0.01 },
      // Sun — low-right, just-risen rake
      sunDirX: { value: 0.85, min: -1, max: 1, step: 0.02 },
      sunDirY: { value: 0.15, min: -1, max: 1, step: 0.02 },
      // Visible sun glow halo — sits behind mid ridge so the peak silhouettes
      // against the bright disc; only the broad halo bleeds around the edge.
      sunGlowX: { value: 18, min: -60, max: 60, step: 0.5 },
      sunGlowY: { value: 122, min: 60, max: 200, step: 0.5 },
      sunGlowZ: { value: -150, min: -260, max: -60, step: 1 },
      sunGlowScale: { value: 55, min: 10, max: 200, step: 1 },
      sunGlowIntensity: { value: 1.0, min: 0, max: 2.5, step: 0.05 },
      sunGlowColor: { value: '#fff1c2' },
      sunGlowHaloColor: { value: '#f4b072' },
    },
    { collapsed: true },
  );

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

      {/* Distant ridge layer — atmospheric whisper, dissolves into sky-color */}
      <SunRakeSilhouette
        url="/summit/ridge-far.webp"
        position={[controls.farX, controls.farY, controls.farZ]}
        scale={[controls.farScale, controls.farScale / 1.79]}
        sunPulseRef={sunPulse}
        sunDir={sunDir}
        warmStrength={controls.farWarm}
        atmosphericMix={controls.farAtmosphericMix}
        atmosphericColor={controls.farAtmosphericColor}
      />

      {/* Hero ridge — single dominant peak, aspect-corrected (1.79) */}
      <SunRakeSilhouette
        url="/summit/ridge-mid.webp"
        position={[controls.midX, controls.midY, controls.midZ]}
        scale={[controls.midScale, controls.midScale / 1.79]}
        sunPulseRef={sunPulse}
        sunDir={sunDir}
        warmStrength={controls.midWarm}
      />

      {/* Cloud sea — horizontal painted carpet, sun-coupled crests + horizon fog */}
      <CloudSea
        isActive={isActive}
        scrollProgress={scrollProgress}
        sunPulseRef={sunPulse}
        position={[0, controls.cloudY, controls.cloudZ]}
        size={controls.cloudSize}
        fbmScale={controls.cloudFbmScale}
        driftSpeed={controls.cloudDriftSpeed}
        sunDir={sunDir}
        horizonColor={controls.farAtmosphericColor}
      />

      {/* Cliff — small lower-right accent corner, anchored to viewport corner */}
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
        <AlpineSceneGroup scrollProgress={scrollProgress} />
        <SummitSceneGroup scrollProgress={scrollProgress} />

        <UnifiedPostProcessing scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
