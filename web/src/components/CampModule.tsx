'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useEffect } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import {
  Points as THREEPoints,
  BufferGeometry,
  PointsMaterial,
  Mesh,
  MeshBasicMaterial,
  Group,
  AmbientLight,
  Color,
  MathUtils,
} from 'three';
import { useVideoTexture, PointMaterial, Points } from '@react-three/drei';
import PostProcessingStack from './PostProcessingStack';

type Vec3 = [number, number, number];
type Vec2 = [number, number];

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function buildStarfieldPositions(count: number, seed: number) {
  const random = createSeededRandom(seed);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Spread them in a large dome behind the camp
    positions[i * 3] = (random() - 0.5) * 400; // x
    positions[i * 3 + 1] = random() * 200; // y (only above ground)
    positions[i * 3 + 2] = -50 - random() * 200; // z (deep behind)
  }

  return positions;
}

// Generates procedural twinkling stars
function Starfield() {
  const ref = useRef<THREEPoints<BufferGeometry, PointsMaterial>>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = isMobile ? 800 : 2000;
  const positions = useMemo(() => buildStarfieldPositions(count, 1337), [count]);

  useFrame((state) => {
    if (ref.current) {
      // Very slow celestial rotation
      ref.current.rotation.z = state.clock.elapsedTime * 0.01;
      // Twinkling effect
      (ref.current.material as PointsMaterial).size = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.8} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

function VideoCampLedge({
  videoUrl,
  position,
  scale,
  scrollProgress,
}: {
  videoUrl: string;
  position: Vec3;
  scale: Vec2;
  scrollProgress: MotionValue<number>;
}) {
  const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
  const meshRef = useRef<Mesh>(null);
  const lerpedProgress = useRef(0);

  // Video Lifecycle Guard (Outside of rendering loop)
  useEffect(() => {
    if (!tex?.image) return;
    const videoElem = tex.image as HTMLVideoElement;

    const unsubscribe = scrollProgress.on('change', (v: number) => {
      // Pre-warm campfire immediately before entering bounds [0.44 - 0.71]
      if (v > 0.44 && v < 0.71) {
        if (videoElem.paused) videoElem.play().catch(() => {});
      } else {
        if (!videoElem.paused) {
          videoElem.pause();
          videoElem.currentTime = 0; // Hardware memory flush
        }
      }
    });

    return () => {
      unsubscribe();
      // Strict WebGL Garbage Collection
      tex.dispose();
    };
  }, [tex, scrollProgress]);

  useFrame((state, delta) => {
    if (meshRef.current && tex.image) {
      lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
      const progress = lerpedProgress.current;

      // Map global scroll [0.45 -> 0.55] to a fadeIn progress 0.0 -> 1.0
      const animProgress = Math.min(1, Math.max(0, (progress - 0.45) / 0.1));
      (meshRef.current.material as MeshBasicMaterial).opacity = animProgress;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {/* The video texture needs to be perfectly mapped, use 16:9 scale relative sizing */}
      <planeGeometry args={scale} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={true}
        alphaTest={0.5}
        opacity={0} // Start invisible until the sequence triggers
      />
    </mesh>
  );
}

function NightCampScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const lightRef = useRef<AmbientLight>(null);
  const lerpedProgress = useRef(0);

  const colorNight = useMemo(() => new Color('#020617'), []); // Deep Slate Blue
  const colorFire = useMemo(() => new Color('#ea580c'), []); // Embers Orange

  useFrame((state, delta) => {
    lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
    const progress = lerpedProgress.current;
    // Map [0.45 - 0.7] segment to a pure 0.0 -> 1.0 interpolation for camera logic
    const animProgress = Math.min(Math.max(0, (progress - 0.45) / 0.25), 1.0);

    if (groupRef.current) {
      groupRef.current.visible = progress > 0.44 && progress < 0.71;
    }

    if (lightRef.current) {
      // Shift lighting from cold night to warm fire as we approach the camp center [0.45 -> 0.55]
      const lightMix = Math.min(1, Math.max(0, (progress - 0.45) / 0.1));
      lightRef.current.color.lerpColors(colorNight, colorFire, lightMix);
      lightRef.current.intensity = 0.2 + lightMix * 1.5;
    }

    // Subtly sway the camera on X to keep it feeling alive
    const swayX = Math.sin(state.clock.elapsedTime * 0.5) * 1.5;

    // True scroll Parallax:
    // As we scroll, the camera pushes forward (Z) and slightly up (Y)
    // This forces the foreground tent and background moon to shift against each other.
    const targetY = MathUtils.lerp(-10, 15, animProgress);
    const targetZ = MathUtils.lerp(30, -10, animProgress);

    // Imperative camera motion is the intended Three.js pattern here.
    // eslint-disable-next-line react-hooks/immutability
    camera.position.x = swayX;
    camera.position.y = targetY;
    camera.position.z = targetZ;
  });

  return (
    <group ref={groupRef}>
      <ambientLight ref={lightRef} intensity={0.2} color="#020617" />

      {/* The Procedural Night Sky */}
      <Starfield />

      {/* Inverted Stylized Campfire Video Background */}
      <VideoCampLedge
        videoUrl="/assets/videos/campfire.mp4"
        position={[0, 0, -250]}
        scale={[400, 225]} // 16:9 Massive plane pushed deep in Z-space
        scrollProgress={scrollProgress}
      />
    </group>
  );
}

const isMobileCamp = typeof window !== 'undefined' && window.innerWidth < 768;

export default function CampModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  // Fade IN starting at global bounds [0.45], solidly opaque by [0.55]
  // Fade OUT sequentially starting at [0.65] hitting 0 at [0.70]
  const canvasOpacity = useTransform(scrollProgress, [0.45, 0.55, 0.65, 0.7], [0, 1, 1, 0]);
  const canvasScale = useTransform(scrollProgress, [0.45, 0.55], [0.9, 1.0]);

  return (
    <motion.div
      style={{ opacity: canvasOpacity, scale: canvasScale }}
      className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-screen origin-center"
    >
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={isMobileCamp ? [1, 1] : [1, 1.5]}>
        <Suspense fallback={null}>
          <NightCampScene scrollProgress={scrollProgress} />
          <PostProcessingStack />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}
