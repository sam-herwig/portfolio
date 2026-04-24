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

function SkyDome({ skyGradient }: { skyGradient: [string, string, string, string, string] }) {
  const texture = useMemo<CanvasTexture | null>(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, skyGradient[0]);
    g.addColorStop(0.25, skyGradient[1]);
    g.addColorStop(0.5, skyGradient[2]);
    g.addColorStop(0.75, skyGradient[3]);
    g.addColorStop(1.0, skyGradient[4]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 512);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [skyGradient]);

  return (
    <mesh>
      <sphereGeometry args={[SKY_RADIUS, 32, 32]} />
      {texture ? (
        <meshBasicMaterial map={texture} side={BackSide} fog={false} depthWrite={false} />
      ) : (
        <meshBasicMaterial color={skyGradient[4]} side={BackSide} fog={false} depthWrite={false} />
      )}
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
      depthTest: false,
      fog: false,
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

function BankBillboard({
  texPath,
  x,
  y,
  z,
  w,
  h,
  alpha = 1,
}: {
  texPath: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  alpha?: number;
}) {
  const texture = useTexture(texPath, (loaded) => {
    const t = (Array.isArray(loaded) ? loaded[0] : loaded) as Texture;
    t.colorSpace = SRGBColorSpace;
    t.magFilter = LinearFilter;
    t.minFilter = LinearFilter;
  }) as Texture;

  const material = useMemo(() => {
    return new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: alpha,
    });
  }, [texture, alpha]);

  return (
    <mesh position={[x, y, z]} material={material}>
      <planeGeometry args={[w, h, 1, 1]} />
    </mesh>
  );
}

