'use client';

import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';

export default function DispersionLab() {
  return (
    <main className="h-screen w-full bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Text
          font="/fonts/Fraunces.ttf"
          fontSize={1.2}
          color="#fafafa"
          anchorX="center"
          anchorY="middle"
          maxWidth={6}
          letterSpacing={-0.03}
        >
          Sam Herwig
        </Text>
        <OrbitControls />
      </Canvas>
    </main>
  );
}
