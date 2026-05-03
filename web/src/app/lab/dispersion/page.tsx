'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text3D, Center, useFBO, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { BackSide, Group, Mesh, MeshDepthMaterial, type PerspectiveCamera, RGBADepthPacking } from 'three';
import DispersionMaterial, { makeDispersionUniforms } from '@/components/lab/DispersionMaterial';
import { useMouseVelocity } from '@/lib/useMouseVelocity';

const uniforms = makeDispersionUniforms();

type Mode = 'drei' | 'rgb' | 'rygcbv';

const MODE_LABEL: Record<Mode, string> = {
  drei: '1 — drei baseline (MeshTransmissionMaterial)',
  rgb: '2 — 3-channel per-channel IOR',
  rygcbv: '3 — rygcbv 6-channel spectral split',
};

const Backdrop = forwardRef<Group>(function Backdrop(_, ref) {
  return (
    <group ref={ref} position={[0, 0, -2]}>
      <mesh position={[-2.5, 0, 0]}>
        <planeGeometry args={[1.5, 5]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>
      <mesh position={[-0.85, 0, 0]}>
        <planeGeometry args={[1.5, 5]} />
        <meshBasicMaterial color="#33ccff" />
      </mesh>
      <mesh position={[0.85, 0, 0]}>
        <planeGeometry args={[1.5, 5]} />
        <meshBasicMaterial color="#c4f57a" />
      </mesh>
      <mesh position={[2.5, 0, 0]}>
        <planeGeometry args={[1.5, 5]} />
        <meshBasicMaterial color="#fafafa" />
      </mesh>
    </group>
  );
});

interface DispersionTextProps {
  mode: Mode;
  backdropRef: React.RefObject<Group | null>;
}

function useDispersionControls() {
  useControls('Dispersion · IOR', {
    iorR: {
      value: 1.15,
      min: 1.0,
      max: 2.0,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uIorR.value = v;
      },
    },
    iorG: {
      value: 1.18,
      min: 1.0,
      max: 2.0,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uIorG.value = v;
      },
    },
    iorB: {
      value: 1.22,
      min: 1.0,
      max: 2.0,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uIorB.value = v;
      },
    },
    refractPower: {
      value: 0.4,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uRefractPower.value = v;
      },
    },
    fresnelPower: {
      value: 4.0,
      min: 0,
      max: 16,
      step: 0.1,
      onChange: (v: number) => {
        uniforms.uFresnelPower.value = v;
      },
    },
    saturation: {
      value: 1.1,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uSaturation.value = v;
      },
    },
  });

  useControls('Glass body', {
    absorption: {
      value: 1.6,
      min: 0,
      max: 8,
      step: 0.05,
      onChange: (v: number) => {
        uniforms.uAbsorption.value = v;
      },
    },
    absorbR: {
      value: 0.6,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uAbsorptionColor.value.x = v;
      },
    },
    absorbG: {
      value: 0.4,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uAbsorptionColor.value.y = v;
      },
    },
    absorbB: {
      value: 0.3,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.uAbsorptionColor.value.z = v;
      },
    },
  });

  useControls('Breath', {
    breath: {
      value: 0.012,
      min: 0,
      max: 0.05,
      step: 0.001,
      onChange: (v: number) => {
        uniforms.uBreath.value = v;
      },
    },
  });
}

function DispersionText({ mode, backdropRef }: DispersionTextProps) {
  const meshRef = useRef<Mesh>(null);
  const sceneFbo = useFBO();
  const backDepthFbo = useFBO();
  const velocity = useMouseVelocity();
  const { gl, scene, camera, size, viewport } = useThree();

  const backDepthMat = useMemo(
    () =>
      new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        side: BackSide,
      }),
    [],
  );

  useEffect(() => {
    uniforms.uMode.value = mode === 'rygcbv' ? 1 : 0;
  }, [mode]);

  useFrame((state) => {
    uniforms.uVelocity.value = velocity.current.magnitude;
    uniforms.uTime.value = state.clock.elapsedTime;

    if (!meshRef.current) return;
    if (mode === 'drei') return;

    // Pass 1: scene minus text → sceneFbo
    meshRef.current.visible = false;
    gl.setRenderTarget(sceneFbo);
    gl.clear();
    gl.render(scene, camera);

    // Pass 2: text only with back-face depth packed as RGBA → backDepthFbo.
    // Swap the text's material to depth-RGBA, hide the backdrop so the FBO
    // only captures the text mesh, render, restore.
    meshRef.current.visible = true;
    const original = meshRef.current.material;
    meshRef.current.material = backDepthMat;
    if (backdropRef.current) backdropRef.current.visible = false;
    gl.setRenderTarget(backDepthFbo);
    gl.clear();
    gl.render(scene, camera);
    meshRef.current.material = original;
    if (backdropRef.current) backdropRef.current.visible = true;
    gl.setRenderTarget(null);

    const persp = camera as PerspectiveCamera;
    uniforms.uScene.value = sceneFbo.texture;
    uniforms.uBackDepth.value = backDepthFbo.texture;
    uniforms.uCameraNear.value = persp.near;
    uniforms.uCameraFar.value = persp.far;
    uniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
  });

  return (
    <Center>
      <Text3D
        ref={meshRef}
        font="/fonts/Fraunces.json"
        size={1.1}
        height={0.32}
        bevelEnabled
        bevelThickness={0.04}
        bevelSize={0.025}
        bevelOffset={0}
        bevelSegments={3}
        curveSegments={10}
        letterSpacing={-0.04}
      >
        Sam Herwig
        {mode === 'drei' ? (
          <MeshTransmissionMaterial
            transmission={1}
            ior={1.5}
            chromaticAberration={0.05}
            thickness={0.5}
            backside
            backsideThickness={0.8}
            samples={8}
            resolution={512}
            roughness={0}
          />
        ) : (
          <DispersionMaterial uniforms={uniforms} />
        )}
      </Text3D>
    </Center>
  );
}

export default function DispersionLab() {
  const [mode, setMode] = useState<Mode>('rygcbv');
  const backdropRef = useRef<Group>(null);

  useDispersionControls();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '1') setMode('drei');
      if (e.key === '2') setMode('rgb');
      if (e.key === '3') setMode('rygcbv');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <main className="relative h-screen w-full bg-background">
      <Leva collapsed titleBar={{ title: 'Dispersion · Live tune' }} />
      <div
        className="pointer-events-none absolute left-6 top-6 z-10 text-xs uppercase tracking-[0.25em] text-foreground/60"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Dispersion Lab · Mode: {MODE_LABEL[mode]}
      </div>
      <div
        className="pointer-events-none absolute bottom-6 left-6 z-10 text-[10px] uppercase tracking-[0.25em] text-foreground/40"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        1 · drei baseline 2 · 3-channel 3 · rygcbv
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Environment preset="studio" />
        <Backdrop ref={backdropRef} />
        <DispersionText mode={mode} backdropRef={backdropRef} />
        <OrbitControls />
      </Canvas>
    </main>
  );
}
