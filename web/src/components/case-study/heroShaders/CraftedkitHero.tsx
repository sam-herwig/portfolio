'use client';

import { useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import { Color, type ShaderMaterial } from 'three';
import { useHeroUniforms } from '@/lib/useHeroUniforms';

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
  uniform vec3 uCK;
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

    vec2 nodes[7];
    nodes[0] = vec2(-0.62,  0.30);
    nodes[1] = vec2(-0.30, -0.10);
    nodes[2] = vec2( 0.00,  0.32);
    nodes[3] = vec2( 0.20, -0.22);
    nodes[4] = vec2( 0.42,  0.10);
    nodes[5] = vec2( 0.65, -0.05);
    nodes[6] = vec2( 0.55,  0.35);

    vec4 edges[8];
    edges[0] = vec4(nodes[0], nodes[1]);
    edges[1] = vec4(nodes[1], nodes[2]);
    edges[2] = vec4(nodes[2], nodes[3]);
    edges[3] = vec4(nodes[1], nodes[3]);
    edges[4] = vec4(nodes[3], nodes[4]);
    edges[5] = vec4(nodes[4], nodes[5]);
    edges[6] = vec4(nodes[2], nodes[6]);
    edges[7] = vec4(nodes[4], nodes[6]);

    vec3 bg = vec3(0.039, 0.039, 0.039);
    vec3 wire = vec3(0.180, 0.180, 0.200);
    vec3 ck = uCK;
    vec3 col = bg;

    float edgeMask = 0.0;
    float pulseMask = 0.0;
    for (int i = 0; i < 8; i++) {
      vec2 a = edges[i].xy;
      vec2 b = edges[i].zw;
      float d = sdSegment(p, a, b);
      float m = 1.0 - smoothstep(0.0, 0.005, d);
      edgeMask = max(edgeMask, m);

      vec2 ba = b - a;
      vec2 pa = p - a;
      float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      float phase = fract(uTime * 0.4 + uScroll + float(i) * 0.13);
      float pulse = 1.0 - smoothstep(0.0, 0.06, abs(t - phase));
      float onLine = 1.0 - smoothstep(0.0, 0.012, d);
      pulseMask = max(pulseMask, pulse * onLine);
    }
    col = mix(col, wire, edgeMask * uIntro);
    col = mix(col, ck, pulseMask * uIntro);

    for (int i = 0; i < 7; i++) {
      float introT = clamp(uIntro * 7.0 - float(i), 0.0, 1.0);
      float r = mix(0.0, 0.025, introT);
      float d = sdCircle(p - nodes[i], r);
      float m = 1.0 - smoothstep(0.0, 0.004, d);
      col = mix(col, ck * 1.2, m);

      float g = exp(-d * 60.0) * introT;
      col += ck * g * 0.4;
    }

    float vig = smoothstep(1.05, 0.4, length(p));
    col *= mix(0.85, 1.0, vig);

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
}

export default function CraftedkitHero({ trackRef }: Props) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uAspect: { value: 1.78 },
      uCK: { value: new Color('#ff6b35') },
    }),
    [],
  );

  const { ck } = useControls('Hero — CraftedKit', {
    ck: '#ff6b35',
  });

  useEffect(() => {
    uniforms.uCK.value.set(ck);
  }, [ck, uniforms]);

  useHeroUniforms({ trackRef, matRef });

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent={false} />
    </mesh>
  );
}
