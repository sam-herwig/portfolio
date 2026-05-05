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
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float ribbon(vec2 p, float yBase, float amp, float freq, float phase, float thick) {
    float y = yBase + amp * sin(p.x * freq + phase);
    float d = abs(p.y - y);
    return 1.0 - smoothstep(0.0, thick, d);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uAspect;

    vec3 paper = vec3(0.910, 0.894, 0.855);
    vec3 ink = vec3(0.071, 0.094, 0.176);
    vec3 amber = vec3(0.85, 0.42, 0.18);
    vec3 col = paper;

    float merge = sin(p.x * 3.14159 / max(uAspect, 0.01) + 1.5708);
    merge = (merge + 1.0) * 0.5;
    float braidWindow = smoothstep(0.25, 0.55, uScroll) * (1.0 - smoothstep(0.55, 0.85, uScroll));

    float perfAmp = 0.18 * (1.0 - braidWindow * 0.7);
    float motionAmp = 0.18 * (1.0 - braidWindow * 0.7);

    float perfY = 0.18 * (1.0 - braidWindow);
    float motionY = -0.18 * (1.0 - braidWindow);

    float curl = (vnoise(vec2(p.x * 4.0 + uTime * 0.3, 0.0)) - 0.5) * 0.06;

    float perf = ribbon(p, perfY, perfAmp, 4.0, uTime * 0.4, 0.018);
    float motion = ribbon(p, motionY + curl, motionAmp, 6.0, uTime * 0.5 + 1.7, 0.018);

    float reveal = smoothstep(0.0, 0.5, uIntro);
    perf *= reveal;
    motion *= reveal;

    col = mix(col, ink, perf);
    col = mix(col, amber, motion);

    float vig = smoothstep(1.0, 0.5, length(p));
    col *= mix(0.92, 1.0, vig);

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
  mode?: 'reveal' | 'pinned';
}

export default function CCPerformanceBraid({ trackRef, mode }: Props) {
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
