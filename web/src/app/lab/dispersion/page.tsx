'use client';

import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls, MeshTransmissionMaterial, Environment } from '@react-three/drei';

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

export default function DispersionLab() {
  return (
    <main className="h-screen w-full bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Environment preset="studio" />
        <Backdrop />
        <Text
          font="/fonts/Fraunces.ttf"
          fontSize={1.2}
          anchorX="center"
          anchorY="middle"
          maxWidth={6}
          letterSpacing={-0.03}
        >
          Sam Herwig
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
        </Text>
        <OrbitControls />
      </Canvas>
    </main>
  );
}