function WaterPlane({
  billboardX,
  palette,
  water,
}: {
  billboardX: number;
  palette: (typeof DEFAULT_PRESET)['palette'];
  water: (typeof DEFAULT_PRESET)['water'];
}) {
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
    (u.uColorCaustics.value as Color).set(palette.causticsColor);
    (u.uColorFoam.value as Color).set(palette.foamColor);
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
    u.uCausticIntensity.value = water.causticIntensity;
    u.uFoamThreshold.value = water.foamThreshold;
    u.uWaveSteepness.value = water.waveSteepness;

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

const DEFAULT_PRESET = {
  palette: {
    sky0: '#9ea7b2',
    sky1: '#aab2ba',
    sky2: '#bcc2c4',
    sky3: '#c7cbc8',
    sky4: '#cbccc6',
    horizon: '#0b1958',
    waterFar: '#2584c7',
    waterNear: '#6e9db1',
    rippleTint: '#b5b6b7',
    specColor: '#e8ecef',
    causticsColor: '#ffffff',
    foamColor: '#f0f4f5',
    sunX: -0.6,
    sunY: 0.4,
    sunZ: -0.6,
  },
  water: {
    fresnelExp: 2.45,
    reflStrength: 0.9,
    fresnelJitter: 0.04,
    bokashiWarp: 0.18,
    reflWarpU: 0.0,
    reflWarpV: 0.0,
    warpScale: 0.02,
    pigmentAmount: 0.3,
    edgeDarken: 0.14,
    crestSpecStrength: 0.59,
    crestSpecExp: 80,
    rippleTint: 0.4,
    causticIntensity: 0.23,
    foamThreshold: 0.01,
    waveSteepness: 0.03,
  },
  composition: {
    mountainX: 18.5,
    mountainY: 38.5,
    mountainZ: -116,
    mountainW: 180,
    mountainH: 71,
    mist1Y: 0.0,
    mist1Z: -35,
    mist1W: 383,
    mist1H: 2.4,
    mist1Alpha: 0.26,
    mist1Tint: '#e1e3de',
    mist2Y: 4.7,
    mist2Z: -96,
    mist2W: 400,
    mist2H: 9.7,
    mist2Alpha: 0.51,
    mist2Tint: '#e1e3de',
    fogColor: '#414b4b',
    fogDensity: 0.01,
    bankFarX: 1.0,
    bankFarY: 11.5,
    bankFarZ: -129,
    bankFarW: 127,
    bankFarH: 41,
    bankFarAlpha: 1.0,
  },
};

const PRESETS: Record<
  string,
  {
    palette?: Partial<typeof DEFAULT_PRESET.palette>;
    water?: Partial<typeof DEFAULT_PRESET.water>;
    composition?: Partial<typeof DEFAULT_PRESET.composition>;
  }
> = {
  Default: DEFAULT_PRESET,
  BloodMoon: {
    palette: {
      sky0: '#170303',
      sky1: '#3d0808',
      sky2: '#660b0b',
      sky3: '#991111',
      sky4: '#cc1b1b',
      horizon: '#3d0808',
      waterFar: '#1a0404',
      waterNear: '#3d1211',
      rippleTint: '#8a2b28',
      specColor: '#f28e85',
      causticsColor: '#f28e85',
      foamColor: '#f7c8c3',
      sunX: -0.6,
      sunY: 0.4,
      sunZ: -0.6,
    },
    water: {
      fresnelExp: 3.5,
      reflStrength: 0.95,
      pigmentAmount: 0.4,
      edgeDarken: 0.4,
      crestSpecStrength: 0.8,
      rippleTint: 0.5,
    },
    composition: {
      fogColor: '#170303',
      fogDensity: 0.02,
      mist1Tint: '#3d0808',
      mist2Tint: '#1a0404',
      mist1Alpha: 0.4,
      mist2Alpha: 0.6,
    },
  },
  EtherealDawn: {
    palette: {
      sky0: '#4b5773',
      sky1: '#7b7b96',
      sky2: '#aeb1bf',
      sky3: '#d6ced6',
      sky4: '#f2e8ef',
      horizon: '#7b7b96',
      waterFar: '#53658a',
      waterNear: '#8ba2cc',
      rippleTint: '#ccd9f0',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#ffffff',
      sunX: 0.4,
      sunY: 0.3,
      sunZ: 0.8,
    },
    composition: {
      fogColor: '#8a8e9e',
      fogDensity: 0.015,
      mist1Tint: '#e6dce3',
      mist2Tint: '#c4bcc2',
      mist1Alpha: 0.3,
      mist2Alpha: 0.5,
    },
  },
  AbyssalNight: {
    palette: {
      sky0: '#010205',
      sky1: '#030814',
      sky2: '#050d24',
      sky3: '#071536',
      sky4: '#091c47',
      horizon: '#030814',
      waterFar: '#020612',
      waterNear: '#081738',
      rippleTint: '#1c3b80',
      specColor: '#4f85f5',
      causticsColor: '#4f85f5',
      foamColor: '#a1c2ff',
      sunX: 0.0,
      sunY: 0.8,
      sunZ: 0.0,
    },
    water: {
      fresnelExp: 5.0,
      reflStrength: 0.98,
      edgeDarken: 0.6,
      rippleTint: 0.2,
    },
    composition: {
      fogColor: '#01030a',
      fogDensity: 0.025,
      mist1Tint: '#040b1c',
      mist2Tint: '#020612',
      mist1Alpha: 0.5,
      mist2Alpha: 0.7,
    },
  },
  GoldenHour: {
    palette: {
      sky0: '#3b5c87',
      sky1: '#748eb5',
      sky2: '#c2b3aa',
      sky3: '#e8b87d',
      sky4: '#f79a40',
      horizon: '#e8b87d',
      waterFar: '#446894',
      waterNear: '#8c8c73',
      rippleTint: '#fcdcb8',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#ffffff',
      sunX: -0.4,
      sunY: 0.2,
      sunZ: -0.2,
    },
    water: {
      fresnelExp: 2.0,
      reflStrength: 0.92,
      pigmentAmount: 0.25,
      crestSpecStrength: 0.7,
    },
    composition: {
      fogColor: '#7a6a58',
      fogDensity: 0.01,
      mist1Tint: '#e0c9b1',
      mist2Tint: '#bd9e82',
      mist1Alpha: 0.25,
      mist2Alpha: 0.45,
    },
  },
  DeepNight: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#030614',
      horizon: '#030614',
      waterFar: '#0b193d',
      waterNear: '#1c2d54',
      rippleTint: '#4a5b78',
      specColor: '#ffffff',
      causticsColor: '#a0b4d4',
      foamColor: '#d6e2f2',
      sunX: -0.6,
      sunY: 0.8,
      sunZ: -0.8,
    },
    water: {
      fresnelExp: 3.5,
      reflStrength: 0.95,
      fresnelJitter: 0.02,
      bokashiWarp: 0.15,
      reflWarpU: 0.01,
      reflWarpV: 0.01,
      warpScale: 0.03,
      pigmentAmount: 0.4,
      edgeDarken: 0.4,
      crestSpecStrength: 0.8,
      crestSpecExp: 120,
      rippleTint: 0.5,
      causticIntensity: 0.15,
      foamThreshold: 0.02,
      waveSteepness: 0.02,
    },
    composition: {
      fogColor: '#0a1024',
      fogDensity: 0.015,
      mist1Tint: '#1c2a47',
      mist2Tint: '#101a30',
      mist1Alpha: 0.4,
      mist2Alpha: 0.6,
    },
  },
  Frost: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#c6d1d9',
      horizon: '#c6d1d9',
      waterFar: '#87a2ba',
      waterNear: '#a3bedb',
      rippleTint: '#d8e5f2',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#ffffff',
      sunX: 0.2,
      sunY: 0.5,
      sunZ: -0.4,
    },
    water: {
      fresnelExp: 1.5,
      reflStrength: 0.85,
      fresnelJitter: 0.05,
      bokashiWarp: 0.2,
      reflWarpU: 0.03,
      reflWarpV: 0.02,
      warpScale: 0.05,
      pigmentAmount: 0.2,
      edgeDarken: 0.05,
      crestSpecStrength: 0.6,
      crestSpecExp: 60,
      rippleTint: 0.3,
      causticIntensity: 0.4,
      foamThreshold: -0.01,
      waveSteepness: 0.04,
    },
    composition: {
      fogColor: '#bac7d4',
      fogDensity: 0.012,
      mist1Tint: '#dce5ed',
      mist2Tint: '#b2c5d6',
      mist1Alpha: 0.3,
      mist2Alpha: 0.4,
    },
  },
  Storm: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#11151c',
      horizon: '#11151c',
      waterFar: '#2b3947',
      waterNear: '#4c6173',
      rippleTint: '#7a91a3',
      specColor: '#b3c4d1',
      causticsColor: '#ffffff',
      foamColor: '#e0eaf2',
      sunX: -0.8,
      sunY: 0.2,
      sunZ: -0.2,
    },
    water: {
      fresnelExp: 4.0,
      reflStrength: 0.8,
      fresnelJitter: 0.1,
      bokashiWarp: 0.25,
      reflWarpU: 0.05,
      reflWarpV: 0.04,
      warpScale: 0.1,
      pigmentAmount: 0.6,
      edgeDarken: 0.3,
      crestSpecStrength: 0.4,
      crestSpecExp: 40,
      rippleTint: 0.6,
      causticIntensity: 0.1,
      foamThreshold: 0.05,
      waveSteepness: 0.08,
    },
    composition: {
      fogColor: '#26313d',
      fogDensity: 0.025,
      mist1Tint: '#4f6478',
      mist2Tint: '#354657',
      mist1Alpha: 0.6,
      mist2Alpha: 0.7,
    },
  },
  Moonlight: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#000000',
      horizon: '#000000',
      waterFar: '#0d1d36',
      waterNear: '#2b4d75',
      rippleTint: '#8eaacc',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#f2f6fc',
      sunX: 0.0,
      sunY: 0.6,
      sunZ: 0.5,
    },
    water: {
      fresnelExp: 5.0,
      reflStrength: 0.98,
      fresnelJitter: 0.01,
      bokashiWarp: 0.1,
      reflWarpU: 0.0,
      reflWarpV: 0.0,
      warpScale: 0.01,
      pigmentAmount: 0.2,
      edgeDarken: 0.6,
      crestSpecStrength: 1.0,
      crestSpecExp: 180,
      rippleTint: 0.2,
      causticIntensity: 0.3,
      foamThreshold: 0.0,
      waveSteepness: 0.01,
    },
    composition: {
      fogColor: '#050a12',
      fogDensity: 0.008,
      mist1Tint: '#1b3252',
      mist2Tint: '#0d1b30',
      mist1Alpha: 0.2,
      mist2Alpha: 0.3,
    },
  },
  MoonlightMist: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#080c14',
      horizon: '#080c14',
      waterFar: '#11223b',
      waterNear: '#36567a',
      rippleTint: '#a4bccc',
      specColor: '#eef2f5',
      causticsColor: '#dbe5f0',
      foamColor: '#ffffff',
      sunX: 0.1,
      sunY: 0.4,
      sunZ: 0.6,
    },
    water: {
      fresnelExp: 4.5,
      reflStrength: 0.9,
      fresnelJitter: 0.03,
      bokashiWarp: 0.15,
      reflWarpU: 0.02,
      reflWarpV: 0.02,
      warpScale: 0.04,
      pigmentAmount: 0.3,
      edgeDarken: 0.5,
      crestSpecStrength: 0.8,
      crestSpecExp: 120,
      rippleTint: 0.3,
      causticIntensity: 0.2,
      foamThreshold: 0.01,
      waveSteepness: 0.015,
    },
    composition: {
      fogColor: '#0e1726',
      fogDensity: 0.018,
      mist1Tint: '#2b4566',
      mist2Tint: '#1a2e47',
      mist1Alpha: 0.5,
      mist2Alpha: 0.6,
    },
  },
  MoonlightStorm: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#000000',
      horizon: '#000000',
      waterFar: '#081426',
      waterNear: '#1c3854',
      rippleTint: '#6b8aab',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#eef4fa',
      sunX: -0.2,
      sunY: 0.5,
      sunZ: 0.4,
    },
    water: {
      fresnelExp: 6.0,
      reflStrength: 0.95,
      fresnelJitter: 0.08,
      bokashiWarp: 0.2,
      reflWarpU: 0.04,
      reflWarpV: 0.03,
      warpScale: 0.08,
      pigmentAmount: 0.4,
      edgeDarken: 0.7,
      crestSpecStrength: 0.9,
      crestSpecExp: 100,
      rippleTint: 0.5,
      causticIntensity: 0.4,
      foamThreshold: 0.03,
      waveSteepness: 0.06,
    },
    composition: {
      fogColor: '#03070d',
      fogDensity: 0.012,
      mist1Tint: '#12253d',
      mist2Tint: '#081426',
      mist1Alpha: 0.4,
      mist2Alpha: 0.5,
    },
  },
  MidnightLake: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#000000',
      horizon: '#000000',
      waterFar: '#050a12',
      waterNear: '#122238',
      rippleTint: '#526c8a',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#ffffff',
      sunX: 0.0,
      sunY: 0.7,
      sunZ: 0.7,
    },
    water: {
      fresnelExp: 7.0,
      reflStrength: 1.0,
      fresnelJitter: 0.0,
      bokashiWarp: 0.05,
      reflWarpU: 0.0,
      reflWarpV: 0.0,
      warpScale: 0.005,
      pigmentAmount: 0.1,
      edgeDarken: 0.8,
      crestSpecStrength: 1.2,
      crestSpecExp: 256,
      rippleTint: 0.1,
      causticIntensity: 0.1,
      foamThreshold: -0.02,
      waveSteepness: 0.005,
    },
    composition: {
      fogColor: '#000000',
      fogDensity: 0.005,
      mist1Tint: '#0c1a2e',
      mist2Tint: '#050a12',
      mist1Alpha: 0.1,
      mist2Alpha: 0.2,
    },
  },
  ClearMorning: {
    palette: {
      sky0: '#000000',
      sky1: '#111111',
      sky2: '#222222',
      sky3: '#333333',
      sky4: '#1a3375',
      horizon: '#1a3375',
      waterFar: '#338ce6',
      waterNear: '#80bad9',
      rippleTint: '#dbe9f0',
      specColor: '#ffffff',
      causticsColor: '#ffffff',
      foamColor: '#ffffff',
      sunX: -0.4,
      sunY: 0.4,
      sunZ: -0.5,
    },
    water: {
      fresnelExp: 2.0,
      reflStrength: 0.92,
      fresnelJitter: 0.03,
      bokashiWarp: 0.12,
      reflWarpU: 0.01,
      reflWarpV: 0.01,
      warpScale: 0.02,
      pigmentAmount: 0.25,
      edgeDarken: 0.1,
      crestSpecStrength: 0.7,
      crestSpecExp: 90,
      rippleTint: 0.3,
      causticIntensity: 0.3,
      foamThreshold: 0.02,
      waveSteepness: 0.03,
    },
    composition: {
      fogColor: '#587382',
      fogDensity: 0.009,
      mist1Tint: '#f0f5f7',
      mist2Tint: '#d8e5eb',
      mist1Alpha: 0.2,
      mist2Alpha: 0.4,
    },
  },
};

