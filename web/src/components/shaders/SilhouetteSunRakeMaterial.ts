/* eslint-disable */
import { Color, Vector2, type Texture } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Silhouette sun-rake — directional analog of SilhouetteWarmShader.
 *
 * Camp uses a point-anchor distance falloff (fire is a local source). Summit's
 * sun is effectively at infinity, so warm-tint comes from a directional dot
 * product against uSunDir (a screen-XY direction in [-1, 1]). uv.y=1 is the
 * top of the texture (sun-side for upper-right uSunDir).
 *
 * All Summit silhouettes (2 ridges + cliff + flag) share one uSunDir + uSunPulse
 * so the dawn rakes consistently across the whole module.
 */
const SilhouetteSunRakeShaderMaterial = shaderMaterial(
  {
    uTexture: null as Texture | null,
    uSunDir: new Vector2(0.85, 0.15), // screen-XY, low-right (just-risen sun)
    uWarmColor: new Color('#fde68a'),
    uCoolShadow: new Color('#2a3240'),
    uWarmStrength: 0.45,
    uSunPulse: 0.0,
    uOpacity: 1.0,
    // Atmospheric perspective — mixes the final result toward uAtmosphericColor
    // so distant silhouettes can dissolve into the sky-color band on the
    // horizon. Far ridge: high mix (~0.85). Mid ridge / cliff / flag: 0.
    uAtmosphericMix: 0.0,
    uAtmosphericColor: new Color('#b8c4d8'),
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

    uniform sampler2D uTexture;
    uniform vec2 uSunDir;
    uniform vec3 uWarmColor;
    uniform vec3 uCoolShadow;
    uniform float uWarmStrength;
    uniform float uSunPulse;
    uniform float uOpacity;
    uniform float uAtmosphericMix;
    uniform vec3 uAtmosphericColor;

    void main() {
      vec4 texColor = texture2D(uTexture, vUv);

      // Hard-edged cutout — assets exported with alpha-keyed background.
      if (texColor.a < 0.5) discard;

      // Sun-rake: dot product between (uv − center) and the sun direction.
      // Positive dot = sun-facing side, negative = shadow side. Scale to [0,1].
      vec2 centered = vUv - 0.5;
      vec2 sunDir = normalize(uSunDir + vec2(1e-5));
      float raw = dot(centered, sunDir);
      float warmMask = smoothstep(-0.25, 0.45, raw);

      // uSunPulse gates the warm intensity — pre-dawn = cool everywhere,
      // dawn = full warm-cool split.
      float pulse = clamp(uSunPulse, 0.0, 1.0);

      // Cool the shadow side first, then warm the sun side on top.
      vec3 base = texColor.rgb;
      vec3 cooled = mix(base, uCoolShadow, 0.18 * (1.0 - warmMask));
      vec3 warmed = mix(cooled, uWarmColor, warmMask * uWarmStrength * pulse);

      // Atmospheric perspective — for distant silhouettes, mix the result
      // toward the sky-color band so the silhouette dissolves into the horizon
      // (Rayleigh scattering eats long-distance contrast).
      vec3 atmospheric = mix(warmed, uAtmosphericColor, clamp(uAtmosphericMix, 0.0, 1.0));

      gl_FragColor = vec4(atmospheric, texColor.a * uOpacity);
    }
  `,
);

extend({ SilhouetteSunRakeShaderMaterial });

export { SilhouetteSunRakeShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      silhouetteSunRakeShaderMaterial: any;
    }
  }
}
