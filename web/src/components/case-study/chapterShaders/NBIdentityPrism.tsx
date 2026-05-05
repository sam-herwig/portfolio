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

  float beam(vec2 p, float angle, float thick) {
    vec2 d = vec2(cos(angle), sin(angle));
    float t = dot(p, d);
    float n = abs(p.x * d.y - p.y * d.x);
    float core = exp(-n * n / (thick * thick));
    float front = smoothstep(0.0, 0.05, t);
    return core * front;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;

    vec3 col = vec3(0.039, 0.043, 0.063);

    float split = smoothstep(0.05, 0.45, uScroll);
    float merge = 1.0 - smoothstep(0.55, 0.95, uScroll);
    float spread = split * merge;

    vec3 BANDS[5];
    BANDS[0] = vec3(0.847, 0.137, 0.165);
    BANDS[1] = vec3(0.784, 0.518, 0.165);
    BANDS[2] = vec3(0.373, 0.710, 0.357);
    BANDS[3] = vec3(0.173, 0.302, 0.447);
    BANDS[4] = vec3(0.420, 0.290, 0.549);

    float baseAngle = -3.14159 + uIntro * 3.14159;
    for (int i = 0; i < 5; i++) {
      float k = (float(i) - 2.0) / 4.0;
      float a = baseAngle + k * spread * 0.55;
      float intensity = beam(p, a, mix(0.0035, 0.012, spread));
      col += BANDS[i] * intensity * (0.6 + uIntro * 0.4);
    }

    float core = exp(-length(p) * 24.0) * uIntro;
    col += vec3(1.0) * core * 0.5;

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
  mode?: 'reveal' | 'pinned';
}

export default function NBIdentityPrism({ trackRef, mode }: Props) {
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
