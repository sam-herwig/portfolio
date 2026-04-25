/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace, react-hooks/immutability, react-hooks/purity, @next/next/no-img-element */
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useTexture, useVideoTexture, Points, PointMaterial } from '@react-three/drei';
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
} from 'three';
import PostProcessingStack from './PostProcessingStack';
import QualityMonitor from './QualityMonitor';
import { useQualityStore, qualityPresets } from '@/lib/quality';
import './shaders/WoodcutMaterial';
import './shaders/FireHaloMaterial';
import './shaders/SilhouetteWarmMaterial';
import './shaders/SumiSkyMaterial';
import './shaders/GroundMaterial';
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
const SumiSkyShader = 'sumiSkyShaderMaterial' as any;
const GroundShader = 'groundShaderMaterial' as any;
const DEFAULT_WATERCOLOR_WASH = '#38aeea';
const DEFAULT_WATERCOLOR_WARM = '#f6c400';
declare global {
  namespace JSX {
    interface IntrinsicElements {
      woodcutShaderMaterial: any;
      fireHaloShaderMaterial: any;
      silhouetteWarmShaderMaterial: any;
      sumiSkyShaderMaterial: any;
      groundShaderMaterial: any;
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

    // Summit zone: static (0,0,20), rotX=0
    const summitX = 0;
    const summitY = 0;
    const summitZ = 20;
    const summitRX = 0;

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
    const sw = Math.max(
      0,
      Math.min(1, p < summit.ownStart ? 0 : (p - summit.ownStart) / (summit.enterEnd - summit.ownStart)),
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
        mX: { value: 1.0, min: -80, max: 80, step: 0.5 },
        mY: { value: 23.5, min: -20, max: 40, step: 0.5 },
        mZ: { value: -92, min: -200, max: -20, step: 1 },
        mW: { value: 207, min: 40, max: 400, step: 1 },
        mH: { value: 80, min: 10, max: 120, step: 1 },
      }),
      forest: folder({
        fX: { value: 0.0, min: -80, max: 80, step: 0.5 },
        fY: { value: -12.0, min: -40, max: 40, step: 0.5 },
        fZ: { value: -70, min: -200, max: -20, step: 1 },
        fW: { value: 150, min: 40, max: 400, step: 1 },
        fH: { value: 40, min: 10, max: 120, step: 1 },
      }),
      watercolor: folder({
        waterColor: { value: DEFAULT_WATERCOLOR_WASH },
        warmColor: { value: DEFAULT_WATERCOLOR_WARM },
        radius: { value: 0.57, min: 0.0, max: 1.2, step: 0.01 },
        washIntensity: { value: 1.4, min: 0.0, max: 1.4, step: 0.01 },
        edgePool: { value: 0.21, min: 0.0, max: 1.0, step: 0.01 },
        grainAmount: { value: 0.08, min: 0.0, max: 0.3, step: 0.005 },
        strength: { value: 0.12, min: 0.0, max: 0.2, step: 0.005 },
        noiseScale: { value: 27.0, min: 10.0, max: 200.0, step: 1.0 },
        speed: { value: 0.2, min: 0.0, max: 2.0, step: 0.05 },
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
}: {
  url: string;
  position: [number, number, number];
  scale: [number, number];
  firePulse: React.MutableRefObject<number>;
  fireAnchor: [number, number, number];
  influenceRadius: number;
  warmStrength: number;
}) {
  const tex = useTexture(url);
  const matRef = useRef<any>(null);

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uFirePulse = firePulse.current;
    matRef.current.uFireAnchor.set(fireAnchor[0], fireAnchor[1], fireAnchor[2]);
    matRef.current.uInfluenceRadius = influenceRadius;
    matRef.current.uWarmStrength = warmStrength;
  });

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <SilhouetteWarmShader ref={matRef} uTexture={tex} transparent depthWrite={true} />
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

function Ground({
  firePulse,
  fireAnchor,
  y,
  size,
  influenceRadius,
  warmStrength,
  isActive,
}: {
  firePulse: React.MutableRefObject<number>;
  fireAnchor: [number, number, number];
  y: number;
  size: number;
  influenceRadius: number;
  warmStrength: number;
  isActive: React.MutableRefObject<boolean>;
}) {
  const matRef = useRef<any>(null);

  useFrame((state) => {
    if (!isActive.current) return;
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    matRef.current.uFirePulse = firePulse.current;
    matRef.current.uFireAnchor.set(fireAnchor[0], fireAnchor[1], fireAnchor[2]);
    matRef.current.uInfluenceRadius = influenceRadius;
    matRef.current.uWarmStrength = warmStrength;
  });

  return (
    <mesh position={[0, y, -40]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[size, size]} />
      <GroundShader ref={matRef} transparent={false} depthWrite={true} />
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
      tentX: { value: -4, min: -20, max: 20, step: 0.25 },
      tentY: { value: -4, min: -10, max: 10, step: 0.25 },
      tentZ: { value: -15, min: -40, max: 0, step: 1 },
      tentScale: { value: 30, min: 8, max: 80, step: 1 },
      branchX: { value: -22, min: -40, max: 40, step: 0.5 },
      branchY: { value: 4, min: -10, max: 20, step: 0.5 },
      branchZ: { value: 0, min: -20, max: 20, step: 0.5 },
      branchScale: { value: 48, min: 10, max: 120, step: 1 },
      ridgeY: { value: -2, min: -20, max: 20, step: 0.25 },
      ridgeZ: { value: -80, min: -200, max: -20, step: 1 },
      ridgeScale: { value: 240, min: 60, max: 600, step: 2 },
      fireX: { value: 4, min: -20, max: 20, step: 0.25 },
      fireY: { value: -3, min: -10, max: 10, step: 0.25 },
      fireZ: { value: -12, min: -30, max: 0, step: 0.5 },
      fireScale: { value: 12, min: 2, max: 40, step: 0.5 },
      haloIntensity: { value: 1.3, min: 0.2, max: 3.0, step: 0.05 },
      haloRadius: { value: 0.48, min: 0.1, max: 0.5, step: 0.01 },
      haloFbmScale: { value: 2.4, min: 0.5, max: 8.0, step: 0.1 },
      haloScale: { value: 14, min: 2, max: 40, step: 0.5 },
      warmInfluence: { value: 28.0, min: 2.0, max: 80.0, step: 0.5 },
      warmStrength: { value: 0.35, min: 0.0, max: 1.0, step: 0.01 },
      groundY: { value: -6, min: -20, max: 0, step: 0.25 },
      groundSize: { value: 240, min: 60, max: 600, step: 2 },
      groundInfluence: { value: 9.0, min: 1.0, max: 40.0, step: 0.25 },
      groundWarmStrength: { value: 0.8, min: 0.0, max: 1.5, step: 0.02 },
      skyFbmScale: { value: 2.2, min: 0.5, max: 8.0, step: 0.1 },
      hotCount: { value: 30, min: 0, max: 120, step: 2 },
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

      {/* Ground — deep ink wash with fire-warm pool */}
      <Ground
        firePulse={firePulse}
        fireAnchor={fireAnchor}
        y={controls.groundY}
        size={controls.groundSize}
        influenceRadius={controls.groundInfluence}
        warmStrength={controls.groundWarmStrength}
        isActive={isActive}
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

function AlpineWall({
  textureUrl,
  position,
  scale,
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
}) {
  const tex = useTexture(textureUrl) as Texture;
  const clonedTex = useMemo(() => {
    const c = tex.clone();
    c.wrapS = MirroredRepeatWrapping;
    c.wrapT = MirroredRepeatWrapping;
    return c;
  }, [tex]);
  useEffect(() => {
    return () => {
      tex.dispose();
      clonedTex.dispose();
    };
  }, [tex, clonedTex]);
  useFrame((state, delta) => {
    clonedTex.offset.x -= delta * 0.05;
  });
  return (
    <mesh position={position}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={clonedTex} transparent depthWrite={false} alphaTest={0.5} />
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
  const alpine = MODULE_TIMELINE.alpine;
  const ranges = useMemo(() => sceneChildRanges('alpine', 4), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const opacity = sceneOpacity('alpine', lerpedP.current);
      groupRef.current.visible = opacity > 0;
    }
  });

  return (
    <group ref={groupRef}>
      <AlpineWall textureUrl="/alpine_wall.webp" position={[0, 80, -500]} scale={[1200, 1200]} />
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

function PanoramaLedge({
  textureUrl,
  position,
  scale,
  parallaxX = 0,
  scrollProgress,
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
  parallaxX?: number;
  scrollProgress: MotionValue<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const lerpedP = useRef(0);
  const summit = MODULE_TIMELINE.summit;

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const p = lerpedP.current;
      const animP = Math.min(1, Math.max(0, (p - summit.ownStart) / (summit.ownEnd - summit.ownStart)));
      // Match VideoPanoramaLedge timing: fade in 0.20→0.40, hold, fade out 0.55→0.70
      let opacity = 0;
      if (animP < 0.2) {
        opacity = 0;
      } else if (animP < 0.4) {
        opacity = Math.min(1, Math.max(0, (animP - 0.2) / 0.2));
      } else if (animP < 0.55) {
        opacity = 1;
      } else {
        opacity = 1 - Math.min(1, Math.max(0, (animP - 0.55) / 0.15));
      }
      const panP = Math.min(1, Math.max(0, (animP - 0.4) / 0.3));
      meshRef.current.position.x = position[0] - panP * 5;
      const mat = meshRef.current.material as MeshBasicMaterial;
      (mat as any).__selfManagedOpacity = true;
      mat.opacity = opacity;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} opacity={0} />
    </mesh>
  );
}

function useVideoCoverScale(
  position: [number, number, number],
  videoAspect = 16 / 9,
  overscan = 1.3,
): [number, number, number] {
  const { viewport, camera } = useThree();
  const posVec = useMemo(() => new Vector3(...position), [position]);
  const [scale, setScale] = useState<[number, number, number]>(() => {
    const cv = viewport.getCurrentViewport(camera, posVec);
    const sa = cv.width / cv.height;
    const w = sa > videoAspect ? cv.width : cv.height * videoAspect;
    const h = sa > videoAspect ? cv.width / videoAspect : cv.height;
    return [w * overscan, h * overscan, 1];
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const recalc = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const cv = viewport.getCurrentViewport(camera, posVec);
        const sa = cv.width / cv.height;
        const w = sa > videoAspect ? cv.width : cv.height * videoAspect;
        const h = sa > videoAspect ? cv.width / videoAspect : cv.height;
        setScale([w * overscan, h * overscan, 1]);
      }, 150);
    };
    window.addEventListener('resize', recalc);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', recalc);
    };
  }, [viewport, camera, posVec, videoAspect, overscan]);

  return scale;
}