function SceneContent() {
  const [palette, setPalette] = useControls(
    'Palette',
    () => ({
      sky0: DEFAULT_PRESET.palette.sky0,
      sky1: DEFAULT_PRESET.palette.sky1,
      sky2: DEFAULT_PRESET.palette.sky2,
      sky3: DEFAULT_PRESET.palette.sky3,
      sky4: DEFAULT_PRESET.palette.sky4,
      horizon: DEFAULT_PRESET.palette.horizon,
      waterFar: DEFAULT_PRESET.palette.waterFar,
      waterNear: DEFAULT_PRESET.palette.waterNear,
      rippleTint: DEFAULT_PRESET.palette.rippleTint,
      specColor: DEFAULT_PRESET.palette.specColor,
      causticsColor: DEFAULT_PRESET.palette.causticsColor,
      foamColor: DEFAULT_PRESET.palette.foamColor,
      sunX: { value: DEFAULT_PRESET.palette.sunX, min: -1, max: 1, step: 0.01 },
      sunY: { value: DEFAULT_PRESET.palette.sunY, min: 0, max: 1, step: 0.01 },
      sunZ: { value: DEFAULT_PRESET.palette.sunZ, min: -1, max: 1, step: 0.01 },
    }),
    { collapsed: false },
  );

  const [water, setWater] = useControls(
    'Water',
    () => ({
      fresnelExp: { value: DEFAULT_PRESET.water.fresnelExp, min: 0.5, max: 10, step: 0.05 },
      reflStrength: { value: DEFAULT_PRESET.water.reflStrength, min: 0, max: 1, step: 0.01 },
      fresnelJitter: { value: DEFAULT_PRESET.water.fresnelJitter, min: 0, max: 0.5, step: 0.005 },
      bokashiWarp: { value: DEFAULT_PRESET.water.bokashiWarp, min: 0, max: 0.5, step: 0.005 },
      reflWarpU: { value: DEFAULT_PRESET.water.reflWarpU, min: 0, max: 0.1, step: 0.001 },
      reflWarpV: { value: DEFAULT_PRESET.water.reflWarpV, min: 0, max: 0.1, step: 0.001 },
      warpScale: { value: DEFAULT_PRESET.water.warpScale, min: 0, max: 0.6, step: 0.005 },
      pigmentAmount: { value: DEFAULT_PRESET.water.pigmentAmount, min: 0, max: 1, step: 0.01 },
      edgeDarken: { value: DEFAULT_PRESET.water.edgeDarken, min: 0, max: 1, step: 0.005 },
      crestSpecStrength: { value: DEFAULT_PRESET.water.crestSpecStrength, min: 0, max: 2, step: 0.01 },
      crestSpecExp: { value: DEFAULT_PRESET.water.crestSpecExp, min: 4, max: 256, step: 1 },
      rippleTint: { value: DEFAULT_PRESET.water.rippleTint, min: 0, max: 1, step: 0.005 },
      causticIntensity: { value: DEFAULT_PRESET.water.causticIntensity, min: 0, max: 1, step: 0.01 },
      foamThreshold: { value: DEFAULT_PRESET.water.foamThreshold, min: -0.05, max: 0.1, step: 0.001 },
      waveSteepness: { value: DEFAULT_PRESET.water.waveSteepness, min: 0, max: 0.2, step: 0.001 },
    }),
    { collapsed: true },
  );

  const [composition, setComposition] = useControls(
    'Composition',
    () => ({
      mountain: folder({
        mountainX: { value: DEFAULT_PRESET.composition.mountainX, min: -80, max: 80, step: 0.5 },
        mountainY: { value: DEFAULT_PRESET.composition.mountainY, min: -5, max: 40, step: 0.5 },
        mountainZ: { value: DEFAULT_PRESET.composition.mountainZ, min: -200, max: -20, step: 1 },
        mountainW: { value: DEFAULT_PRESET.composition.mountainW, min: 40, max: 400, step: 1 },
        mountainH: { value: DEFAULT_PRESET.composition.mountainH, min: 10, max: 120, step: 1 },
      }),
      mist1: folder({
        mist1Y: { value: DEFAULT_PRESET.composition.mist1Y, min: 0, max: 20, step: 0.1 },
        mist1Z: { value: DEFAULT_PRESET.composition.mist1Z, min: -180, max: -10, step: 1 },
        mist1W: { value: DEFAULT_PRESET.composition.mist1W, min: 40, max: 600, step: 1 },
        mist1H: { value: DEFAULT_PRESET.composition.mist1H, min: 0.5, max: 20, step: 0.1 },
        mist1Alpha: { value: DEFAULT_PRESET.composition.mist1Alpha, min: 0, max: 1, step: 0.01 },
        mist1Tint: DEFAULT_PRESET.composition.mist1Tint,
      }),
      mist2: folder({
        mist2Y: { value: DEFAULT_PRESET.composition.mist2Y, min: 0, max: 25, step: 0.1 },
        mist2Z: { value: DEFAULT_PRESET.composition.mist2Z, min: -180, max: -10, step: 1 },
        mist2W: { value: DEFAULT_PRESET.composition.mist2W, min: 40, max: 600, step: 1 },
        mist2H: { value: DEFAULT_PRESET.composition.mist2H, min: 0.5, max: 20, step: 0.1 },
        mist2Alpha: { value: DEFAULT_PRESET.composition.mist2Alpha, min: 0, max: 1, step: 0.01 },
        mist2Tint: DEFAULT_PRESET.composition.mist2Tint,
      }),
      fog: folder({
        fogColor: DEFAULT_PRESET.composition.fogColor,
        fogDensity: { value: DEFAULT_PRESET.composition.fogDensity, min: 0, max: 0.05, step: 0.0005 },
      }),
      bankFar: folder({
        bankFarX: { value: DEFAULT_PRESET.composition.bankFarX, min: -80, max: 80, step: 0.5 },
        bankFarY: { value: DEFAULT_PRESET.composition.bankFarY, min: -5, max: 40, step: 0.5 },
        bankFarZ: { value: DEFAULT_PRESET.composition.bankFarZ, min: -200, max: -20, step: 1 },
        bankFarW: { value: DEFAULT_PRESET.composition.bankFarW, min: 40, max: 400, step: 1 },
        bankFarH: { value: DEFAULT_PRESET.composition.bankFarH, min: 10, max: 120, step: 1 },
        bankFarAlpha: { value: DEFAULT_PRESET.composition.bankFarAlpha, min: 0, max: 1, step: 0.01 },
      }),
    }),
    { collapsed: false },
  );

  useControls('Presets', {
    theme: {
      options: Object.keys(PRESETS),
      value: 'Default',
      onChange: (v) => {
        const p = PRESETS[v];
        if (p) {
          if (p.palette) setPalette(p.palette);
          if (p.water) setWater(p.water);
          if (p.composition) setComposition(p.composition);
        }
      },
    },
  });

  return (
    <>
      <fogExp2 attach="fog" args={[composition.fogColor, composition.fogDensity]} />
      <CameraParallax />
      <SkyDome skyGradient={[palette.sky0, palette.sky1, palette.sky2, palette.sky3, palette.sky4]} />
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
      <BankBillboard
        texPath="/grove/03-far-bank.webp"
        x={composition.bankFarX}
        y={composition.bankFarY}
        z={composition.bankFarZ}
        w={composition.bankFarW}
        h={composition.bankFarH}
        alpha={composition.bankFarAlpha}
      />
      <WaterPlane billboardX={composition.mountainX} palette={palette} water={water} />
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
