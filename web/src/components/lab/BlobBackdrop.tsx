'use client';

import { forwardRef, useMemo } from 'react';
import { AdditiveBlending, Color, Group, ShaderMaterial } from 'three';

const blobVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const blobFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float falloff = smoothstep(1.0, 0.0, d);
    falloff = pow(falloff, 1.6);
    gl_FragColor = vec4(uColor * uIntensity, falloff);
  }
`;

interface BlobConfig {
  position: [number, number, number];
  size: number;
  color: string;
  intensity: number;
}

const BLOBS: BlobConfig[] = [
  { position: [-3.6, 1.2, -2.5], size: 6, color: '#ff5577', intensity: 1.1 },
  { position: [-1.0, -1.5, -2.0], size: 5.5, color: '#5b8bff', intensity: 1.0 },
  { position: [1.4, 1.8, -2.3], size: 6.5, color: '#9affc4', intensity: 0.9 },
  { position: [3.4, -0.6, -2.4], size: 6, color: '#ffd166', intensity: 1.0 },
  { position: [0.0, 0.0, -3.2], size: 9, color: '#7a4cff', intensity: 0.7 },
];

function makeMaterial(color: string, intensity: number) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
    },
    vertexShader: blobVertex,
    fragmentShader: blobFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

const BlobBackdrop = forwardRef<Group>(function BlobBackdrop(_, ref) {
  const materials = useMemo(() => BLOBS.map((b) => makeMaterial(b.color, b.intensity)), []);

  return (
    <group ref={ref}>
      {/* Solid dark base behind everything so additive blobs glow on dark */}
      <mesh position={[0, 0, -3.5]}>
        <planeGeometry args={[40, 25]} />
        <meshBasicMaterial color="#070710" />
      </mesh>
      {BLOBS.map((blob, i) => (
        <mesh key={i} position={blob.position} material={materials[i]}>
          <planeGeometry args={[blob.size, blob.size]} />
        </mesh>
      ))}
    </group>
  );
});

export default BlobBackdrop;
