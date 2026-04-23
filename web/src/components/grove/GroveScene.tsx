'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import { folder, useControls } from 'leva';
import { forwardRef, Suspense, useEffect, useMemo, useRef } from 'react';
import type { Mesh, ShaderMaterial, Texture } from 'three';
import { BackSide, CanvasTexture, Color, LinearFilter, MeshBasicMaterial, SRGBColorSpace } from 'three';
import { MAX_RIPPLES, WaterShaderMaterial } from '@/components/shaders/WaterMaterial';
import { PaperOverlayEffect } from '@/components/grove/PaperOverlay';

/**
 * GroveScene — /shhhh dawn lake, true 3D.
 *
 * First-person view at a lakeshore looking across still water toward a
 * distant painted mountain silhouette. All values below are Leva-driven
 * so Sam can tune composition, palette, water shader, and paper overlay
 * in real time and hand back the best numbers.
 */

const WATER_SIZE = 400;
const WATER_SEGMENTS = 192;
const SKY_RADIUS = 150;

interface RippleSlot {
  x: number;
  z: number;
  t0: number;
  strength: number;
}

function SkyDome() {
  const texture = useMemo<CanvasTexture | null>(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, '#9ea7b2');
    g.addColorStop(0.25, '#aab2ba');
    g.addColorStop(0.55, '#bcc2c4');
    g.addColorStop(0.78, '#c7cbc8');
    g.addColorStop(1.0, '#cbccc6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 512);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  if (!texture) return null;
  return (
    <mesh>
      <sphereGeometry args={[SKY_RADIUS, 32, 32]} />
      <meshBasicMaterial map={texture} side={BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function MountainBillboard({ x, y, z, w, h }: { x: number; y: number; z: number; w: number; h: number }) {
  const texture = useTexture('/grove/02-mountains.webp', (loaded) => {
    const t = (Array.isArray(loaded) ? loaded[0] : loaded) as Texture;
    t.colorSpace = SRGBColorSpace;
    t.magFilter = LinearFilter;
    t.minFilter = LinearFilter;
    t.anisotropy = 4;
  }) as Texture;

  const material = useMemo(() => {
    const mat = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        float _bottomFade = 1.0 - smoothstep(0.75, 1.0, 1.0 - vMapUv.y);
        diffuseColor.a *= _bottomFade;
        `,
      );
    };
    return mat;
  }, [texture]);

  return (
    <mesh position={[x, y, z]} material={material}>
      <planeGeometry args={[w, h, 1, 1]} />
    </mesh>
  );
}

/**
 * MistBand — horizontal shan-shui strip. CanvasTexture carries the vertical
 * alpha gradient shape; material.opacity scales overall intensity so Leva can
 * drive alpha live without rebuilding the texture.
 */
function MistBand({
  y,
  z,
  w,
  h,
  alpha,
  tint,
}: {
  y: number;
  z: number;
  w: number;
  h: number;
  alpha: number;
  tint: string;
}) {
  const texture = useMemo<CanvasTexture | null>(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,1)');
    g.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  const matRef = useRef<MeshBasicMaterial | null>(null);
  useEffect(() => {
    if (matRef.current) {
      matRef.current.opacity = alpha;
      matRef.current.color.set(tint);
    }
  }, [alpha, tint]);

  if (!texture) return null;
  return (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[w, h, 1, 1]} />
      <meshBasicMaterial ref={matRef} map={texture} transparent depthWrite={false} fog={false} opacity={alpha} />
    </mesh>
  );
}

function WaterPlane({ billboardX }: { billboardX: number }) {
  const meshRef = useRef<Mesh | null>(null);
  const matRef = useRef<ShaderMaterial | null>(null);
  const ripples = useRef<RippleSlot[]>([]);
  const ripplesBuf = useRef<Float32Array | null>(null);
  const startedAt = useRef<number | null>(null);
  const lastClickAt = useRef<number>(-Infinity);

  const mountainTex = useTexture('/grove/02-mountains.webp', (loaded) => {
    const t = (Array.isArray(loaded) ? loaded[0] : loaded) as Texture;
    t.colorSpace = SRGBColorSpace;
    t.magFilter = LinearFilter;
    t.minFilter = LinearFilter;
  }) as Texture;

  useEffect(() => {
    startedAt.current = performance.now();
    ripplesBuf.current = new Float32Array(MAX_RIPPLES * 4);
  }, []);

  // ── Palette (vec3 colors via in-place .set so we don't reallocate) ──
  const palette = useControls(
    'Palette',
    {
      horizon: '#c7ccc9',
      waterFar: '#6b7a85',
      waterNear: '#b2b9b8',
      rippleTint: '#8a9299',
      specColor: '#e8ecef',
      sunX: { value: -0.3, min: -1, max: 1, step: 0.01 },
      sunY: { value: 0.4, min: 0, max: 1, step: 0.01 },
      sunZ: { value: -0.6, min: -1, max: 1, step: 0.01 },
    },
    { collapsed: false },
  );

  // ── Water feel knobs ──
  const water = useControls(
    'Water',
    {
      fresnelExp: { value: 4.0, min: 0.5, max: 10, step: 0.05 },
      reflStrength: { value: 0.9, min: 0, max: 1, step: 0.01 },
      fresnelJitter: { value: 0.08, min: 0, max: 0.5, step: 0.005 },
      bokashiWarp: { value: 0.12, min: 0, max: 0.5, step: 0.005 },
      reflWarpU: { value: 0.022, min: 0, max: 0.1, step: 0.001 },
      reflWarpV: { value: 0.016, min: 0, max: 0.1, step: 0.001 },
      warpScale: { value: 0.15, min: 0.02, max: 0.6, step: 0.005 },
      pigmentAmount: { value: 0.3, min: 0, max: 1, step: 0.01 },
      edgeDarken: { value: 0.14, min: 0, max: 0.5, step: 0.005 },
      crestSpecStrength: { value: 0.35, min: 0, max: 2, step: 0.01 },
      crestSpecExp: { value: 80, min: 4, max: 256, step: 1 },
      rippleTint: { value: 0.12, min: 0, max: 0.5, step: 0.005 },
    },
    { collapsed: true },
  );

  useFrame(() => {
    if (!matRef.current || startedAt.current === null || !ripplesBuf.current) return;
    const now = (performance.now() - startedAt.current) / 1000;
    const u = matRef.current.uniforms;
    u.uTime.value = now;
    u.uMountainTex.value = mountainTex;
    u.uBillboardX.value = billboardX;

    (u.uColorHorizon.value as Color).set(palette.horizon);
    (u.uColorWaterFar.value as Color).set(palette.waterFar);
    (u.uColorWaterNear.value as Color).set(palette.waterNear);
    (u.uColorRippleTint.value as Color).set(palette.rippleTint);
    (u.uColorSpec.value as Color).set(palette.specColor);
    u.uSunDir.value.set(palette.sunX, palette.sunY, palette.sunZ).normalize();

    u.uFresnelExp.value = water.fresnelExp;
    u.uReflStrength.value = water.reflStrength;
    u.uFresnelJitter.value = water.fresnelJitter;
    u.uBokashiWarp.value = water.bokashiWarp;
    u.uReflWarpU.value = water.reflWarpU;
    u.uReflWarpV.value = water.reflWarpV;
    u.uWarpScale.value = water.warpScale;
    u.uPigmentAmount.value = water.pigmentAmount;
    u.uEdgeDarken.value = water.edgeDarken;
    u.uCrestSpecStrength.value = water.crestSpecStrength;
    u.uCrestSpecExp.value = water.crestSpecExp;
    u.uRippleTint.value = water.rippleTint;

    ripples.current = ripples.current.filter((r) => now - r.t0 < 3.5);
    const buf = ripplesBuf.current;
    buf.fill(0);
    for (let i = 0; i < ripples.current.length && i < MAX_RIPPLES; i++) {
      const r = ripples.current[i];
      buf[i * 4 + 0] = r.x;
      buf[i * 4 + 1] = r.z;
      buf[i * 4 + 2] = r.t0;
      buf[i * 4 + 3] = r.strength;
    }
    u.uRipples.value = buf;
  });

  const handlePointerDown = (e: { point: { x: number; z: number } }) => {
    if (startedAt.current === null) return;
    const now = (performance.now() - startedAt.current) / 1000;
    const dt = now - lastClickAt.current;
    const strength = Math.max(0.3, Math.min(1.0, dt * 1.5));
    lastClickAt.current = now;
    ripples.current.push({ x: e.point.x, z: e.point.z, t0: now, strength });
    if (ripples.current.length > MAX_RIPPLES) {
      ripples.current = ripples.current.slice(-MAX_RIPPLES);
    }
  };

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onPointerDown={handlePointerDown}>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE, WATER_SEGMENTS, WATER_SEGMENTS]} />
      {/* @ts-expect-error — drei extend registers this intrinsic at runtime */}
      <waterShaderMaterial ref={matRef} key={WaterShaderMaterial.key} />
    </mesh>
  );
}

function CameraParallax() {
  const mouse = useRef({ x: 0, y: 0 });
  const start = useRef(0);
  const baseTarget = useMemo(() => ({ x: 0, y: 0.9, z: -80 }), []);

  useEffect(() => {
    start.current = performance.now();
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((state) => {
    const cam = state.camera;
    const elapsed = (performance.now() - start.current) / 1000;
    const tx = mouse.current.x * 1.6 + Math.sin(elapsed * 0.07) * 0.4;
    const ty = -mouse.current.y * 0.8 + Math.cos(elapsed * 0.05) * 0.2;
    cam.position.x += (0 - cam.position.x) * 0.05;
    cam.position.y += (1.6 - cam.position.y) * 0.05;
    cam.lookAt(baseTarget.x + tx, baseTarget.y + ty, baseTarget.z);
  });

  return null;
}

function SceneContent() {
  const composition = useControls(
    'Composition',
    {
      mountain: folder({
        mountainX: { value: -22, min: -80, max: 80, step: 0.5 },
        mountainY: { value: 14, min: -5, max: 40, step: 0.5 },
        mountainZ: { value: -95, min: -200, max: -20, step: 1 },
        mountainW: { value: 180, min: 40, max: 400, step: 1 },
        mountainH: { value: 38, min: 10, max: 120, step: 1 },
      }),
      mist1: folder({
        mist1Y: { value: 2.4, min: 0, max: 20, step: 0.1 },
        mist1Z: { value: -55, min: -180, max: -10, step: 1 },
        mist1W: { value: 320, min: 40, max: 600, step: 1 },
        mist1H: { value: 5.0, min: 0.5, max: 20, step: 0.1 },
        mist1Alpha: { value: 0.32, min: 0, max: 1, step: 0.01 },
        mist1Tint: '#e1e3de',
      }),
      mist2: folder({
        mist2Y: { value: 6.0, min: 0, max: 25, step: 0.1 },
        mist2Z: { value: -82, min: -180, max: -10, step: 1 },
        mist2W: { value: 400, min: 40, max: 600, step: 1 },
        mist2H: { value: 7.0, min: 0.5, max: 20, step: 0.1 },
        mist2Alpha: { value: 0.42, min: 0, max: 1, step: 0.01 },
        mist2Tint: '#e1e3de',
      }),
      fog: folder({
        fogColor: '#cdd1cc',
        fogDensity: { value: 0.0095, min: 0, max: 0.05, step: 0.0005 },
      }),
    },
    { collapsed: false },
  );

  return (
    <>
      <fogExp2 attach="fog" args={[composition.fogColor, composition.fogDensity]} />
      <CameraParallax />
      <SkyDome />
      <MountainBillboard
        x={composition.mountainX}
        y={composition.mountainY}
        z={composition.mountainZ}
        w={composition.mountainW}
        h={composition.mountainH}
      />
      <MistBand
        y={composition.mist1Y}
        z={composition.mist1Z}
        w={composition.mist1W}
        h={composition.mist1H}
        alpha={composition.mist1Alpha}
        tint={composition.mist1Tint}
      />
      <MistBand
        y={composition.mist2Y}
        z={composition.mist2Z}
        w={composition.mist2W}
        h={composition.mist2H}
        alpha={composition.mist2Alpha}
        tint={composition.mist2Tint}
      />
      <WaterPlane billboardX={composition.mountainX} />
    </>
  );
}

const PaperPass = forwardRef<PaperOverlayEffect>(function PaperPass(_props, ref) {
  const effect = useMemo(() => new PaperOverlayEffect(), []);

  const paper = useControls(
    'Paper',
    {
      toothAmp: { value: 0.05, min: 0, max: 0.3, step: 0.005 },
      toothScale: { value: 600, min: 50, max: 3000, step: 10 },
      grainAmount: { value: 0.018, min: 0, max: 0.1, step: 0.001 },
      grainScale: { value: 2400, min: 200, max: 6000, step: 50 },
      warmAmount: { value: 0.28, min: 0, max: 1, step: 0.01 },
      warmR: { value: 1.03, min: 0.9, max: 1.2, step: 0.005 },
      warmG: { value: 1.008, min: 0.9, max: 1.2, step: 0.005 },
      warmB: { value: 0.975, min: 0.9, max: 1.2, step: 0.005 },
      vignetteStrength: { value: 0.15, min: 0, max: 0.5, step: 0.005 },
      vignetteInner: { value: 0.4, min: 0, max: 1, step: 0.01 },
      vignetteOuter: { value: 1.05, min: 0.5, max: 2, step: 0.01 },
    },
    { collapsed: true },
  );

  useEffect(() => {
    effect.set('uToothAmp', paper.toothAmp);
    effect.set('uToothScale', paper.toothScale);
    effect.set('uGrainAmount', paper.grainAmount);
    effect.set('uGrainScale', paper.grainScale);
    effect.set('uWarmAmount', paper.warmAmount);
    (effect.uniforms.get('uWarmTint')!.value as Color).setRGB(paper.warmR, paper.warmG, paper.warmB);
    effect.set('uVignetteStrength', paper.vignetteStrength);
    effect.set('uVignetteInner', paper.vignetteInner);
    effect.set('uVignetteOuter', paper.vignetteOuter);
  }, [
    effect,
    paper.toothAmp,
    paper.toothScale,
    paper.grainAmount,
    paper.grainScale,
    paper.warmAmount,
    paper.warmR,
    paper.warmG,
    paper.warmB,
    paper.vignetteStrength,
    paper.vignetteInner,
    paper.vignetteOuter,
  ]);

  return <primitive ref={ref} object={effect} dispose={null} />;
});

export default function GroveScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 2], fov: 38, near: 0.1, far: 250 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
        <EffectComposer>
          <PaperPass />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
