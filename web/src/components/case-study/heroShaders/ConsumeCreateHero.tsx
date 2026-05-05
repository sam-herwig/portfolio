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
  uniform vec3 uAmber;
  varying vec2 vUv;

  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float voronoi(vec2 p, float scale) {
    vec2 g = floor(p * scale);
    vec2 f = fract(p * scale);
    float minDist = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 lattice = vec2(float(x), float(y));
        vec2 offset = hash22(g + lattice);
        offset = lattice + offset;
        minDist = min(minDist, length(offset - f));
      }
    }
    return minDist;
  }

  void main() {
    vec2 uv = vUv;
    vec2 cuv = uv - 0.5;
    cuv.x *= uAspect;

    float scale = mix(7.0, 26.0, uScroll);
    float v = voronoi(cuv + vec2(uTime * 0.02, 0.0), scale);

    vec3 paper = vec3(0.910, 0.894, 0.855);
    vec3 ink = vec3(0.071, 0.094, 0.176);
    vec3 amber = uAmber;

    float cellEdge = 1.0 - smoothstep(0.0, 0.02, v);
    float cellShade = smoothstep(0.0, 0.45, v);

    vec3 col = mix(ink, paper, cellShade);
    col = mix(col, ink * 0.7, cellEdge * 0.6);

    float angle = -1.5708 + uIntro * 1.5708 + uScroll * 6.28318;
    float needleA = atan(cuv.y, cuv.x);
    float diff = abs(mod(needleA - angle + 3.14159, 6.28318) - 3.14159);
    float radial = length(cuv);

    float needleMask = 1.0 - smoothstep(0.0, 0.012, diff);
    needleMask *= smoothstep(0.03, 0.07, radial) * smoothstep(0.62, 0.55, radial);

    float center = smoothstep(0.045, 0.030, radial);
    float ring = smoothstep(0.61, 0.605, radial) * (1.0 - smoothstep(0.625, 0.615, radial));

    col = mix(col, amber, needleMask);
    col = mix(col, amber, center);
    col = mix(col, ink, ring * 0.7);

    col *= uIntro * 0.7 + 0.3;

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
}

export default function ConsumeCreateHero({ trackRef }: Props) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uAspect: { value: 1.78 },
      uAmber: { value: new Color('#d96b2e') },
    }),
    [],
  );

  const { needle } = useControls('Hero — Consume & Create', {
    needle: '#d96b2e',
  });

  useEffect(() => {
    uniforms.uAmber.value.set(needle);
  }, [needle, uniforms]);

  useHeroUniforms({ trackRef, matRef });

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent={false} />
    </mesh>
  );
}
