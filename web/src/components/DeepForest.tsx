/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/immutability, react/display-name */
import { useTexture, Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { Texture, Mesh, Group, MeshBasicMaterial, RepeatWrapping, MirroredRepeatWrapping, MathUtils } from 'three';
import { useRef, useMemo, useEffect, forwardRef } from 'react';
import { MotionValue } from 'framer-motion';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';

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
  scale: [number, number];
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
  const materialRef = useRef<any>(null);
  const lerpedProgress = useRef(0);
  const playhead = useRef(0); // Added to accumulate velocity independently

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

  useFrame((_, delta) => {
    if (meshRef.current) {
      lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
      const progress = lerpedProgress.current;
      const clamped = Math.min(1, Math.max(0, (progress - scrollStart) / (scrollEnd - scrollStart)));

      meshRef.current.position.x = MathUtils.lerp(startX, endX, clamped);

      // Walk cycle advances on real time (not scroll) so legs never flicker
      // with scroll velocity or step backward when you scroll up.
      if (clamped > 0 && clamped < 1) {
        playhead.current += delta * cycles;
        const currentFrame = Math.floor(playhead.current) % frames;
        const col = currentFrame % cols;
        const row = Math.floor(currentFrame / cols);
        clonedTex.offset.x = col / cols;
        clonedTex.offset.y = (rows - 1 - row) / rows;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[startX, y, z]} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={clonedTex} transparent depthWrite={true} alphaTest={0.5} />
    </mesh>
  );
}

const ForestTree = forwardRef(({ textureUrl, position, scale, rotation = 0 }: any, externalRef: any) => {
  const tex = useTexture(textureUrl) as Texture;
  // Internal ref for animations, assign to external if requested
  const meshRef = useRef<Mesh>(null);
  useEffect(() => {
    if (externalRef) externalRef.current = meshRef.current;
  }, [externalRef]);

  const materialRef = useRef<any>(null);
  const { camera } = useThree();

  const targetX = position[0];
  const sideDir = position[0] > 0 ? 1 : -1;
  // Pushed 40 units offscreen relative to target
  const offscreenX = targetX + 40 * sideDir;

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Sway physics
      meshRef.current.rotation.z = rotation + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;

      // Distance from camera to this tree
      const dist = camera.position.z - position[2];

      // Slide in logic: Between distance of 50 and 10, animate progress from 0 to 1
      let progress = 0;
      if (dist < 50) {
        progress = 1.0 - Math.max(0, (dist - 10) / 40);
      }
      progress = Math.min(1, Math.max(0, progress));

      // Ease Out Quart for dramatic snap
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentX = MathUtils.lerp(offscreenX, targetX, easeOutQuart);

      meshRef.current.position.x = currentX;
    }
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uWind = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    // Start perfectly offset horizontally
    <mesh ref={meshRef} position={[offscreenX, position[1], position[2]]} rotation-z={rotation}>
      <planeGeometry args={scale} />
      <WoodcutShader ref={materialRef} uTexture={tex} transparent={true} depthWrite={true} alphaTest={0.5} />
    </mesh>
  );
});

function ForestWall({ textureUrl, position, scale }: any) {
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
    clonedTex.offset.x -= delta * 0.05;
  });

  return (
    <mesh position={position}>
      <planeGeometry args={scale} />
      <meshBasicMaterial
        map={clonedTex}
        transparent
        depthWrite={false} // Ensure it stays behind the trees
        alphaTest={0.5}
      />
    </mesh>
  );
}

