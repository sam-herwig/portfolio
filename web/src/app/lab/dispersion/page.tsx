'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text3D, Center, useFBO } from '@react-three/drei';
import { useRef } from 'react';
import { Mesh } from 'three';
import DispersionMaterial, { makeDispersionUniforms } from '@/components/lab/DispersionMaterial';

const uniforms = makeDispersionUniforms();

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

function DispersionText() {
  const meshRef = useRef<Mesh>(null);
  const fbo = useFBO();
  const { gl, scene, camera, size, viewport } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
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
        <DispersionMaterial uniforms={uniforms} />
      </Text3D>
    </Center>
  );
}

export default function DispersionLab() {
  return (
    <main className="h-screen w-full bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Backdrop />
        <DispersionText />
        <OrbitControls />
      </Canvas>
    </main>
  );
}
