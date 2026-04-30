/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/display-name */
import { useTexture, Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import {
  Texture,
  Mesh,
  Group,
  MeshBasicMaterial,
  MathUtils,
  AdditiveBlending,
  DoubleSide,
  RepeatWrapping,
} from 'three';
import { useRef, useMemo, useEffect, forwardRef } from 'react';
import { MotionValue } from 'framer-motion';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { configureSpriteSheetTexture, setSpriteSheetFrame } from '@/lib/spriteSheetTexture';
import './shaders/ForestMistMaterial';
import './shaders/ForestShaftMaterial';
import './shaders/ForestMotesMaterial';

const WoodcutShader = 'woodcutShaderMaterial' as any;
const ForestMistShader = 'forestMistShaderMaterial' as any;
const ForestShaftShader = 'forestShaftShaderMaterial' as any;
const ForestMotesShader = 'forestMotesShaderMaterial' as any;

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
  const materialRef = useRef<any>(null);
  const lerpedProgress = useRef(0);
  const playhead = useRef(0); // Added to accumulate velocity independently

  const clonedTex = useMemo(() => {
    const clone = configureSpriteSheetTexture(tex.clone());
    setSpriteSheetFrame(clone, { frame: 0, cols, rows, insetPx: frameInsetPx });
    return clone;
  }, [tex, cols, rows, frameInsetPx]);
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
        setSpriteSheetFrame(clonedTex, { frame: currentFrame, cols, rows, insetPx: frameInsetPx });
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

const ForestTree = forwardRef(
  ({ textureUrl, position, scale, rotation = 0, controls, instantReveal = false }: any, externalRef: any) => {
    const tex = useTexture(textureUrl) as Texture;
    const meshRef = useRef<Mesh>(null);
    useEffect(() => {
      if (externalRef) externalRef.current = meshRef.current;
    }, [externalRef]);

    const materialRef = useRef<any>(null);
    const { camera } = useThree();

    const targetX = position[0];
    const sideDir = position[0] > 0 ? 1 : -1;
    // Trees marked instantReveal sit at their target X always — the
    // approach-slide is meaningless for backdrop layers the camera never
    // walks past.
    const offscreenX = instantReveal ? targetX : targetX + 40 * sideDir;

    useEffect(() => {
      return () => {
        tex.dispose();
      };
    }, [tex]);

    useFrame((state, delta) => {
      if (meshRef.current) {
        meshRef.current.rotation.z = rotation + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;

        if (instantReveal) {
          meshRef.current.position.x = targetX;
        } else {
          const dist = camera.position.z - position[2];

          let progress = 0;
          if (dist < 50) {
            progress = 1.0 - Math.max(0, (dist - 10) / 40);
          }
          progress = Math.min(1, Math.max(0, progress));

          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const currentX = MathUtils.lerp(offscreenX, targetX, easeOutQuart);

          meshRef.current.position.x = currentX;
        }
      }
      if (materialRef.current) {
        materialRef.current.uTime = state.clock.elapsedTime;
        materialRef.current.uWind = 0.8;
        if (controls?.treeInkColor) {
          materialRef.current.uColorBase.set(controls.treeInkColor);
        }

        const dist = camera.position.z - position[2];
        let wash = Math.max(0, (dist - 40) / 80);
        wash = Math.min(1.2, wash);

        const washMul = controls?.treeWashIntensity ?? 1.0;
        materialRef.current.uWashIntensity = wash * washMul;
        materialRef.current.uEdgePool = wash * 0.4 * washMul;

        const opacityMul = controls?.treeOpacity ?? 1.0;
        const baseUOpacity = (materialRef.current as any).__baseUOpacity ?? 1.0;
        materialRef.current.uOpacity = baseUOpacity * opacityMul;
      }
    });

    return (
      <mesh ref={meshRef} position={[offscreenX, position[1], position[2]]} rotation-z={rotation}>
        <planeGeometry args={scale} />
        <WoodcutShader ref={materialRef} uTexture={tex} transparent={true} depthWrite={true} alphaTest={0.5} />
      </mesh>
    );
  },
);

/**
 * Forest mist — painterly cool-fog backdrop. Replaces the auto-panning
 * `forest_wall.webp` wallpaper. uMistDensity hero dial ramps 0.3 → 1.0
 * across the forest enter→exit window so the fog visibly thickens as the
 * camera walks deeper into the trees, then thins back out into Camp.
 */
function ForestMist({
  scrollProgress,
  position,
  scale,
  controls,
  fixedDensity,
}: {
  scrollProgress: MotionValue<number>;
  position: [number, number, number];
  scale: [number, number];
  controls?: any;
  fixedDensity?: number;
}) {
  const matRef = useRef<any>(null);
  const lerpedP = useRef(0);
  const forest = MODULE_TIMELINE.forest;

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;

    if (controls) {
      matRef.current.uColorMistCool.set(controls.mistCoolColor);
      matRef.current.uColorMistShadow.set(controls.mistShadowColor);
    }

    if (typeof fixedDensity === 'number') {
      matRef.current.uMistDensity = fixedDensity;
      return;
    }

    const override = controls?.mistDensityOverride;
    if (typeof override === 'number' && override >= 0) {
      matRef.current.uMistDensity = override;
      return;
    }

    const span = forest.exitEnd - forest.enterStart;
    const raw = span > 0 ? Math.min(1, Math.max(0, (lerpedP.current - forest.enterStart) / span)) : 0;
    matRef.current.uMistDensity = MathUtils.lerp(0.3, 1.0, raw);
  });

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <ForestMistShader ref={matRef} transparent={false} depthWrite={true} />
    </mesh>
  );
}