function VideoPanoramaLedge({
  videoUrl,
  position,
  parallaxX = 0,
  playThreshold = 0.33,
  scrollProgress,
}: {
  videoUrl: string;
  position: [number, number, number];
  parallaxX?: number;
  playThreshold?: number;
  scrollProgress: MotionValue<number>;
}) {
  const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
  const meshRef = useRef<Mesh>(null);
  const summit = MODULE_TIMELINE.summit;
  const dynScale = useVideoCoverScale(position);

  const lerpedP = useRef(0);

  useEffect(() => {
    if (!tex?.image) return;
    const vid = tex.image as HTMLVideoElement;
    const unsub = scrollProgress.on('change', (v: number) => {
      const summitSpan = summit.ownEnd - summit.ownStart;
      const globalPlay = summit.ownStart + playThreshold * summitSpan;
      if (v > globalPlay && v <= summit.ownEnd) {
        if (vid.paused) vid.play().catch(() => {});
      } else {
        if (!vid.paused) {
          vid.pause();
          vid.currentTime = 0;
        }
      }
    });
    return () => {
      unsub();
      tex.dispose();
    };
  }, [tex, scrollProgress, summit.ownStart, summit.ownEnd, playThreshold]);

  useFrame((state, delta) => {
    if (meshRef.current && tex.image) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const p = lerpedP.current;
      const animP = Math.min(1, Math.max(0, (p - summit.ownStart) / (summit.ownEnd - summit.ownStart)));
      // Fade in: animP 0.20→0.40. Hold 0.40→0.55. Fade out: 0.55→0.70.
      let opacity = 0;
      if (animP < 0.2) {
        opacity = 0;
      } else if (animP < 0.4) {
        opacity = Math.min(1, Math.max(0, (animP - 0.2) / 0.2));
      } else if (animP < 0.55) {
        opacity = 1;
      } else {
        opacity = 1 - Math.min(1, Math.max(0, (animP - 0.55) / 0.15));
      }
      // Cinematic pan during hold + fade-out
      const panP = Math.min(1, Math.max(0, (animP - 0.4) / 0.3));
      meshRef.current.position.x = position[0] - panP * 5;
      const mat = meshRef.current.material as MeshBasicMaterial;
      (mat as any).__selfManagedOpacity = true;
      mat.opacity = opacity;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={dynScale} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0} />
    </mesh>
  );
}

