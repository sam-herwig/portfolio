'use client';

import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useScroll, useSpring, useVelocity } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTexture, NearestFilter, RedFormat, RepeatWrapping, type ShaderMaterial, SRGBColorSpace } from 'three';
import { getImageUniforms } from '@/lib/caseStudyImageUniforms';

const BAYER_8_RAW = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54,
  22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29,
  53, 21,
];

let bayerTexture: DataTexture | null = null;
function getBayerTexture(): DataTexture {
  if (bayerTexture) return bayerTexture;
  const data = new Uint8Array(BAYER_8_RAW.map((v) => v * 4));
  const tex = new DataTexture(data, 8, 8, RedFormat);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.needsUpdate = true;
  bayerTexture = tex;
  return tex;
}

const VELOCITY_REFERENCE = 1500;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uTex;
  uniform sampler2D uBayer;
  uniform vec3 uTint;
  uniform vec3 uPaper;
  uniform float uDotDensity;
  uniform float uDitherStrength;
  uniform float uVelocityFactor;
  uniform float uChannelOffset;

  varying vec2 vUv;

  float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  void main() {
    vec2 off = vec2(uChannelOffset * uVelocityFactor * 0.002, 0.0);
    float r = texture2D(uTex, vUv + off).r;
    float g = texture2D(uTex, vUv).g;
    float b = texture2D(uTex, vUv - off).b;
    vec3 col = vec3(r, g, b);

    float lum = luma(col);
    vec3 duotone = mix(uPaper, uTint, lum);

    float threshold = texture2D(uBayer, gl_FragCoord.xy / 8.0).r;
    float hardDither = step(threshold, lum);
    vec3 ditherCol = mix(uPaper, uTint, hardDither);

    float strength = clamp(uDitherStrength + uVelocityFactor * 0.3, 0.0, 1.0);
    vec3 base = mix(duotone, ditherCol, strength);

    vec2 cellUv = fract(vUv * uDotDensity) - 0.5;
    float dotR = 0.45 - uVelocityFactor * 0.18;
    float dotMask = 1.0 - smoothstep(dotR - 0.04, dotR, length(cellUv));
    vec3 polkaCol = mix(uPaper, mix(uTint, col, 0.4), dotMask);

    vec3 finalCol = mix(base, polkaCol, uVelocityFactor * 0.55);

    finalCol = pow(clamp(finalCol, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

interface Props {
  src: string;
  slug: string;
}

export default function DitheredPlane({ src, slug }: Props) {
  const tex = useTexture(src, (texture) => {
    if (Array.isArray(texture)) {
      texture.forEach((t) => (t.colorSpace = SRGBColorSpace));
    } else {
      texture.colorSpace = SRGBColorSpace;
    }
  });
  const matRef = useRef<ShaderMaterial>(null);
  const params = useMemo(() => getImageUniforms(slug), [slug]);

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothed = useSpring(velocity, { stiffness: 100, damping: 30, mass: 0.5 });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTex: { value: tex },
      uBayer: { value: getBayerTexture() },
      uTint: { value: params.tint },
      uPaper: { value: params.paper },
      uDotDensity: { value: params.dotDensity },
      uDitherStrength: { value: params.ditherStrength },
      uVelocityFactor: { value: 0 },
      uChannelOffset: { value: params.channelOffset },
    }),
    [tex, params],
  );

  useFrame(() => {
    const m = matRef.current;
    if (!m) return;
    if (reducedMotion) {
      m.uniforms.uVelocityFactor.value = 0;
      return;
    }
    const v = Math.min(Math.abs(smoothed.get()) / VELOCITY_REFERENCE, 1);
    const target = v * params.velocityGain;
    const current = m.uniforms.uVelocityFactor.value as number;
    m.uniforms.uVelocityFactor.value = current + (target - current) * 0.18;
  });

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent={false} />
    </mesh>
  );
}
