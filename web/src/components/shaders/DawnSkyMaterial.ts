/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Dawn sky — replaces the SumiSky's nightscape with a painted first-light wash.
 *
 * No stars, no milky-way, no visible sun disc. The sun is implied via the
 * shared uSunPulse dial and the warm-tint shaders on silhouettes / cloud sea.
 *
 * Vertical gradient (cool zenith → warm horizon) + domain-warped fbm gives
 * painterly unevenness. Saturation of the warm horizon color is modulated by
 * uSunPulse so the whole sky ramps from "pre-dawn cool" to "first light"
 * across summit's enter window.
 */
const DawnSkyShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uSunPulse: 0,
    uColorHorizon: new Color('#f5d6a8'), // warm peach near the horizon
    uColorZenith: new Color('#7a8aa3'), // cool slate above
    uColorWarm: new Color('#fde68a'), // dawn warmth — boosts horizon when uSunPulse=1
    uFbmScale: 2.4,
    uGrainAmount: 0.025,
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
    uniform float uSunPulse;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorZenith;
    uniform vec3 uColorWarm;
    uniform float uFbmScale;
    uniform float uGrainAmount;
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
      for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p *= 2.07;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Vertical gradient — horizon (warm) at uv.y=0, zenith (cool) at uv.y=1.
      float g = smoothstep(0.0, 1.0, vUv.y);

      // Pre-dawn baseline: zenith + a desaturated horizon.
      vec3 horizonCool = mix(uColorHorizon, uColorZenith, 0.55);
      vec3 horizon = mix(horizonCool, uColorHorizon, clamp(uSunPulse, 0.0, 1.0));
      vec3 sky = mix(horizon, uColorZenith, g);

      // Painterly unevenness via domain-warped fbm.
      vec2 q = vec2(
        fbm(vUv * uFbmScale + vec2(0.0, uTime * 0.012)),
        fbm(vUv * uFbmScale + vec2(5.2, 1.3))
      );
      float wash = fbm(vUv * uFbmScale + 2.0 * q);
      sky = mix(sky, sky * 1.18, wash * 0.35);

      // Dawn boost — warm tint pooling along the horizon, gated by uSunPulse.
      float horizonBand = pow(1.0 - g, 2.5);
      float pulse = clamp(uSunPulse, 0.0, 1.0);
      sky = mix(sky, uColorWarm, horizonBand * 0.35 * pulse);

      // Paper fiber grain — subtle texture so the gradient never reads digital.
      float fiber = vnoise(vUv * 90.0);
      sky += (fiber - 0.5) * uGrainAmount;

      gl_FragColor = vec4(sky, uOpacity);
    }
  `,
);

extend({ DawnSkyShaderMaterial });

export { DawnSkyShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      dawnSkyShaderMaterial: any;
    }
  }
}
