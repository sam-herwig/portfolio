/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Foreground painterly motes for the deep forest. A camera-relative
 * plane with sparse painterly flecks (ink spatter / spore-pollen)
 * drifting slowly. Supporting cast to ForestShaftMaterial — adds the
 * "atmosphere between you and the scene" depth cue without competing
 * with the shaft's iconography.
 *
 * Cool palette, no warm tones. Designed for additive blending.
 */
const ForestMotesShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorMote: new Color('#aebbcc'),
    uIntensity: 0.45,
    uMoteScale: 90.0,
    uMoteThreshold: 0.92,
    uMoteSoftness: 0.45,
    uDriftSpeed: 0.012,
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
    uniform vec3 uColorMote;
    uniform float uIntensity;
    uniform float uMoteScale;
    uniform float uMoteThreshold;
    uniform float uMoteSoftness;
    uniform float uDriftSpeed;
    uniform float uOpacity;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;

      // Slow drift — sideways slow, upward slower. Pollen/spore feel.
      vec2 drift = vec2(uTime * uDriftSpeed * 0.6, uTime * uDriftSpeed);
      vec2 cellUV = uv * uMoteScale + drift;

      // Cell-based hash — each cell either spawns a fleck or doesn't.
      vec2 cell = floor(cellUV);
      float h = hash21(cell);
      float fleck = smoothstep(uMoteThreshold, 1.0, h);

      // Sub-cell soft round-off — flecks aren't square.
      vec2 f = fract(cellUV) - 0.5;
      float dist = length(f);
      float softness = 1.0 - smoothstep(0.05, uMoteSoftness, dist);

      // Plane edge fade so we don't see hard borders.
      float edgeFade =
        smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x) *
        smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);

      float alpha = fleck * softness * edgeFade * uIntensity * uOpacity;
      gl_FragColor = vec4(uColorMote, alpha);
    }
  `,
);

extend({ ForestMotesShaderMaterial });

export { ForestMotesShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      forestMotesShaderMaterial: any;
    }
  }
}
