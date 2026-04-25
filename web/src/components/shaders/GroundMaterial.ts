/* eslint-disable */
import { Color, Vector3 } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Campsite ground — deep ink wash with paper fiber grain and a warm pool
 * of firelight around the fire anchor.
 *
 * Warm pool tracks `uFirePulse` (shared with FireHalo + SilhouetteWarm) so a
 * scroll burst pushes the pool outward for a frame or two, then settles.
 */
const GroundShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uFireAnchor: new Vector3(4, -3, -12),
    uFirePulse: 0.0, // 0..1, shared with FireHalo
    uBaseColor: new Color('#0a0b12'),
    uWarmColor: new Color('#ea580c'),
    uWarmCore: new Color('#fde68a'),
    uInfluenceRadius: 9.0, // world units — tight circle of light around the fire
    uWarmStrength: 0.8,
    uGrainAmount: 0.05,
    uHorizonFade: 0.0, // 0..1, how much to fade near the far horizon
    uOpacity: 1.0,
  },
  // ── Vertex ─────────────────────────────────────────────────────────────
  `
    varying vec3 vWorldPos;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // ── Fragment ───────────────────────────────────────────────────────────
  `
    precision highp float;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    uniform float uTime;
    uniform vec3 uFireAnchor;
    uniform float uFirePulse;
    uniform vec3 uBaseColor;
    uniform vec3 uWarmColor;
    uniform vec3 uWarmCore;
    uniform float uInfluenceRadius;
    uniform float uWarmStrength;
    uniform float uGrainAmount;
    uniform float uHorizonFade;
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
      // Distance on the ground plane — XZ only, we don't care about y.
      vec2 fragXZ = vWorldPos.xz;
      vec2 fireXZ = uFireAnchor.xz;
      float d = distance(fragXZ, fireXZ);

      // Tight circle of light. Pulse pushes radius outward on scroll bursts.
      float pulse = clamp(uFirePulse, 0.0, 1.0);
      float effectiveRadius = uInfluenceRadius * (1.0 + pulse * 0.35);
      float warmMask = 1.0 - smoothstep(0.0, effectiveRadius, d);
      warmMask = pow(warmMask, 1.6); // bias toward the center for a tighter hot core

      // Painted irregularity on the warm pool edge so it doesn't read as a
      // CG ramp — matches the painterly sumi sky and fire halo.
      float warmNoise = fbm(fragXZ * 0.35 + vec2(uTime * 0.05, -uTime * 0.03));
      warmMask *= (0.7 + warmNoise * 0.35);

      // Base ink ground + fiber grain.
      float grain = vnoise(fragXZ * 3.2);
      vec3 ink = uBaseColor + (grain - 0.5) * uGrainAmount;

      // Horizon fade — slight darkening as the ground stretches to the ridge.
      // uv.y from 0 at camera to 1 at far edge for a horizontal plane laid
      // with rotation.x = -PI/2 (the default we use in CampSceneGroup).
      float horizon = smoothstep(0.55, 1.0, 1.0 - vUv.y);
      ink = mix(ink, ink * 0.55, horizon * uHorizonFade);

      // Warm spill — amber at the pool edge, bright core near the fire.
      vec3 warm = mix(uWarmColor, uWarmCore, warmMask * warmMask);
      vec3 col = mix(ink, warm, warmMask * uWarmStrength);

      gl_FragColor = vec4(col, uOpacity);
    }
  `,
);

extend({ GroundShaderMaterial });

export { GroundShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      groundShaderMaterial: any;
    }
  }
}
