'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo, useEffect } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import { Texture, Mesh, Group, RepeatWrapping, MirroredRepeatWrapping, MathUtils } from 'three';
import PostProcessingStack from './PostProcessingStack';

type Vec2 = [number, number];
type Vec3 = [number, number, number];
type WoodcutMaterialRef = {
  uTime: number;
  uWind: number;
};

type LedgeProps = {
  textureUrl: string;
  position: Vec3;
  scale: Vec2;
  rotation?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WoodcutShader = 'woodcutShaderMaterial' as any;

function AnimatedSprite({
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
  scale: Vec2;
  rotation?: number;
  frames?: number;
  cols?: number;
  rows?: number;
  scrollStart: number;
  scrollEnd: number;
  cycles?: number;
  scrollProgress: MotionValue<number>;
}) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<WoodcutMaterialRef | null>(null);
  const lerpedProgress = useRef(0);
  const playhead = useRef(0);

  const clonedTex = useMemo(() => {
    const clone = tex.clone();
    clone.wrapS = RepeatWrapping;
    clone.wrapT = RepeatWrapping;
    clone.repeat.set(1 / cols, 1 / rows);
    return clone;
  }, [tex, cols, rows]);

  useEffect(() => {
    return () => {
      tex.dispose();
      clonedTex.dispose();
    };
  }, [tex, clonedTex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
      const progress = lerpedProgress.current;
      // Map strictly to this module's local scroll range constraint
      const clamped = Math.min(1, Math.max(0, (progress - scrollStart) / (scrollEnd - scrollStart)));

      // 1. Physical Translation: Move linearly from startX to endX
      meshRef.current.position.x = MathUtils.lerp(startX, endX, clamped);

      // 2. Sprite Animation: Tie current frame to velocity
      const vel = Math.abs(scrollProgress.getVelocity());
      const animationSpeed = vel > 0.01 ? 8 + vel * 120 : 0;

      // Only animate if the sprite is active
      if (clamped > 0 && clamped < 1) {
        playhead.current += animationSpeed * delta * (cycles / 6);
      }

      const currentFrame = Math.floor(playhead.current) % frames;
      const col = currentFrame % cols;
      const row = Math.floor(currentFrame / cols);
      // Imperative texture animation is intentional in the render loop.
      // eslint-disable-next-line react-hooks/immutability
      clonedTex.offset.x = col / cols;
      clonedTex.offset.y = (rows - 1 - row) / rows;
    }
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uWind = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[startX, y, z]} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <WoodcutShader
        ref={materialRef as never}
        uTexture={clonedTex}
        transparent={true}
        depthWrite={true}
        alphaTest={0.5}
      />
    </mesh>
  );
}

function RockLedge({ textureUrl, position, scale, rotation = 0 }: LedgeProps) {
  const tex = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  return (
    <mesh ref={meshRef} position={position} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} />
    </mesh>
  );
}

function AlpineWall({ textureUrl, position, scale }: Omit<LedgeProps, 'rotation'>) {
  const tex = useTexture(textureUrl) as Texture;

  const clonedTex = useMemo(() => {
    const clone = tex.clone();
    clone.wrapS = MirroredRepeatWrapping;
    clone.wrapT = MirroredRepeatWrapping;
    return clone;
  }, [tex]);

  useEffect(() => {
    return () => {
      tex.dispose();
      clonedTex.dispose();
    };
  }, [tex, clonedTex]);

  useFrame((state, delta) => {
    // Slowly drift the background wall to create deep parallax
    // eslint-disable-next-line react-hooks/immutability
    clonedTex.offset.x -= delta * 0.05;
  });

  return (
    <mesh position={position}>
      <planeGeometry args={scale} />
      <meshBasicMaterial
        map={clonedTex}
        transparent
        depthWrite={false} // Ensure it stays behind the rocks and fog
        alphaTest={0.5}
      />
    </mesh>
  );
}

function AlpineCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const { camera } = useThree();
  const lerpedProgress = useRef(0);

  // The Vertical Ascent Camera (Active between 0.0 and 1.0)
  useFrame((state, delta) => {
    lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
    const progress = lerpedProgress.current;

    // Map global scroll [0.65 -> 0.9] to local climb [0.0 -> 1.0]
    const climbProgress = Math.min(1, Math.max(0, (progress - 0.65) / 0.25));

    // Simulate body movement/climbing step sway (creates 3 full organic side-to-side sways)
    const climbSwayX = Math.sin(climbProgress * Math.PI * 6) * 1.5;
    // Imperative camera motion is intentional inside the render loop.
    // eslint-disable-next-line react-hooks/immutability
    camera.position.x = climbSwayX;

    // Y Travel: We climb vertically up the extremely tall rock face from Y=0 to Y=120
    const targetY = MathUtils.lerp(0, 120, climbProgress);
    camera.position.y = targetY;

    // Z Travel: Pull very close to the cliff face for visceral scale and extreme parallax
    const targetZ = 15;
    camera.position.z = targetZ;

    // Look slightly up the wall
    const targetRotX = 0.15;
    camera.rotation.x = targetRotX;
  });

  return null;
}

function AlpineScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<Group>(null);
  const lerpedProgress = useRef(0);

  // Frustum Culling Logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
      // Limit render calls exclusively to the [0.65 -> 0.90] global phase window
      groupRef.current.visible = lerpedProgress.current > 0.64 && lerpedProgress.current < 0.91;
    }
  });

  return (
    <group ref={groupRef}>
      {/* The Camera Controller */}
      <AlpineCamera scrollProgress={scrollProgress} />

      {/* The Deep Ambient Mountain Skyline */}
      <AlpineWall textureUrl="/alpine_wall.webp" position={[0, 80, -500]} scale={[1200, 1200]} />

      {/* The High Alpine Ledges (Spread out vertically along the Y-axis) */}
      <group>
        {/* Ledge 1: Left Monolith (Frames Case Study 1 on right) */}
        <RockLedge textureUrl="/alpine_ledge_left.webp" position={[-12, 0, -5]} scale={[25, 25]} />

        {/* Ledge 2: Right Cluster (Frames Case Study 2 on left) */}
        <RockLedge textureUrl="/alpine_ledge_right.webp" position={[12, 30, -10]} scale={[25, 25]} />

        {/* Ledge 3: Left Overhang (Frames Case Study 3 on right) */}
        <RockLedge textureUrl="/alpine_ledge_left_variant_2.webp" position={[-12, 60, -15]} scale={[25, 25]} />

        {/* Ledge 4: Right Vertical Cliff (Frames Case Study 4 on left) */}
        <RockLedge textureUrl="/alpine_ledge_right_variant_2.webp" position={[12, 90, -20]} scale={[25, 25]} />

        {/* The Flapping Bird (Flying high in the thin air, tied to scroll) */}
        <AnimatedSprite
          textureUrl="/bird_sprite.webp"
          startX={-45}
          endX={45}
          y={105}
          z={-30}
          scrollStart={0.8}
          scrollEnd={0.875}
          scale={[15, 15]}
          scrollProgress={scrollProgress}
          frames={12}
          cols={6}
          rows={2}
          cycles={10}
        />
      </group>
    </group>
  );
}

const isMobileAlpine = typeof window !== 'undefined' && window.innerWidth < 768;

export default function AlpineModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  // Fade IN as the module enters (0.65 -> 0.75)
  // Fade OUT completely as the camera reaches the Summit Module (0.85 -> 0.9)
  const canvasOpacity = useTransform(scrollProgress, [0.65, 0.75, 0.85, 0.9], [0, 1, 1, 0]);
  const canvasScale = useTransform(scrollProgress, [0.65, 0.75], [0.9, 1.0]);

  return (
    <motion.div
      style={{ opacity: canvasOpacity, scale: canvasScale }}
      className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-multiply origin-center"
    >
      <Canvas camera={{ position: [0, 0, 40], fov: 50 }} dpr={isMobileAlpine ? [1, 1] : [1, 1.5]}>
        <Suspense fallback={null}>
          <AlpineScene scrollProgress={scrollProgress} />
          <PostProcessingStack />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}
