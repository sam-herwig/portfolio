'use client';

import { useMemo, useRef } from 'react';
import type { ShaderMaterial } from 'three';
import { useChapterUniforms } from '@/lib/useChapterUniforms';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  uniform float uIntro;
  uniform float uAspect;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  vec3 cellShader(vec2 cellUv, float cellId, float wakeT) {
    float t = uTime * (0.4 + hash(vec2(cellId, 0.0)) * 0.6) + cellId * 0.7;
    int kind = int(mod(cellId, 5.0));

    if (kind == 0) {
      float r = length(cellUv - 0.5);
      float ring = abs(sin(r * 18.0 - t * 2.0));
      return vec3(1.0, 0.420, 0.208) * smoothstep(0.6, 0.2, ring);
    }
    if (kind == 1) {
      float diag = sin((cellUv.x + cellUv.y) * 14.0 + t * 2.5);
      return vec3(0.95, 0.55, 0.20) * (diag * 0.5 + 0.5);
    }
    if (kind == 2) {
      vec2 cv = cellUv - 0.5;
      float a = atan(cv.y, cv.x);
      float r = length(cv);
      float spoke = abs(sin(a * 6.0 + t * 1.5));
      return vec3(1.0, 0.65, 0.30) * spoke * smoothstep(0.5, 0.2, r);
    }
    if (kind == 3) {
      float dx = abs(cellUv.x - 0.5 - 0.3 * sin(t));
      return vec3(1.0, 0.420, 0.208) * smoothstep(0.18, 0.0, dx);
    }
    vec2 g = floor(cellUv * 4.0);
    float check = mod(g.x + g.y + floor(t), 2.0);
    return vec3(1.0, 0.5, 0.20) * check;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv;

    float cellsX = 5.0;
    float cellsY = 3.0;
    vec2 cellSize = vec2(1.0 / cellsX, 1.0 / cellsY);
    vec2 cell = floor(p * vec2(cellsX, cellsY));
    vec2 cellUv = fract(p * vec2(cellsX, cellsY));

    float cellId = cell.y * cellsX + cell.x;
    float wakeOrder = hash(cell + 17.0);
    float wakeT = clamp((uIntro + uScroll * 0.5) * 1.6 - wakeOrder * 0.8, 0.0, 1.0);

    vec3 bg = vec3(0.039, 0.043, 0.055);
    vec3 cellCol = cellShader(cellUv, cellId, wakeT);
    vec3 col = mix(bg, cellCol, wakeT);

    vec2 borderDist = min(cellUv, 1.0 - cellUv);
    float border = smoothstep(0.012, 0.000, min(borderDist.x, borderDist.y));
    col = mix(col, vec3(0.039, 0.043, 0.055), border * 0.9);

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
  mode?: 'reveal' | 'pinned';
}

export default function CKHeroGrid({ trackRef, mode }: Props) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uAspect: { value: 1.78 },
    }),
    [],
  );

  useChapterUniforms({ trackRef, matRef, mode });

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent={false} />
    </mesh>
  );
}