function ForegroundLedge({
  textureUrl,
  scale,
  scrollProgress,
}: {
  textureUrl: string;
  scale: [number, number];
  scrollProgress: MotionValue<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const summit = MODULE_TIMELINE.summit;
  const lerpedP = useRef(0);
  const fgDepthVec = useMemo(() => new Vector3(0, 0, 8), []);
  const { viewport, camera } = useThree();

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const p = lerpedP.current;
      const animP = Math.min(1, Math.max(0, (p - summit.ownStart) / (summit.ownEnd - summit.ownStart)));
      // Fade in 0.00→0.20, hold 0.20→0.55, fade out 0.55→0.70
      let opacity = 0;
      if (animP < 0.2) {
        opacity = animP / 0.2;
      } else if (animP < 0.55) {
        opacity = 1;
      } else if (animP < 0.7) {
        opacity = 1 - (animP - 0.55) / 0.15;
      }
      const mat = meshRef.current.material as MeshBasicMaterial;
      (mat as any).__selfManagedOpacity = true;
      mat.opacity = opacity;
      // Pin to bottom of viewport based on current camera position
      const cv = viewport.getCurrentViewport(camera, fgDepthVec);
      meshRef.current.position.y = camera.position.y - cv.height / 2 + scale[1] / 2;
    }
  });

  return (
    <mesh ref={meshRef} position={[-3, 0, 8]}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} opacity={0} />
    </mesh>
  );
}

