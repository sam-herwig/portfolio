/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace, react-hooks/immutability, react-hooks/purity, @next/next/no-img-element */
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, useVideoTexture, Points, PointMaterial } from '@react-three/drei';
import { useRef, useEffect, Suspense, useMemo, useState } from 'react';
import React from 'react';
import { MotionValue } from 'framer-motion';
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
  RepeatWrapping,
  MirroredRepeatWrapping,
  MathUtils,
} from 'three';
import PostProcessingStack from './PostProcessingStack';
import './shaders/WoodcutMaterial';
import DeepForest from './DeepForest';
import { MODULE_TIMELINE, sceneVisible, sceneOpacity } from '@/lib/moduleTimeline';

// ── Scene envelope helper ─────────────────────────────────────────────
// Applies sceneOpacity as a multiplier on all materials in a group,
// preserving each material's base opacity (set on first encounter).
function applyGroupOpacity(group: Group, envelope: number): void {
  group.traverse((child) => {
    const mesh = child as Mesh | THREEPoints;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!('opacity' in mat)) continue;
      // Skip materials that manage their own opacity (e.g. video textures)
      if ((mat as any).__selfManagedOpacity) continue;
      // Store base opacity on first visit
      if ((mat as any).__baseOpacity === undefined) {
        (mat as any).__baseOpacity = mat.opacity;
      }
      mat.opacity = (mat as any).__baseOpacity * envelope;
      mat.transparent = true;
    }
  });
}

const WoodcutShader = 'woodcutShaderMaterial' as any;
declare global {
  namespace JSX {
    interface IntrinsicElements {
      woodcutShaderMaterial: any;
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

    // Alpine zone: z=15 fixed, y 0->120, climb sway, rotX=0.15
    const alpineSpan = alpine.ownEnd - alpine.ownStart;
    const alpineP = Math.min(1, Math.max(0, (p - alpine.ownStart) / alpineSpan));
    const alpineX = Math.sin(alpineP * Math.PI * 6) * 1.5;
    const alpineY = MathUtils.lerp(0, 120, alpineP);
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

function ParallaxLayer({
  textureUrl,
  z,
  baseY = 0,
  speed = 1,
  scrollProgress,
}: {
  textureUrl: string;
  z: number;
  baseY?: number;
  speed?: number;
  scrollProgress: MotionValue<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const { viewport, camera } = useThree();

  const cv = viewport.getCurrentViewport(camera, new Vector3(0, 0, z));
  const image = tex.image as { width?: number; height?: number } | undefined;
  const imageAspect = image?.width && image?.height ? image.width / image.height : 16 / 10;
  const viewportAspect = cv.width / cv.height;
  const containScale: [number, number] =
    imageAspect > viewportAspect
      ? [cv.width * 1.2, (cv.width * 1.2) / imageAspect]
      : [cv.height * 1.2 * imageAspect, cv.height * 1.2];

  const materialRef = useRef<any>(null);
  const meshRef = useRef<Mesh>(null);
  const lerpedP = useRef(0);
  const mousePos = useRef(new Vector2(0, 0));

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const heroEnd = MODULE_TIMELINE.hero.exitEnd;
    const heroProgress = Math.min(1, Math.max(0, lerpedP.current / heroEnd));

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uMouse.lerp(mousePos.current, 0.1);
    }
    if (meshRef.current) {
      const targetY = baseY + heroProgress * (10 * speed);
      meshRef.current.position.y = MathUtils.damp(meshRef.current.position.y, targetY, 5, delta);
      meshRef.current.rotation.x = MathUtils.lerp(meshRef.current.rotation.x, mousePos.current.y * 0.025, 0.05);
      meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, mousePos.current.x * 0.03, 0.05);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, baseY, z]}>
      <planeGeometry args={[containScale[0], containScale[1], 64, 64]} />
      <WoodcutShader ref={materialRef} transparent depthWrite={false} uTexture={tex} />
    </mesh>
  );
}

function HeroSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);

  useFrame((_, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    if (groupRef.current) {
      const opacity = sceneOpacity('hero', lerpedP.current);
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, -6]}>
      <ParallaxLayer textureUrl="/bg_layer.webp" z={-25} baseY={2} speed={0.35} scrollProgress={scrollProgress} />
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

function Starfield({ scrollVelocity }: { scrollVelocity: React.MutableRefObject<number> }) {
  const ref = useRef<any>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = isMobile ? 800 : 2000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 1] = Math.random() * 200;
      pos[i * 3 + 2] = -50 - Math.random() * 200;
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      const vel = Math.min(scrollVelocity.current * 50, 3);
      ref.current.rotation.y = state.clock.elapsedTime * (0.01 + vel * 0.05);
      (ref.current.material as PointsMaterial).size = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      const targetScale = 1 + vel * 0.3;
      ref.current.scale.setScalar(MathUtils.damp(ref.current.scale.x, targetScale, 4, delta));
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.8} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

