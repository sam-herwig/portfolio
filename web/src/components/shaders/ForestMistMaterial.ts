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
      // Vertical gradient — forest floor (warmer cool at uv.y=0) to canopy
      // depth (deeper slate at uv.y=1). Subtle inversion of the dawn-sky
      // gradient: in a forest, depth lives upward and outward, not downward.
      float g = smoothstep(0.0, 1.0, vUv.y);
      vec3 base = mix(uColorMistCool, uColorMistShadow, g);

      // Painterly unevenness via domain-warped fbm — same recipe as DawnSky.
      vec2 q = vec2(
        fbm(vUv * uFbmScale + vec2(0.0, uTime * uFogSpeed)),
        fbm(vUv * uFbmScale + vec2(5.2, 1.3 - uTime * uFogSpeed * 0.5))
      );
      float wash = fbm(vUv * uFbmScale + 2.0 * q + vec2(uTime * uFogSpeed * 0.2));

      // Hero dial — uMistDensity flattens the wash. Low density: more
      // tonal variation visible (you can see structure through the mist).
      // High density: wash collapses, everything pulls toward a cool
      // midtone — the visual signature of "thicker fog."
      float density = clamp(uMistDensity, 0.0, 1.0);
      vec3 mist = base + (wash - 0.5) * uWashAmount * (1.0 - density);
      mist = mix(mist, uColorMistCool * 0.88, density * 0.35);

      // Broad, quiet wash bands: enough movement to avoid a flat card,
      // but low-frequency so the sky does not read as spotted dirt.
      vec2 bandUv = vec2(vUv.x * 0.55 + vUv.y * 0.2, vUv.y * 2.6);
      float band = fbm(bandUv + vec2(uTime * uFogSpeed * 0.08, -uTime * uFogSpeed * 0.12));
      float veil = smoothstep(0.48, 0.86, band) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
      mist = mix(mist, uColorMistCool * 0.94, veil * uBandStrength * (0.5 + density * 0.5));

      // Paper fiber grain — keeps the gradient from reading digital.
      float fiber = vnoise(vUv * 90.0);
      mist += (fiber - 0.5) * uGrainAmount;

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