function OneShotAnimatedFox({
  textureUrl,
  startX,
  endX,
  startYOffset,
  endYOffset,
  startZ,
  endZ,
  scale,
  rotation = 0,
  frames = 8,
  cols = 8,
  rows = 1,
  frameInsetPx = 6,
  scrollStart,
  scrollEnd,
  cycles = 6,
  scrollProgress,
}: any) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const summit = MODULE_TIMELINE.summit;

  const clonedTex = useMemo(() => {
    const c = configureSpriteSheetTexture(tex.clone());
    setSpriteSheetFrame(c, { frame: 0, cols, rows, insetPx: frameInsetPx });
    return c;
  }, [tex, cols, rows, frameInsetPx]);

  const lerpedP = useRef(0);

  useEffect(() => {
    return () => {
      tex.dispose();
      clonedTex.dispose();
    };
  }, [tex, clonedTex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const p = lerpedP.current;
      const animP = Math.min(1, Math.max(0, (p - summit.ownStart) / (summit.ownEnd - summit.ownStart)));
      // Fox walks during animP 0.10→0.35 (after cliff is mostly in place)
      const walkProgress = Math.min(1, Math.max(0, (animP - 0.1) / 0.25));
      meshRef.current.position.x = MathUtils.lerp(startX, endX, walkProgress);

      // Fox vertical entry also starts at 0.10
      const flyProgress = Math.min(1, Math.max(0, (animP - 0.1) / 0.15));
      const easeOut = 1 - Math.pow(1 - flyProgress, 3);
      meshRef.current.position.y = MathUtils.lerp(startYOffset, endYOffset, easeOut);
      meshRef.current.position.z = endZ;

      if (walkProgress >= 1.0) {
        const lastFrame = frames - 1;
        setSpriteSheetFrame(clonedTex, { frame: lastFrame, cols, rows, insetPx: frameInsetPx });
      } else if (walkProgress > 0) {
        const totalFrames = walkProgress * cycles * frames;
        const currentFrame = Math.floor(totalFrames) % frames;
        setSpriteSheetFrame(clonedTex, { frame: currentFrame, cols, rows, insetPx: frameInsetPx });
      } else {
        setSpriteSheetFrame(clonedTex, { frame: 0, cols, rows, insetPx: frameInsetPx });
      }

      // Fade in 0.00→0.20, hold 0.20→0.55, fade out 0.55→0.70 (matches cliff)
      let foxOpacity = 0;
      if (animP < 0.2) {
        foxOpacity = animP / 0.2;
      } else if (animP < 0.55) {
        foxOpacity = 1;
      } else if (animP < 0.7) {
        foxOpacity = 1 - (animP - 0.55) / 0.15;
      }
      const mat = meshRef.current.material as MeshBasicMaterial;
      (mat as any).__selfManagedOpacity = true;
      mat.opacity = foxOpacity;
    }
  });

  return (
    <mesh ref={meshRef} position={[startX, startYOffset, startZ]} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={clonedTex} transparent depthWrite={true} alphaTest={0.5} opacity={0} />
    </mesh>
  );
}

function SummitSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const opacity = sceneOpacity('summit', lerpedP.current);
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  return (
    <group ref={groupRef}>
      <group>
        <VideoPanoramaLedge
          videoUrl="/assets/videos/summit_video.mp4"
          position={[0, 2, -40]}
          parallaxX={5}
          playThreshold={0.35}
          scrollProgress={scrollProgress}
        />
        <ForegroundLedge textureUrl="/cliff_edge.webp" scale={[18, 6]} scrollProgress={scrollProgress} />
        <OneShotAnimatedFox
          textureUrl="/fox_sprite.webp"
          startX={-12}
          endX={-3.5}
          startYOffset={-3}
          endYOffset={-3}
          startZ={9}
          endZ={9}
          scale={[3.5, 3.5]}
          frames={16}
          cols={4}
          rows={4}
          cycles={6}
          scrollStart={0.1}
          scrollEnd={0.35}
          scrollProgress={scrollProgress}
        />
      </group>
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
