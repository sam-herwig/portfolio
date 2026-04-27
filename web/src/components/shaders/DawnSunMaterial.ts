/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Dawn sun glow — radial halo painted on a plane, sits low-right behind the
 * Summit's hero ridge. The ridge silhouette occludes the sun's center via
 * depth-write; only the broad halo bleeds around the peak's edge, which is
 * the iconic "sun peeking past the mountain" shot.
 *
 * uSunPulse gates opacity so the sun arrives in lock-step with the rest of
 * the dawn choreography. No animation — the sun is the still anchor; the
 * ridges and clouds carry the motion around it.
 */
const DawnSunShaderMaterial = shaderMaterial(
  {
    uSunColor: new Color('#fff1c2'),
    uHaloColor: new Color('#f4b072'),
    uSunPulse: 0.0,
    uIntensity: 1.0,
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

    uniform vec3 uSunColor;
    uniform vec3 uHaloColor;
    uniform float uSunPulse;
    uniform float uIntensity;
    uniform float uOpacity;

    void main() {
      // Distance from plane center, normalized so plane edge = 1.0.
      float d = length(vUv - 0.5) * 2.0;
      if (d > 1.0) discard;

      // Two-band falloff: tight bright core + broad warm halo.
      float core = pow(max(0.0, 1.0 - d), 6.0);
      float halo = pow(max(0.0, 1.0 - d), 1.6);

      vec3 col = mix(uHaloColor, uSunColor, core);

      float pulse = clamp(uSunPulse, 0.0, 1.0);
      float alpha = (core + halo * 0.45) * pulse * uIntensity * uOpacity;

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `,
);

extend({ DawnSunShaderMaterial });

export { DawnSunShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      dawnSunShaderMaterial: any;
    }
  }
}
