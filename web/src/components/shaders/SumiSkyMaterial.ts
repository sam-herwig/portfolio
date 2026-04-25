/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Ink-wash night sky — replaces the random point-cloud starfield with a
 * painted sumi-e background. Vertical gradient + domain-warped fbm gives
 * painterly unevenness; an elliptical milky-way band adds composition;
 * stars come from a hashed noise threshold with per-star twinkle.
 *
 * Applied to a large plane behind everything in CampSceneGroup.
 */
const SumiSkyShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorHorizon: new Color('#020617'),
    uColorZenith: new Color('#060a1a'),
    uColorMilky: new Color('#c7c5ff'),
    uColorStar: new Color('#f8fafc'),
    uFbmScale: 2.2,
    uMilkyStrength: 0.18,
    uStarDensity: 0.985, // higher = fewer stars
    uStarTwinkle: 1.2,
    uGrainAmount: 0.03, // paper fiber amplitude (backdrop replacement)
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
    uniform vec3 uColorHorizon;
    uniform vec3 uColorZenith;
    uniform vec3 uColorMilky;
    uniform vec3 uColorStar;
    uniform float uFbmScale;
    uniform float uMilkyStrength;
    uniform float uStarDensity;
    uniform float uStarTwinkle;
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
      // Vertical gradient (horizon -> zenith).
      float g = smoothstep(0.0, 1.0, vUv.y);
      vec3 sky = mix(uColorHorizon, uColorZenith, g);

      // Domain-warped fbm for painterly unevenness.
      vec2 q = vec2(
        fbm(vUv * uFbmScale + vec2(0.0, uTime * 0.01)),
        fbm(vUv * uFbmScale + vec2(5.2, 1.3))
      );
      float wash = fbm(vUv * uFbmScale + 2.0 * q);
      sky = mix(sky, sky * 1.35, wash * 0.25);

      // Milky-way band — rotated ellipse mask modulated by its own fbm.
      vec2 p = vUv - 0.5;
      float cA = cos(0.35);
      float sA = sin(0.35);
      vec2 rp = vec2(cA * p.x - sA * p.y, sA * p.x + cA * p.y);
      float ellipse = 1.0 - smoothstep(0.02, 0.32, abs(rp.y) + abs(rp.x) * 0.25);
      float milkyFbm = fbm(rp * 6.0 + vec2(uTime * 0.006, 0.0));
      float milkyMask = clamp(ellipse * (0.4 + milkyFbm * 0.6), 0.0, 1.0);
      sky = mix(sky, uColorMilky, milkyMask * uMilkyStrength);

      // Stars: per-cell hash, threshold for sparsity, sin-based twinkle.
      vec2 starGrid = vUv * 420.0;
      vec2 cell = floor(starGrid);
      float starHash = hash21(cell);
      float starMask = step(uStarDensity, starHash);
      float twinkle = 0.55 + 0.45 * sin(uTime * uStarTwinkle + starHash * 31.4);
      // Keep the star to a sub-pixel point by weighting it toward cell center.
      vec2 f = fract(starGrid) - 0.5;
      float dot2 = 1.0 - smoothstep(0.0, 0.35, length(f));
      float starVal = starMask * twinkle * dot2;

      // Suppress stars in the brightest part of the milky-way band so it
      // reads as a painted wash rather than a dense point cloud.
      starVal *= mix(1.0, 0.4, milkyMask);

      // Paper fiber grain — replaces the standalone z=-200 backdrop plane.
      float fiber = vnoise(vUv * 85.0);
      vec3 final = sky + uColorStar * starVal * 0.9;
      final += (fiber - 0.5) * uGrainAmount;
      gl_FragColor = vec4(final, uOpacity);
    }
  `,
);

extend({ SumiSkyShaderMaterial });

export { SumiSkyShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      sumiSkyShaderMaterial: any;
    }
  }
}
