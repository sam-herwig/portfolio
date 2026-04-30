/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Foreground atmospheric dust for the Camp scene. A near-camera transparent
 * plane with wispy horizontal fbm streaks that parallax against the milky
 * way as the camera translates through the camp window. Adds the missing
 * "atmosphere between you and the sky" depth cue.
 */
const CampDustShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorDust: new Color('#2a3a55'),
    uIntensity: 0.85,
    uAlphaCap: 0.28,
    uAnisotropyY: 7.5,
    uDriftSpeed: 0.015,
    uThresholdLo: 0.32,
    uThresholdHi: 0.68,
    uAltitudeLo: 0.15,
    uAltitudeHi: 1.05,
    uScrollFloor: 0.4,
    uOpacity: 1.0,
    uScrollProgress: 0.5,
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
    uniform vec3 uColorDust;
    uniform float uIntensity;
    uniform float uAlphaCap;
    uniform float uAnisotropyY;
    uniform float uDriftSpeed;
    uniform float uThresholdLo;
    uniform float uThresholdHi;
    uniform float uAltitudeLo;
    uniform float uAltitudeHi;
    uniform float uScrollFloor;
    uniform float uOpacity;
    uniform float uScrollProgress;

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

    float fbm3(vec2 p) {
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
      vec2 uv = vUv;

      // Wispy streaks: stretch noise heavily along Y in band space so X is
      // the elongation direction (long horizontal filaments).
      vec2 streakUV = vec2(uv.x * 1.4 + uTime * uDriftSpeed, uv.y * uAnisotropyY);
      float streaks = fbm3(streakUV);

      float dustAlpha = smoothstep(uThresholdLo, uThresholdHi, streaks) * uAlphaCap * uIntensity;

      // Vertical fade — most dust at low/mid altitude, less near zenith.
      float vertFade = smoothstep(uAltitudeHi, uAltitudeLo, uv.y);
      dustAlpha *= vertFade;

      // Edge fade so the plane doesn't show hard borders.
      float edgeFadeX = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
      dustAlpha *= edgeFadeX;

      // Scroll-coupled visibility: peak at center of camp window.
      float scrollPeak = 1.0 - 2.0 * abs(uScrollProgress - 0.5);
      scrollPeak = smoothstep(0.0, 1.0, max(0.0, scrollPeak));
      dustAlpha *= uScrollFloor + (1.0 - uScrollFloor) * scrollPeak;

      gl_FragColor = vec4(uColorDust, dustAlpha * uOpacity);
    }
  `,
);

extend({ CampDustShaderMaterial });

export { CampDustShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      campDustShaderMaterial: any;
    }
  }
}
