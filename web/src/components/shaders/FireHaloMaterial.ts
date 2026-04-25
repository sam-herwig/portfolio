/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Painted fire-glow halo — additive radial billboard used at the campfire
 * anchor. Not a physical light; pure graphic pass so the John Fellows
 * illustration language stays intact.
 *
 * Drive `uEmberPulse` from the shared scroll-velocity ref so the halo
 * breathes in sync with the SilhouetteWarmMaterial and the ember clusters.
 */
const FireHaloShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uEmberPulse: 0, // 0..1, usually a clamped scroll-velocity
    uColorWarm: new Color('#ea580c'),
    uColorCore: new Color('#fde68a'),
    uRadius: 0.48, // halo falloff radius in uv space (0..0.5)
    uFbmScale: 2.4,
    uIntensity: 1.3,
    uOpacity: 1.0,
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
    uniform float uEmberPulse;
    uniform vec3 uColorWarm;
    uniform vec3 uColorCore;
    uniform float uRadius;
    uniform float uFbmScale;
    uniform float uIntensity;
    uniform float uOpacity;

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
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p *= 2.03;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      // Painterly irregularity on the halo edge
      float flicker = fbm(centered * uFbmScale + vec2(uTime * 0.18, -uTime * 0.13));
      float breath = 0.92 + 0.08 * sin(uTime * 1.4);

      float pulse = 1.0 + clamp(uEmberPulse, 0.0, 1.0) * 0.6;

      // Soft outer halo
      float outer = smoothstep(uRadius, 0.0, dist);
      outer *= (0.7 + flicker * 0.3);

      // Hot core — tighter, brighter, keyed by pulse
      float core = smoothstep(uRadius * 0.28, 0.0, dist);
      core *= (0.85 + flicker * 0.15);

      vec3 col = uColorWarm * outer + uColorCore * core * 0.6;
      col *= uIntensity * breath * pulse;

      float alpha = clamp(outer + core * 0.9, 0.0, 1.0) * uOpacity;
      if (alpha < 0.01) discard;

      gl_FragColor = vec4(col, alpha);
    }
  `,
);

extend({ FireHaloShaderMaterial });

export { FireHaloShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fireHaloShaderMaterial: any;
    }
  }
}
