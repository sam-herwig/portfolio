'use client';

import { useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import { Color, type ShaderMaterial, SRGBColorSpace } from 'three';
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
  uniform vec3 uPaper;
  uniform vec3 uInk;
  uniform sampler2D uTex;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

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
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 cuv = uv - 0.5;
    cuv.x *= uAspect;

    float t = uTime * 0.05 + uScroll * 0.4;
    vec2 q = vec2(fbm(cuv * 1.8 + t), fbm(cuv * 1.8 - t + 17.0));
    float n = fbm(cuv * 2.6 + q + t * 0.5);

    vec3 tex = texture2D(uTex, uv).rgb;
    float lum = dot(tex, vec3(0.299, 0.587, 0.114));
    float mask = 1.0 - lum;

    float r = length(cuv);
    float waveR = uIntro * 1.6;
    float visibility = smoothstep(waveR + 0.04, waveR - 0.18, r);

    float ink = smoothstep(0.40, 0.62, n + mask * 0.45) * visibility;

    float fiber = (vnoise(uv * 320.0) - 0.5) * 0.04;

    vec3 col = mix(uPaper + fiber, uInk, ink);

    float vig = 1.0 - smoothstep(0.55, 1.05, length(cuv));
    col *= mix(0.92, 1.0, vig);

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  thumbnail: string;
  trackRef: React.RefObject<HTMLElement | null>;
}

export default function MissionBellHero({ thumbnail, trackRef }: Props) {
  const tex = useTexture(thumbnail, (texture) => {
    if (Array.isArray(texture)) {
      texture.forEach((t) => (t.colorSpace = SRGBColorSpace));
    } else {
      texture.colorSpace = SRGBColorSpace;
    }
  });
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uAspect: { value: 1.78 },
      uPaper: { value: new Color('#f5e9d0') },
      uInk: { value: new Color('#6b4a8c') },
      uTex: { value: tex },
    }),
    [tex],
  );

  const { paper, ink } = useControls('Hero — Mission Bell', {
    paper: '#f5e9d0',
    ink: '#6b4a8c',
  });

  useEffect(() => {
    uniforms.uPaper.value.set(paper);
    uniforms.uInk.value.set(ink);
  }, [paper, ink, uniforms]);

  useHeroUniforms({ trackRef, matRef });

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent={false} />
    </mesh>
  );
}
