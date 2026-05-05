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

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;

    vec3 bg = vec3(0.039, 0.043, 0.055);
    vec3 ck = vec3(1.0, 0.420, 0.208);
    vec3 col = bg;

    vec2 path[8];
    path[0] = vec2(-0.78,  0.20);
    path[1] = vec2(-0.45,  0.20);
    path[2] = vec2(-0.30, -0.05);
    path[3] = vec2( 0.00, -0.05);
    path[4] = vec2( 0.18,  0.18);
    path[5] = vec2( 0.45,  0.18);
    path[6] = vec2( 0.62, -0.10);
    path[7] = vec2( 0.78, -0.10);

    float lengths[7];
    float total = 0.0;
    for (int i = 0; i < 7; i++) {
      lengths[i] = length(path[i + 1] - path[i]);
      total += lengths[i];
    }

    float frontier = uScroll * total;
    float walked = 0.0;

    float lineMask = 0.0;
    for (int i = 0; i < 7; i++) {
      vec2 a = path[i];
      vec2 b = path[i + 1];
      float segLen = lengths[i];
      float coverage = clamp((frontier - walked) / max(segLen, 0.0001), 0.0, 1.0);
      vec2 endpoint = mix(a, b, coverage);
      float d = sdSegment(p, a, endpoint);
      lineMask = max(lineMask, 1.0 - smoothstep(0.005, 0.009, d));
      walked += segLen;
    }

    col = mix(col, ck, lineMask * uIntro);

    for (int i = 0; i < 8; i++) {
      float walkedToHere = 0.0;
      for (int j = 0; j < 7; j++) {
        if (j < i) walkedToHere += lengths[j];
      }
      float reached = step(walkedToHere, frontier);
      float d = length(p - path[i]);
      float dot_ = (1.0 - smoothstep(0.008, 0.014, d)) * reached * uIntro;
      col = mix(col, ck * 1.2, dot_);
    }

    float vig = smoothstep(1.1, 0.4, length(p));
    col *= mix(0.85, 1.0, vig);

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
  mode?: 'reveal' | 'pinned';
}

export default function CKSilhouette({ trackRef, mode }: Props) {
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
