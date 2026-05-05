'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';

export default function CaseStudyCanvas() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
    >
      <View.Port />
    </Canvas>
  );
}
