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

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;

    vec3 bg = vec3(0.039, 0.043, 0.055);
    vec3 ck = vec3(1.0, 0.420, 0.208);
    vec3 col = bg;

    float pulse = 0.5 + 0.5 * sin(uTime * 2.6);
    float radial = length(p);
    float halo = exp(-radial * 6.0) * (0.6 + 0.4 * pulse) * uIntro;
    col += ck * halo * 0.5;

    float core = 1.0 - smoothstep(0.022, 0.030, radial);
    col = mix(col, ck * 1.2, core * uIntro);

    float gridReveal = smoothstep(0.05, 0.55, uScroll);
    if (gridReveal > 0.001) {
      vec2 q = vec2(p.x, p.y - 0.55);
      float floorMask = step(q.y, 0.0);

      float persp = -q.y;
      vec2 g;
      g.x = q.x / max(persp + 0.18, 0.001) * 0.5;
      g.y = log(max(persp + 0.06, 0.06) * 12.0 + 1.0) - uTime * 0.25;

      vec2 gAbs = fract(g) - 0.5;
      float lineX = 1.0 - smoothstep(0.005, 0.012, abs(gAbs.x));
      float lineY = 1.0 - smoothstep(0.005, 0.012, abs(gAbs.y));
      float gridMask = max(lineX, lineY);

      float depthFade = smoothstep(0.6, 0.05, persp);
      vec3 lineCol = ck * 0.7;
      col += lineCol * gridMask * floorMask * depthFade * gridReveal;

      vec2 cellId = floor(g);
      float thumbReveal = smoothstep(0.5, 1.0, uScroll);
      float twinkle = 0.5 + 0.5 * sin(uTime * 3.0 + cellId.x * 1.7 + cellId.y * 2.3);
      vec2 cellLocal = fract(g) - 0.5;
      float thumb = step(max(abs(cellLocal.x), abs(cellLocal.y)), 0.34);
      float thumbBright = thumb * floorMask * depthFade * thumbReveal * (0.4 + 0.4 * twinkle);
      col += ck * thumbBright * 0.45;
    }

    float vig = smoothstep(1.2, 0.4, length(p));
    col *= mix(0.85, 1.0, vig);

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
  mode?: 'reveal' | 'pinned';
}

export default function CKNodeReceding({ trackRef, mode }: Props) {
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
