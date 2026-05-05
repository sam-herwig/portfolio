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

  float sdCircle(vec2 p, float r) { return length(p) - r; }

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
    vec3 wire = vec3(0.150, 0.155, 0.180);
    vec3 ck = vec3(1.0, 0.420, 0.208);
    vec3 col = bg;

    vec2 nodes[5];
    nodes[0] = vec2(-0.70,  0.0);
    nodes[1] = vec2(-0.35,  0.0);
    nodes[2] = vec2( 0.00,  0.0);
    nodes[3] = vec2( 0.35,  0.0);
    nodes[4] = vec2( 0.70,  0.0);

    float stage = uScroll * 4.0;

    float edgeMask = 0.0;
    float pulseMask = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 a = nodes[i];
      vec2 b = nodes[i + 1];
      float d = sdSegment(p, a, b);
      float wireOn = clamp(stage - float(i) * 0.6, 0.0, 1.0);
      edgeMask = max(edgeMask, (1.0 - smoothstep(0.0, 0.004, d)) * wireOn);

      vec2 ba = b - a;
      vec2 pa = p - a;
      float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      float phase = fract(uTime * 0.6 + uScroll * 1.2);
      float pulseHead = smoothstep(0.06, 0.0, abs(t - phase));
      float onLine = 1.0 - smoothstep(0.0, 0.010, d);
      pulseMask = max(pulseMask, pulseHead * onLine * wireOn);
    }
    col = mix(col, wire, edgeMask);
    col = mix(col, ck, pulseMask);

    for (int i = 0; i < 5; i++) {
      float lit = clamp(stage - float(i), 0.0, 1.0);
      float r = 0.045;
      float d = sdCircle(p - nodes[i], r);
      float ring = (1.0 - smoothstep(0.002, 0.005, abs(d))) * (0.4 + lit * 0.6);
      float fill = (1.0 - smoothstep(r, r - 0.004, length(p - nodes[i]))) * lit;
      col = mix(col, ck, ring + fill);

      float glow = exp(-d * 35.0) * lit;
      col += ck * glow * 0.45;
    }

    if (uScroll > 0.85) {
      float crystal = smoothstep(0.85, 1.0, uScroll);
      vec2 g = floor((p + vec2(0.4, 0.4)) * 5.0);
      vec2 cell = fract((p + vec2(0.4, 0.4)) * 5.0) - 0.5;
      float box = step(0.42, max(abs(cell.x), abs(cell.y))) * 0.0 + step(max(abs(cell.x), abs(cell.y)), 0.42);
      float inGrid = step(0.0, g.x) * step(g.x, 3.0) * step(0.0, g.y) * step(g.y, 3.0);
      float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + g.x * 1.7 + g.y * 2.3);
      col = mix(col, ck * (0.6 + 0.4 * twinkle), inGrid * box * crystal * 0.6);
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

export default function CKPipelineFlow({ trackRef, mode = 'pinned' }: Props) {
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
