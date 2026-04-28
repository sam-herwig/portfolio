/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Alpine haze — pre-dawn cool sky behind the alpine ridge silhouettes.
 *
 * Replaces the auto-panning `alpine_wall.webp` wallpaper. Sister to
 * DawnSkyMaterial but deliberately drained of warmth: alpine is the
 * "altitude before sunrise" beat, so all warm tones are saved for Summit's
 * dawn arrival. Single hero dial `uAltitudePulse` ramps 0→1 across the
 * climb — at 0, the sky is denser/heavier (lower altitude haze); at 1, it
 * thins and brightens (higher, drier air at altitude).
 *
 * Mood: cold, quiet, vast.
 */
const AlpineHazeShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uAltitudePulse: 0,
    uColorHazeBase: new Color('#5a6878'), // mid slate — heavy haze near base
    uColorHazeHigh: new Color('#a4b0c4'), // pale slate-violet — thin air at altitude
    uColorHorizon: new Color('#6a7888'), // cool horizon line
    uColorFog: new Color('#7f8f9f'), // cool rolling mist color
    uFbmScale: 2.0,
    uFogSpeed: 0.04,
    uFogScale: 3.0,
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
    uniform float uAltitudePulse;
    uniform vec3 uColorHazeBase;
    uniform vec3 uColorHazeHigh;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorFog;
    uniform float uFbmScale;
    uniform float uFogSpeed;
    uniform float uFogScale;
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
      // Vertical gradient — horizon (heavier haze) at uv.y=0, thinning into
      // pale altitude air at uv.y=1. Rising air pressure ⇒ paler tone.
      float g = smoothstep(0.0, 1.0, vUv.y);
      vec3 sky = mix(uColorHazeBase, uColorHazeHigh, g);

      // Faint horizon band reads as a separate tonal plane near uv.y=0.
      float horizonBand = pow(1.0 - g, 3.0);
      sky = mix(sky, uColorHorizon, horizonBand * 0.35);

      // Painterly unevenness via domain-warped fbm for the sky base
      vec2 sq = vec2(
        fbm(vUv * uFbmScale + vec2(0.0, uTime * 0.011)),
        fbm(vUv * uFbmScale + vec2(4.7, 2.1))
      );
      float wash = fbm(vUv * uFbmScale + 2.0 * sq);
      sky = mix(sky, sky * 1.10, wash * 0.35);

      // Procedural slow-moving rolling mist / fog carried over from Camp
      vec2 fogUv = vUv * uFogScale;
      vec2 fq = vec2(
        fbm(fogUv + vec2(0.0, uTime * uFogSpeed)),
        fbm(fogUv + vec2(5.2, 1.3 - uTime * uFogSpeed * 0.8))
      );
      float fogMask = fbm(fogUv + 4.0 * fq + vec2(uTime * uFogSpeed * 0.5));
      
      // Fog density drops off sharply as uAltitudePulse goes from 0 -> 1
      // It also hugs the ground (vUv.y -> 0)
      float pulse = clamp(uAltitudePulse, 0.0, 1.0);
      float fogHeightFalloff = pow(1.0 - g, 1.5);
      float fogDensity = fogMask * fogHeightFalloff * (1.0 - pulse);
      
      sky = mix(sky, uColorFog, clamp(fogDensity * 1.2, 0.0, 1.0));

      // Altitude lift — uAltitudePulse 0→1 brightens the upper sky and
      // pulls everything slightly toward uColorHazeHigh.
      sky = mix(sky, uColorHazeHigh, g * 0.20 * pulse);

      // Paper fiber grain — keeps the gradient from reading digital.
      float fiber = vnoise(vUv * 90.0);
      sky += (fiber - 0.5) * uGrainAmount;

      gl_FragColor = vec4(sky, uOpacity);
    }
  `,
);

extend({ AlpineHazeShaderMaterial });

export { AlpineHazeShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      alpineHazeShaderMaterial: any;
    }
  }
}