/**
 * Horizontal floor plate — same ForestMist shader, but flat. Held
 * separately because ForestMist's mesh isn't rotated.
 */
function ForestFloor({
  scrollProgress,
  controls,
  fixedDensity,
}: {
  scrollProgress: MotionValue<number>;
  controls?: any;
  fixedDensity?: number;
}) {
  const matRef = useRef<any>(null);
  const lerpedP = useRef(0);
  const forest = MODULE_TIMELINE.forest;

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
    if (!matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;

    if (controls) {
      matRef.current.uColorMistCool.set(controls.mistCoolColor);
      matRef.current.uColorMistShadow.set(controls.mistShadowColor);
    }

    if (typeof fixedDensity === 'number') {
      matRef.current.uMistDensity = fixedDensity;
      return;
    }

    const override = controls?.mistDensityOverride;
    if (typeof override === 'number' && override >= 0) {
      matRef.current.uMistDensity = override;
      return;
    }

    const span = forest.exitEnd - forest.enterStart;
    const raw = span > 0 ? Math.min(1, Math.max(0, (lerpedP.current - forest.enterStart) / span)) : 0;
    matRef.current.uMistDensity = MathUtils.lerp(0.3, 1.0, raw);
  });

  return (
    <mesh position={[0, -20, -90]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[400, 300]} />
      <ForestMistShader ref={matRef} transparent={false} depthWrite={true} />
    </mesh>
  );
}

/**
 * Mid-distance forest canopy silhouette. Painted assets are already cool
 * slate-blue with built-in mist fade at the bottom; meshBasicMaterial
 * passthrough is correct here — the SunRakeMaterial is reserved for layers
 * that need warm-tinting (Summit/Alpine ridges).
 */
function CanopyLayer({
  textureUrl,
  position,
  scale,
  opacity = 1,
  repeatX = 1,
}: {
  textureUrl: string;
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
  repeatX?: number;
}) {
  const tex = useTexture(textureUrl) as Texture;
  // useTexture returns a shared instance; clone before mutating wrap/repeat
  // so other consumers of the same URL aren't affected.
  const mapTex = useMemo(() => {
    if (repeatX <= 1) return tex;
    const clone = tex.clone();
    clone.wrapS = RepeatWrapping;
    clone.repeat.x = repeatX;
    clone.needsUpdate = true;
    return clone;
  }, [tex, repeatX]);
  useEffect(() => {
    return () => {
      tex.dispose();
      if (mapTex !== tex) mapTex.dispose();
    };
  }, [tex, mapTex]);

  return (
    <mesh position={position} frustumCulled={false}>
      <planeGeometry args={scale} />
      <meshBasicMaterial map={mapTex} transparent depthWrite={true} alphaTest={0.5} opacity={opacity} />
    </mesh>
  );
}

