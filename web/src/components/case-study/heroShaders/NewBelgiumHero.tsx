'use client';

import { useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import type { ShaderMaterial } from 'three';
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
  uniform float uGain;
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
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  vec3 nbPalette(float t) {
    vec3 NB_RED    = vec3(0.847, 0.137, 0.165);
    vec3 VR_GREEN  = vec3(0.373, 0.710, 0.357);
    vec3 FT_AMBER  = vec3(0.784, 0.518, 0.165);
    vec3 OAK_PURP  = vec3(0.420, 0.290, 0.549);
    vec3 BELL_BLUE = vec3(0.173, 0.302, 0.447);

    t = fract(t);
    float seg = t * 5.0;
    float i = floor(seg);
    float f = seg - i;
    if (i < 0.5)      return mix(NB_RED, VR_GREEN, f);
    else if (i < 1.5) return mix(VR_GREEN, FT_AMBER, f);
    else if (i < 2.5) return mix(FT_AMBER, OAK_PURP, f);
    else if (i < 3.5) return mix(OAK_PURP, BELL_BLUE, f);
    else              return mix(BELL_BLUE, NB_RED, f);
  }

  void main() {
    vec2 uv = vUv;
    vec2 cuv = uv - 0.5;
    cuv.x *= uAspect;

    float t = uTime * 0.06 + uScroll * 0.5;

    vec2 q = vec2(fbm(cuv * 2.0 + t), fbm(cuv * 2.0 + 5.2));
    vec2 r = vec2(
      fbm(cuv * 2.0 + 2.0 * q + vec2(1.7, 9.2) + t),
      fbm(cuv * 2.0 + 2.0 * q + vec2(8.3, 2.8) + t * 1.1)
    );
    float n = fbm(cuv * 1.6 + 4.0 * r);

    float a = atan(cuv.y, cuv.x);
    float spiralPos = (a / 6.28318 + 0.5) - (1.0 - uIntro) * 1.2;
    float reveal = smoothstep(spiralPos - 0.04, spiralPos + 0.02, n);

    vec3 col = nbPalette(n + uScroll * 0.3 + uTime * 0.02);
    col *= reveal * uGain;
    col = pow(col, vec3(0.85));

    float vig = smoothstep(0.95, 0.45, length(cuv));
    col *= vig;

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  trackRef: React.RefObject<HTMLElement | null>;
}

export default function NewBelgiumHero({ trackRef }: Props) {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uAspect: { value: 1.78 },
      uGain: { value: 1.0 },
    }),
    [],
  );

  const { gain } = useControls('Hero — New Belgium', {
    gain: { value: 1.0, min: 0.4, max: 1.6, step: 0.05 },
  });

  useEffect(() => {
    const m = matRef.current;
    if (m) m.uniforms.uGain.value = gain;
  }, [gain]);

  useHeroUniforms({ trackRef, matRef });

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent={false} />
    </mesh>
  );
}