function CampfireEmbers({ scrollVelocity }: { scrollVelocity: React.MutableRefObject<number> }) {
  const count = 60;
  const meshRef = useRef<THREEPoints>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = -3 + Math.random() * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return [pos, vel];
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as BufferAttribute;
    const vel2 = Math.min(scrollVelocity.current * 30, 2);
    const emissionRate = 1 + vel2 * 2;

    for (let i = 0; i < count; i++) {
      (posAttr.array as Float32Array)[i * 3] += velocities[i * 3] * delta * emissionRate;
      (posAttr.array as Float32Array)[i * 3 + 1] += velocities[i * 3 + 1] * delta * emissionRate;
      (posAttr.array as Float32Array)[i * 3 + 2] += velocities[i * 3 + 2] * delta * emissionRate;

      if ((posAttr.array as Float32Array)[i * 3 + 1] > 10) {
        (posAttr.array as Float32Array)[i * 3] = (Math.random() - 0.5) * 2;
        (posAttr.array as Float32Array)[i * 3 + 1] = -3;
        (posAttr.array as Float32Array)[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
    // Only upload buffer when a particle actually reset position
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#f59e0b" transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function VideoCampLedge({
  videoUrl,
  position,
  scale,
  scrollProgress,
}: {
  videoUrl: string;
  position: [number, number, number];
  scale: [number, number];
  scrollProgress: MotionValue<number>;
}) {
  const camp = MODULE_TIMELINE.camp;
  const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
  const meshRef = useRef<Mesh>(null);
  const lerpedP = useRef(0);

  // Mark material as self-managed before first applyGroupOpacity pass
  useEffect(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshBasicMaterial;
      (mat as any).__selfManagedOpacity = true;
    }
  }, []);

  useEffect(() => {
    if (!tex?.image) return;
    const vid = tex.image as HTMLVideoElement;
    const unsub = scrollProgress.on('change', (v: number) => {
      if (v > camp.ownStart && v < camp.ownEnd) {
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
  }, [tex, scrollProgress, camp.ownStart, camp.ownEnd]);

  useFrame((state, delta) => {
    if (meshRef.current && tex.image) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const animP = Math.min(1, Math.max(0, (lerpedP.current - camp.ownStart) / (camp.enterEnd - camp.ownStart)));
      const mat = meshRef.current.material as MeshBasicMaterial;
      (mat as any).__selfManagedOpacity = true;
      mat.opacity = animP;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0} />
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
  const colorNight = useMemo(() => new Color('#020617'), []);
  const colorFire = useMemo(() => new Color('#ea580c'), []);
  const camp = MODULE_TIMELINE.camp;

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    const p = lerpedP.current;
    const opacity = sceneOpacity('camp', p);
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

  return (
    <group ref={groupRef}>
      <ambientLight ref={lightRef} intensity={0.2} color="#020617" />
      <Starfield scrollVelocity={scrollVelocity} />
      <CampfireEmbers scrollVelocity={scrollVelocity} />
      <VideoCampLedge
        videoUrl="/assets/videos/campfire.mp4"
        position={[0, 0, -250]}
        scale={[400, 225]}
        scrollProgress={scrollProgress}
      />
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
    const c = tex.clone();
    c.wrapS = RepeatWrapping;
    c.wrapT = RepeatWrapping;
    c.repeat.set(1 / frames, 1);
    return c;
  }, [tex, frames]);

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
      clonedTex.offset.x = (Math.floor(playhead.current) % frames) / frames;
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

function AlpineSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedP = useRef(0);
  const alpine = MODULE_TIMELINE.alpine;

  useFrame((state, delta) => {
    if (groupRef.current) {
      lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
      const opacity = sceneOpacity('alpine', lerpedP.current);
      groupRef.current.visible = opacity > 0;
      if (groupRef.current.visible) applyGroupOpacity(groupRef.current, opacity);
    }
  });

  return (
    <group ref={groupRef}>
      <AlpineWall textureUrl="/alpine_wall.webp" position={[0, 80, -500]} scale={[1200, 1200]} />
      <group>
        <RockLedge textureUrl="/alpine_ledge_left.webp" position={[-12, 0, -5]} scale={[25, 25]} />
        <RockLedge textureUrl="/alpine_ledge_right.webp" position={[12, 30, -10]} scale={[25, 25]} />
        <RockLedge textureUrl="/alpine_ledge_left_variant_2.webp" position={[-12, 60, -15]} scale={[25, 25]} />
        <RockLedge textureUrl="/alpine_ledge_right_variant_2.webp" position={[12, 90, -20]} scale={[25, 25]} />
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
          frames={8}
          cycles={8}
        />
      </group>
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
      // Match VideoPanoramaLedge timing: fade in 0.40→0.55, pan + fade out 0.55→0.70
      let opacity = 0;
      if (animP < 0.55) {
        opacity = Math.min(1, Math.max(0, (animP - 0.4) / 0.15));
      } else {
        opacity = 1 - Math.min(1, Math.max(0, (animP - 0.55) / 0.15));
      }
      const panP = Math.min(1, Math.max(0, (animP - 0.55) / 0.15));
      meshRef.current.position.x = position[0] - panP * 25;
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
  const { viewport, camera } = useThree();
  const summit = MODULE_TIMELINE.summit;

  const cv = viewport.getCurrentViewport(camera, new Vector3(position[0], position[1], position[2]));
  const videoAspect = 16 / 9;
  const screenAspect = cv.width / cv.height;
  let w = cv.width,
    h = cv.height;

  // Force the video to act as "cover" - ensuring full width and height without gaps
  if (screenAspect > videoAspect) {
    w = cv.width;
    h = w / videoAspect;
  } else {
    h = cv.height;
    w = h * videoAspect;
  }
  // Ensure it's slightly oversized (1.2x) to handle tracking parallax successfully
  const dynScale: [number, number, number] = [w * 1.3, h * 1.3, 1];

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
      // Fade in: animP 0.40→0.55. Hold full opacity mapping through 1.0!
      let opacity = 0;
      if (animP < 0.4) {
        opacity = 0;
      } else if (animP < 0.55) {
        opacity = Math.min(1, Math.max(0, (animP - 0.4) / 0.15));
      } else {
        opacity = 1;
      }
      // Milder cinematic pan scaled specifically so the dynScale 1.3x never exposes edges
      const panP = Math.min(1, Math.max(0, (animP - 0.55) / 0.45));
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
  position,
  startZ,
  endZ,
  startY,
  endY,
  scale,
  scrollProgress,
}: {
  textureUrl: string;
  position: [number, number, number];
  startZ: number;
  endZ: number;
  startY: number;
  endY: number;
  scale: [number, number];
  scrollProgress: MotionValue<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const summit = MODULE_TIMELINE.summit;
  const lerpedP = useRef(0);

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
      const flyProgress = Math.min(1, Math.max(0, animP / 0.2));
      const easeOut = 1 - Math.pow(1 - flyProgress, 3);
      meshRef.current.position.z = endZ;
      meshRef.current.position.y = MathUtils.lerp(startY, endY, easeOut);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} />
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
  scrollStart,
  scrollEnd,
  cycles = 6,
  scrollProgress,
}: any) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const summit = MODULE_TIMELINE.summit;

  const clonedTex = useMemo(() => {
    const c = tex.clone();
    c.wrapS = RepeatWrapping;
    c.wrapT = RepeatWrapping;
    c.repeat.set(1 / frames, 1);
    return c;
  }, [tex, frames]);

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
        clonedTex.offset.x = (frames - 1) / frames;
      } else if (walkProgress > 0) {
        const totalFrames = walkProgress * cycles * frames;
        clonedTex.offset.x = (Math.floor(totalFrames) % frames) / frames;
      } else {
        clonedTex.offset.x = 0;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[startX, startYOffset, startZ]} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={clonedTex} transparent depthWrite={true} alphaTest={0.5} />
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
        <ForegroundLedge
          textureUrl="/cliff_edge.webp"
          position={[-3, 0, 0]}
          startZ={8}
          endZ={8}
          startY={-18}
          endY={-2}
          scale={[18, 6]}
          scrollProgress={scrollProgress}
        />
        <OneShotAnimatedFox
          textureUrl="/fox_sprite.webp"
          startX={-12}
          endX={-3.5}
          startYOffset={-3}
          endYOffset={-3}
          startZ={9}
          endZ={9}
          scale={[3.5, 3.5]}
          frames={7}
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const scrollVelocity = useRef(0);
  const lastProgress = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (v) => {
      scrollVelocity.current = Math.abs(v - lastProgress.current) * 60;
      lastProgress.current = v;
    });
    return unsubscribe;
  }, [scrollProgress]);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-0">
        <img src="/bg_layer.webp" alt="Mountain landscape" className="w-full h-full object-cover opacity-30" />
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={isMobile ? [1, 1] : [1, 1.5]}>
      <Suspense fallback={null}>
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