/**
 * The Forest's wow shader moment. A vertical painterly light shaft —
 * an ambiguous column of cool paint sitting in the deep fog at the
 * far end of the camera walk. As the camera approaches and ends
 * inside the shaft at Forest exit, brush grain emerges and the base
 * blooms into a wet-edge pool against the floor mist.
 *
 * No physical light source — paint logic over photonic logic.
 */
function ForestShaft({
  scrollVelocity,
  position,
  height,
  radiusTop,
  radiusBottom,
  controls,
}: {
  scrollVelocity?: React.MutableRefObject<number>;
  position: [number, number, number];
  height: number;
  radiusTop: number;
  radiusBottom: number;
  controls?: any;
}) {
  const matRef1 = useRef<any>(null);
  const matRef2 = useRef<any>(null);
  const meshRef = useRef<Group>(null);
  const { camera } = useThree();
  const dampedProx = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    const dist = Math.hypot(camera.position.z - position[2], camera.position.x - position[0]);
    const targetProx = MathUtils.clamp(1.0 - (dist - 8) / 62, 0, 1);
    dampedProx.current = MathUtils.damp(dampedProx.current, targetProx, 4, delta);

    const v = scrollVelocity?.current ?? 0;
    const push = MathUtils.clamp(Math.abs(v) * 30, 0, 1);

    [matRef1, matRef2].forEach((ref) => {
      const m = ref.current;
      if (!m) return;
      m.uTime = time;

      if (controls) {
        m.uColorShaft.set(controls.shaftColor);
        m.uIntensity = controls.shaftIntensity;
        m.uBrushScale = controls.shaftBrushScale;
        m.uBrushSpeed = controls.shaftBrushSpeed;
        m.uSplotchAmount = controls.shaftSplotchAmount;
        m.uBleedStrength = controls.shaftBleedStrength;
        m.uBreathRate = controls.shaftBreathRate;
        m.uBreathAmplitude = controls.shaftBreathAmplitude;
      }

      m.uCamProximity = dampedProx.current;
      m.uScrollPush = push;
    });
  });

  // Calculate massive cinematic backdrop plane dimensions.
  // radiusBottom in controls usually goes from 4 up to 14+.
  const planeWidth = radiusBottom * 8;
  const planeHeight = height * 1.5;

  return (
    <group ref={meshRef} position={position}>
      {/* Background Plane */}
      <mesh renderOrder={1} frustumCulled={false} position={[0, 0, -5]}>
        <planeGeometry args={[planeWidth * 1.2, planeHeight]} />
        <ForestShaftShader
          ref={matRef1}
          uPhaseOffset={15.0}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>

      {/* Foreground Plane, slightly offset in X and Z to create parallax */}
      <mesh renderOrder={1} frustumCulled={false} position={[radiusBottom * 0.4, -height * 0.1, 0]}>
        <planeGeometry args={[planeWidth, planeHeight * 0.9]} />
        <ForestShaftShader
          ref={matRef2}
          uPhaseOffset={0.0}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Foreground painterly motes plane. Camera-relative — sits a fixed
 * distance in front of the camera throughout the Forest walk, so the
 * "atmosphere between you and the scene" depth cue stays consistent
 * even as the camera translates from z = -28 to z = -90.
 */
function ForestMotes({
  scrollProgress,
  offset,
  size,
  controls,
}: {
  scrollProgress: MotionValue<number>;
  offset: number;
  size: [number, number];
  controls?: any;
}) {
  const matRef = useRef<any>(null);
  const meshRef = useRef<Mesh>(null);
  const { camera } = useThree();
  const lerpedP = useRef(0);
  const forest = MODULE_TIMELINE.forest;

  useFrame((state, delta) => {
    lerpedP.current = MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);

    if (meshRef.current) {
      // Pin the plane in front of the camera (camera looks down -Z).
      meshRef.current.position.x = camera.position.x;
      meshRef.current.position.y = camera.position.y;
      meshRef.current.position.z = camera.position.z - offset;
    }

    const m = matRef.current;
    if (!m) return;
    m.uTime = state.clock.elapsedTime;

    if (controls) {
      m.uColorMote.set(controls.motesColor);
      m.uMoteScale = controls.motesScale;
      m.uMoteThreshold = controls.motesThreshold;
      m.uMoteSoftness = controls.motesSoftness;
      m.uDriftSpeed = controls.motesDriftSpeed;
    }

    // Density envelope across the forest window so motes don't bleed
    // into Hero or Camp through the additive blend.
    const span = forest.exitEnd - forest.enterStart;
    const raw = span > 0 ? Math.min(1, Math.max(0, (lerpedP.current - forest.enterStart) / span)) : 0;
    const envelope = Math.sin(Math.max(0, Math.min(1, raw)) * Math.PI);
    const baseIntensity = controls ? controls.motesIntensity : 0.45;
    m.uIntensity = baseIntensity * envelope;
  });

  return (
    <mesh ref={meshRef} renderOrder={2} frustumCulled={false}>
      <planeGeometry args={size} />
      <ForestMotesShader ref={matRef} transparent depthWrite={false} blending={AdditiveBlending} />
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

export default function DeepForest({
  scrollProgress,
  scrollVelocity,
  controls,
}: {
  scrollProgress: MotionValue<number>;
  scrollVelocity?: React.MutableRefObject<number>;
  controls?: any;
}) {
  const tree1Ref = useRef<Mesh>(null);
  const tree2Ref = useRef<Mesh>(null);
  const tree3Ref = useRef<Mesh>(null);
  const tree4Ref = useRef<Mesh>(null);
  const treeArray = [tree1Ref, tree2Ref, tree3Ref, tree4Ref];

  const shaftPos: [number, number, number] = controls
    ? [controls.shaftX, controls.shaftCenterY, controls.shaftZ]
    : [0, -1, -90];
  const shaftHeight = controls?.shaftHeight ?? 38;
  const shaftRadiusTop = controls?.shaftRadiusTop ?? 1.5;
  const shaftRadiusBottom = controls?.shaftRadiusBottom ?? 14;
  const motesOffset = controls?.motesOffset ?? 8;
  const motesSize: [number, number] = controls ? [controls.motesWidth, controls.motesHeight] : [22, 14];

  const showShaft = controls?.shaftEnabled ?? true;
  const showMotes = controls?.motesEnabled ?? true;
  const showStag = controls?.stagEnabled ?? true;
  const showCanopyFar = controls?.canopyFarEnabled ?? true;
  const showCanopyMid = controls?.canopyMidEnabled ?? true;
  const showBackgroundTrees = controls?.bgTreesEnabled ?? true;
  const showMidgroundTrees = controls?.midTreesEnabled ?? true;
  const showForegroundTrees = controls?.fgTreesEnabled ?? true;
  const canopyFarOpacity = controls?.canopyFarOpacity ?? 1.0;
  const canopyMidOpacity = controls?.canopyMidOpacity ?? 1.0;
  const floorMistDensity = controls?.floorMistDensity ?? 0.8;

  return (
    <group>
      {/* Painted cool-mist backdrop (replaces auto-panning forest_wall).
          Pushed back so the canopy-far silhouette has fog-room behind it. */}
      <ForestMist scrollProgress={scrollProgress} position={[0, 10, -680]} scale={[1500, 900]} controls={controls} />

      {/* Forest Floor - Grounding the scene (horizontal plane). Reuses
          ForestMist via a separate mesh so we can rotate it flat. */}
      <ForestFloor scrollProgress={scrollProgress} controls={controls} fixedDensity={floorMistDensity} />

      {/* Painterly light shaft — Forest's wow shader gesture. */}
      {showShaft && (
        <ForestShaft
          scrollVelocity={scrollVelocity}
          position={shaftPos}
          height={shaftHeight}
          radiusTop={shaftRadiusTop}
          radiusBottom={shaftRadiusBottom}
          controls={controls}
        />
      )}

      {/* Foreground motes — supporting depth cue, camera-relative. */}
      {showMotes && (
        <ForestMotes scrollProgress={scrollProgress} offset={motesOffset} size={motesSize} controls={controls} />
      )}

      {/* Far canopy silhouette — pale, atmospheric depth.
          Pushed back ~2x so it recedes into the fog. Plane scaled up to
          maintain frame coverage; horizontal repeat keeps silhouette
          detail at the doubled width. */}
      {showCanopyFar && (
        <CanopyLayer
          textureUrl="/forest/canopy-far.webp"
          position={[0, 4, -600]}
          scale={[880, 490]}
          opacity={canopyFarOpacity}
          repeatX={2}
        />
      )}

      {/* Mid canopy silhouette — visible tree shapes through the mist */}
      {showCanopyMid && (
        <CanopyLayer
          textureUrl="/forest/canopy-mid.webp"
          position={[0, 3, -440]}
          scale={[560, 310]}
          opacity={canopyMidOpacity}
        />
      )}

      {/* Background Density Layer — pushed back ~2x; planes kept at
          their original scale so the deepest trees read as smaller and
          farther, adding depth instead of crowding the focal area.
          instantReveal: camera never walks close enough to trigger the
          approach-slide, so just hold them at their target X. */}
      {showBackgroundTrees && (
        <>
          <ForestTree
            textureUrl="/tree_1.webp"
            position={[-45, 0, -640]}
            scale={[70, 70]}
            rotation={0.02}
            controls={controls}
            instantReveal
          />
          <ForestTree
            textureUrl="/tree_2.webp"
            position={[40, 2, -620]}
            scale={[65, 65]}
            rotation={-0.03}
            controls={controls}
            instantReveal
          />
          <ForestTree
            textureUrl="/tree_3.webp"
            position={[-15, 3, -600]}
            scale={[55, 55]}
            rotation={0.01}
            controls={controls}
            instantReveal
          />
        </>
      )}

      {/* Tree 4: Deep distance - The massive Sequoia anchoring the path (Left) */}
      <ForestTree
        ref={tree4Ref}
        textureUrl="/tree_sequoia.webp"
        position={[-28, 2, -85]}
        scale={[65, 65]}
        controls={controls}
      />

      {/* Midground Density Layer */}
      {showMidgroundTrees && (
        <>
          <ForestTree
            textureUrl="/tree_2.webp"
            position={[35, 1, -70]}
            scale={[60, 60]}
            rotation={-0.04}
            controls={controls}
          />
          <ForestTree
            textureUrl="/tree_1.webp"
            position={[-38, 4, -40]}
            scale={[55, 55]}
            rotation={0.03}
            controls={controls}
          />
        </>
      )}

      {/* Tree 3: Mid-distance - The sharp Spruce (Right) */}
      <ForestTree
        ref={tree3Ref}
        textureUrl="/tree_spruce.webp"
        position={[25, 5, -55]}
        scale={[50, 50]}
        rotation={-0.05}
        controls={controls}
      />

      {/* Tree 2: Mid-foreground - The twisted Cherry Blossom (Left) */}
      <ForestTree
        ref={tree2Ref}
        textureUrl="/tree_cherry.webp"
        position={[-25, 5, -25]}
        scale={[60, 60]}
        rotation={0.05}
        controls={controls}
      />

      {/* Foreground Density Layer */}
      {showForegroundTrees && (
        <ForestTree
          textureUrl="/tree_3.webp"
          position={[32, -1, -10]}
          scale={[50, 50]}
          rotation={-0.02}
          controls={controls}
        />
      )}

      {/* Tree 1: Extreme foreground, framing the entrance - The stark Aspen (Right) */}
      <ForestTree
        ref={tree1Ref}
        textureUrl="/tree_aspen.webp"
        position={[25, -2, 0]}
        scale={[45, 45]}
        controls={controls}
      />

      {/* The Animated Stag — walks through the deep midground. */}
      {showStag && (
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
      )}
    </group>
  );
}
