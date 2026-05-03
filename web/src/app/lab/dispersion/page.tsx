'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text3D, Center, useFBO, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { Mesh } from 'three';
import DispersionMaterial, { makeDispersionUniforms } from '@/components/lab/DispersionMaterial';
import { useMouseVelocity } from '@/lib/useMouseVelocity';

const uniforms = makeDispersionUniforms();

type Mode = 'drei' | 'rgb' | 'rygcbv';

const MODE_LABEL: Record<Mode, string> = {
  drei: '1 — drei baseline (MeshTransmissionMaterial)',
  rgb: '2 — 3-channel per-channel IOR',
  rygcbv: '3 — rygcbv 6-channel spectral split',
};

function Backdrop() {
  return (
    <group position={[0, 0, -2]}>
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
}

function DispersionText({ mode }: { mode: Mode }) {
  const meshRef = useRef<Mesh>(null);
  const fbo = useFBO();
  const velocity = useMouseVelocity();
  const { gl, scene, camera, size, viewport } = useThree();

  useEffect(() => {
    uniforms.uMode.value = mode === 'rygcbv' ? 1 : 0;
  }, [mode]);

  useFrame(() => {
    uniforms.uVelocity.value = velocity.current.magnitude;

    if (!meshRef.current) return;
    if (mode === 'drei') return;
    meshRef.current.visible = false;
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    meshRef.current.visible = true;

    uniforms.uScene.value = fbo.texture;
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
      <div
        className="pointer-events-none absolute left-6 top-6 z-10 text-xs uppercase tracking-[0.25em] text-foreground/60"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Dispersion Lab · Mode: {MODE_LABEL[mode]}
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        {mode === 'drei' && <Environment preset="studio" />}
        <Backdrop />
        <DispersionText mode={mode} />
        <OrbitControls />
      </Canvas>
    </main>
  );
}
