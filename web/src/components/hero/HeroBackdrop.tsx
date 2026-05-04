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
    falloff = pow(falloff, 1.8);
    gl_FragColor = vec4(uColor * uIntensity, falloff);
  }
`;

interface BlobConfig {
  position: [number, number, number];
  size: number;
  color: string;
  intensity: number;
}

// Hero palette — much softer than the lab demo. Three muted tones over a near-black
// base. The dispersion shader needs colored content to refract; without color
// behind it, the rygcbv split has nothing to chew on. These three give just
// enough chroma without reading as "rainbow demo".
const BLOBS: BlobConfig[] = [
  { position: [-3.4, 1.0, -2.6], size: 7, color: '#3a4dff', intensity: 0.55 },
  { position: [2.8, -0.8, -2.4], size: 7, color: '#ff5e7a', intensity: 0.5 },
  { position: [0.0, 1.6, -3.0], size: 8, color: '#ffd16a', intensity: 0.35 },
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

const HeroBackdrop = forwardRef<Group>(function HeroBackdrop(_, ref) {
  const materials = useMemo(() => BLOBS.map((b) => makeMaterial(b.color, b.intensity)), []);

  return (
    <group ref={ref}>
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

export default HeroBackdrop;
