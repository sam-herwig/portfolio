/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Forest mist — painted hush behind the deep-forest tree silhouettes.
 *
 * Replaces the auto-panning `forest_wall.webp` wallpaper. Same painterly
 * recipe as DawnSky / SumiSky (hash21 → vnoise → fbm → tonal blend), but
 * driven by a single `uMistDensity` hero dial coupled to scroll progress
 * across the forest window. As density rises, the painterly wash flattens
 * toward a cool midtone, reading as "thicker fog hiding more depth."
 *
 * Mood: hushed, cool, indistinct. No warm tones — warmth is reserved for
 * Hero (watercolor) and Summit (dawn).
 */
const ForestMistShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMistDensity: 0,
    uColorMistCool: new Color('#7a8696'),
    uColorMistShadow: new Color('#3a4350'),
    uFbmScale: 1.8,
    uWashAmount: 0.12,
    uBandStrength: 0.1,
    uGrainAmount: 0.01,
    uOpacity: 1.0,
    uFogSpeed: 0.05,
  },
  // ── Vertex ─────────────────────────────────────────────────────────────
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // ── Fragment ───────────────────────────────────────────────────────────
  `
    precision highp float;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uMistDensity;
    uniform vec3 uColorMistCool;
    uniform vec3 uColorMistShadow;
    uniform float uFbmScale;
    uniform float uWashAmount;
    uniform float uBandStrength;
    uniform float uGrainAmount;
    uniform float uOpacity;
    uniform float uFogSpeed;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p *= 2.07;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Smooth vertical gradient — forest floor (warmer cool at uv.y=0) to canopy
      // depth (deeper slate at uv.y=1).
      float g = smoothstep(0.0, 1.0, vUv.y);
      vec3 base = mix(uColorMistCool, uColorMistShadow, g);

      // Hero dial — uMistDensity shifts the gradient toward the cool mist color
      // as density increases, representing thicker fog hiding the dark depths.
      float density = clamp(uMistDensity, 0.0, 1.0);
      vec3 mist = mix(base, uColorMistCool * 0.9, density * 0.6);

      // Paper fiber grain — keeps the smooth gradient from banding.
      float fiber = fract(sin(dot(vUv.xy, vec2(12.9898, 78.233))) * 43758.5453);
      mist += (fiber - 0.5) * uGrainAmount * 2.0;

      gl_FragColor = vec4(mist, uOpacity);
    }
  `,
);

extend({ ForestMistShaderMaterial });

export { ForestMistShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      forestMistShaderMaterial: any;
    }
  }
}
