/* eslint-disable */
import { Color, Vector2 } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Cloud-sea carpet — painted dawn carpet rolling beneath the summit ledge.
 *
 * Two domain-warp passes build chunky billowing form (broad masses + smaller
 * lumps) instead of uniform tonal smears. Posterized into 4 tonal plateaus so
 * the wash reads as painted, not photoreal. Sun-coupled crest pooling: warm
 * peach + pink/mauve scattering band pool on the side of every cloud-top
 * facing uSunDir — Mie-scattering signature at sunrise. Distance fog at the
 * horizon mixes toward uHorizonColor so the cloud sea hands off into the
 * atmospheric far-ridge layer instead of stopping with a hard edge.
 *
 * Painted on a horizontal plane (rotation.x = -PI/2) below the cliff, so vUv.y
 * reads as world-space depth (near→far). Time drift + subtle vertical breathing
 * keeps the carpet alive even when the user isn't scrolling.
 */
const CloudSeaShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uScrollProgress: 0,
    uSunPulse: 0,
    uCoverage: 1.0,
    uColorCloud: new Color('#f5ecd8'),
    uColorShadow: new Color('#1f2735'),
    uColorWarm: new Color('#fde0a8'),
    uColorScatter: new Color('#e8a8b8'),
    uHorizonColor: new Color('#b8c4d8'),
    uSunDir: new Vector2(0.85, 0.15),
    uFbmScale: 1.8,
    uDriftSpeed: 0.6,
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
    uniform float uScrollProgress;
    uniform float uSunPulse;
    uniform float uCoverage;
    uniform vec3 uColorCloud;
    uniform vec3 uColorShadow;
    uniform vec3 uColorWarm;
    uniform vec3 uColorScatter;
    uniform vec3 uHorizonColor;
    uniform vec2 uSunDir;
    uniform float uFbmScale;
    uniform float uDriftSpeed;
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
      for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.05;
        a *= 0.55;
      }
      return v;
    }

    void main() {
      // Scroll-coupled drift + livelier passive time so the carpet stays alive
      // even when the user isn't scrolling.
      vec2 drift = vec2(uScrollProgress * uDriftSpeed, uTime * 0.05);

      // Subtle vertical breathing — slow sin so the carpet undulates.
      float breathe = sin(uTime * 0.3) * 0.015;

      // First domain-warp pass — broad cloud-mass shapes.
      vec2 q = vec2(
        fbm(vUv * uFbmScale + drift),
        fbm(vUv * uFbmScale + vec2(3.7, 8.2) + drift)
      );

      // Second domain-warp pass — stronger displacement for discrete chunky
      // billows instead of uniform tonal smears.
      vec2 r = vec2(
        fbm(vUv * uFbmScale * 1.4 + 1.6 * q + vec2(1.7, 9.2)),
        fbm(vUv * uFbmScale * 1.4 + 1.6 * q + vec2(8.3, 2.8))
      );
      float wash = fbm(vUv * uFbmScale * 1.8 + 2.4 * r + vec2(0.0, breathe));

      // Posterize gently into 4 tonal plateaus so the carpet reads "painted".
      float plateaus = floor(wash * 4.0) / 4.0;
      float cloud = mix(wash, plateaus, 0.45);

      // Sun-side mask — pools the warm/scatter highlights on the cloud-tops
      // facing the sun direction. Same uSunDir shared with the silhouette
      // shaders so the whole module rakes consistently.
      vec2 sunUnit = normalize(uSunDir + vec2(1e-5));
      float sunSide = smoothstep(-0.2, 0.6, dot(vUv - 0.5, sunUnit));

      // Vertical falloff — vUv.y from horizon (1.0, far) to viewer (0.0, near).
      float horizonBias = smoothstep(0.0, 0.65, vUv.y);
      float carpet = clamp(cloud * 0.85 + horizonBias * 0.25, 0.0, 1.0);

      // Tonal base: deep cool valleys → cloud body.
      vec3 col = mix(uColorShadow, uColorCloud, carpet);

      float pulse = clamp(uSunPulse, 0.0, 1.0);

      // Pink/mauve scattering transition — Mie at sunrise pools pink in the
      // band where light grazes cloud-tops sideways. Sits below the warm crest.
      float scatterBand = smoothstep(0.4, 0.7, cloud) * (1.0 - smoothstep(0.7, 0.9, cloud));
      col = mix(col, uColorScatter, scatterBand * 0.45 * pulse * sunSide);

      // Warm peach crests — strong highlight on the brightest cloud-tops,
      // pooled toward the sun direction.
      float crest = smoothstep(0.7, 0.92, cloud);
      col = mix(col, uColorWarm, crest * 0.65 * pulse * sunSide);

      // Distance fog — clouds desaturate toward sky-color near the horizon,
      // unifying with the atmospheric far ridge so the horizon reads as a
      // single band of light, not as discrete layers stacked on each other.
      float distanceFog = smoothstep(0.55, 0.95, vUv.y);
      col = mix(col, uHorizonColor, distanceFog * 0.45);

      // Soft alpha — pulled the bottom falloff in (was 0→0.35) so cloud
      // structure is visible across the carpet, not just near the horizon.
      float alpha = smoothstep(0.0, 0.15, vUv.y) * uOpacity;

      // Coverage gate — clouds *condense* in the noise field rather than
      // scaling geometrically. uCoverage = 1 (Summit default) → full carpet.
      float coverage = clamp(uCoverage, 0.0, 1.0);
      float coverageMask = smoothstep(1.0 - coverage - 0.1, 1.0 - coverage + 0.1, cloud);
      alpha *= coverageMask;

      gl_FragColor = vec4(col, alpha);
    }
  `,
);

extend({ CloudSeaShaderMaterial });

export { CloudSeaShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cloudSeaShaderMaterial: any;
    }
  }
}
