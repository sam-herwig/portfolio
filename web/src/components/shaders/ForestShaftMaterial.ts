/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Cinematic volumetric light planes for the deep forest.
 * Replaces the old rigid frustum cone with a soft, billowing backdrop.
 *
 * Behaviors:
 *  - Slow billowing FBM noise for a fog-like shifting volume.
 *  - Soft elliptical envelope (fades completely out at the edges, no hard lines).
 *  - No high-frequency brush grain, creating a much softer, cinematic glow.
 *  - Designed to be applied to wide planes rather than a cylinder.
 */
const ForestShaftShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorShaft: new Color('#d4ddea'),
    uIntensity: 0.85,
    uBrushScale: 4.0, // Maps to billow scale
    uBrushSpeed: 0.08, // Maps to billow speed
    uSplotchAmount: 0.45, // Maps to billow contrast
    uBleedStrength: 1.4, // Maps to edge bleed/softness
    uBreathRate: 0.35,
    uBreathAmplitude: 0.12,
    uScrollPush: 0.0,
    uCamProximity: 0.0,
    uOpacity: 1.0,
    uPhaseOffset: 0.0, // Added to allow out-of-phase animation for multiple planes
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
    uniform vec3 uColorShaft;
    uniform float uIntensity;
    uniform float uBrushScale;
    uniform float uBrushSpeed;
    uniform float uSplotchAmount;
    uniform float uBleedStrength;
    uniform float uBreathRate;
    uniform float uBreathAmplitude;
    uniform float uScrollPush;
    uniform float uCamProximity;
    uniform float uOpacity;
    uniform float uPhaseOffset;

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

      // Soft vertical fade: brightest near the top, fading out completely at the bottom.
      float topFade = smoothstep(1.0, 0.0, uv.y);
      float bottomFade = smoothstep(0.0, 0.25, uv.y);
      float yFade = topFade * bottomFade;

      // Soft horizontal fade: brightest in center, fading to transparent at the edges.
      // We use a smoothstep on the absolute distance from center (0.5).
      float xFade = 1.0 - smoothstep(0.0, 0.5, abs(uv.x - 0.5));

      // The overall mask envelope for the plane.
      float env = yFade * xFade;

      // Slow, billowing noise for volumetric depth.
      // uPhaseOffset allows layered planes to have different noise states.
      float t = (uTime + uPhaseOffset) * uBrushSpeed * 0.3;
      
      // Stretch noise horizontally to look more like settling mist
      vec2 noiseUv = vec2(uv.x * uBrushScale * 0.4, uv.y * uBrushScale - t);
      float noise = fbm3(noiseUv);
      
      // Soften the noise billow
      float billow = smoothstep(0.1, 0.9, noise);
      
      // Blend base envelope with billow based on uSplotchAmount. Keep the
      // billow in a narrow range so the shaft stays misty instead of spotty.
      float billowSoft = mix(0.75, 1.15, billow);
      float density = env * mix(1.0, billowSoft, uSplotchAmount);

      // Ambient breathing
      float breath = 1.0 + uBreathAmplitude * sin(uTime * uBreathRate + uPhaseOffset);
      density *= breath;

      // Scroll push: intensifies slightly when scrolling
      density *= 1.0 + uScrollPush * 0.2;

      // uBleedStrength acts as a soft overall multiplier
      float alpha = clamp(density * uIntensity * uOpacity * uBleedStrength, 0.0, 0.65);
      
      gl_FragColor = vec4(uColorShaft, alpha);
    }
  `,
);

extend({ ForestShaftShaderMaterial });

export { ForestShaftShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      forestShaftShaderMaterial: any;
    }
  }
}