function SpatialText({
  position,
  title,
  subtitle,
  scrollProgress,
  trees,
}: {
  position: [number, number, number];
  title: string;
  subtitle: string;
  scrollProgress: MotionValue<number>;
  trees: React.MutableRefObject<Mesh | null>[];
}) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const shieldMatRef = useRef<MeshBasicMaterial>(null);
  const lerpedScroll = useRef(0);

  // Filter out null tree refs for occlusion
  const occludeArray = trees.filter((t) => t.current !== null) as any;

  useFrame((state, delta) => {
    lerpedScroll.current = MathUtils.damp(lerpedScroll.current, scrollProgress.get(), 4, delta);
    const progress = lerpedScroll.current;

    // 1. Fog Logic: Calculate distance from camera to text Z. Fade to 0 if deeper than -60 units away.
    const dist = camera.position.z - position[2];
    // At 10 units away, full opacity. At 60 units away, zero opacity.
    const targetOpacity = 1.0 - Math.min(1, Math.max(0, (dist - 10) / 50));

    if (htmlRef.current) {
      htmlRef.current.style.opacity = targetOpacity.toFixed(3);
    }

    // 2. Kinetic Kineticism (Letter Spacing) based on scroll velocity
    if (textRef.current) {
      const vel = Math.abs(scrollProgress.getVelocity()); // px/sec roughly
      // Map 0 -> 1000 velocity to 0em -> 0.15em letter-spacing
      const mappedSpacing = Math.min(0.15, vel * 0.00015);

      // Dampen the letter-spacing directly into the DOM node to prevent React layout thrashing
      const currentSpacing = parseFloat(textRef.current.style.letterSpacing || '0');
      const dampedSpacing = MathUtils.damp(currentSpacing, mappedSpacing, 4, delta);
      textRef.current.style.letterSpacing = `${dampedSpacing.toFixed(4)}em`;
    }

    // 3. Readability Shield (meshBasicMaterial)
    // Fade in a dark radial backdrop if we enter the dense focal zone of the forest [0.4 -> 0.6]
    if (shieldMatRef.current) {
      let shieldOpacity = 0;
      if (progress > 0.4 && progress < 0.6) {
        // Peak opacity of 0.8 at exactly 0.5
        const distFromCenter = Math.abs(0.5 - progress); // 0 at center, 0.1 at edges
        shieldOpacity = 0.8 * (1.0 - distFromCenter / 0.1);
      }
      shieldMatRef.current.opacity = Math.min(0.8, Math.max(0, shieldOpacity));
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Html
        ref={htmlRef}
        transform
        occlude={occludeArray}
        zIndexRange={[100, 0]}
        scale={2}
        distanceFactor={15} // Maintain proportional size
      >
        <div className="w-[90vw] max-w-[800px] text-center pointer-events-none flex flex-col items-center select-none font-inter text-balance">
          <h2
            ref={textRef}
            className="text-5xl md:text-8xl font-bold mb-4 font-instrument text-stone-100 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
            style={{ transition: 'none' }}
          >
            {title}
          </h2>
          <p className="text-xl md:text-3xl text-white/80 max-w-[30ch] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-bold">
            {subtitle}
          </p>
        </div>
      </Html>

      {/* Readability Guard Shield placed physically behind the HTML text (Z = -0.5) */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[60, 40]} />
        <meshBasicMaterial ref={shieldMatRef} color="#000000" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function DeepForest({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const tree1Ref = useRef<Mesh>(null);
  const tree2Ref = useRef<Mesh>(null);
  const tree3Ref = useRef<Mesh>(null);
  const tree4Ref = useRef<Mesh>(null);
  const treeArray = [tree1Ref, tree2Ref, tree3Ref, tree4Ref];

  return (
    <group>
      {/* The Endless Background Wall of Trees */}
      <ForestWall textureUrl="/forest_wall.webp" position={[0, 10, -180]} scale={[300, 300]} />

      {/* The Gauntlet of Trees - Staggered Left / Right */}

      {/* Tree 4: Deep distance - The massive Sequoia anchoring the path (Left) */}
      <ForestTree ref={tree4Ref} textureUrl="/tree_sequoia.webp" position={[-28, 2, -85]} scale={[65, 65]} />

      {/* Tree 3: Mid-distance - The sharp Spruce (Right) */}
      <ForestTree
        ref={tree3Ref}
        textureUrl="/tree_spruce.webp"
        position={[25, 5, -55]}
        scale={[50, 50]}
        rotation={-0.05}
      />

      {/* Tree 2: Mid-foreground - The twisted Cherry Blossom (Left) */}
      <ForestTree
        ref={tree2Ref}
        textureUrl="/tree_cherry.webp"
        position={[-25, 5, -25]}
        scale={[60, 60]}
        rotation={0.05}
      />

      {/* Tree 1: Extreme foreground, framing the entrance - The stark Aspen (Right) */}
      <ForestTree ref={tree1Ref} textureUrl="/tree_aspen.webp" position={[25, -2, 0]} scale={[45, 45]} />

      {/* Spatial text removed from the scene layer.
                Meaningful copy now lives in protected HTML panels so the scene can stay atmospheric. */}

      {/* The Animated Stag — walks through the deep midground. Must sit
          behind the forest camera's end-of-path z (-90) so it stays in
          front of the camera throughout its animation window. */}
      <AnimatedSprite
        textureUrl="/stag_sprite.webp"
        startX={-42}
        endX={34}
        y={-5}
        z={-95}
        scrollStart={MODULE_TIMELINE.forest.enterEnd}
        scrollEnd={
          MODULE_TIMELINE.forest.enterEnd + (MODULE_TIMELINE.forest.exitStart - MODULE_TIMELINE.forest.enterEnd) / 3
        }
        scale={[32, 32]}
        frames={16}
        cols={4}
        rows={4}
        cycles={6}
        scrollProgress={scrollProgress}
      />
    </group>
  );
}
