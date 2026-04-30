/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Sumi sky for Camp. The Milky Way reads as a printed multi-ink screen:
 * cool indigo-to-teal dust band, magenta-violet shoulders, warm peach core
 * highlights, sampled from a 1D gradient LUT. Anisotropic dust lanes streak
 * along the band axis, darkening toward a wiped-ink indigo. Stars distribute
 * via power-law brightness with discrete cool/cream/warm temperatures and
 * out-of-sync twinkle. Top ~1% get halos and a luminance boost so the
 * existing bloom pass amplifies them.
 *
 * Most aesthetic levers are uniforms so Sam can tune via Leva live.
 */
const SumiSkyShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uLUT: null,
    // Palette
    uColorHorizon: new Color('#01030a'),
    uColorZenith: new Color('#061126'),
    uColorDust: new Color('#050818'),
    uColorStar: new Color('#f4e8cd'),
    uColorStarCool: new Color('#c8dcff'),
    uColorStarWarm: new Color('#ffc8a0'),
    // Band geometry / character
    uBandAngle: -0.262,
    uBandWidth: 1.9,
    uMilkyStrength: 0.55,
    uCoreWidth: 0.14,
    uColorStrength: 0.32,
    uDustLaneStrength: 0.72,
    uAnimationSpeed: 0.06,
    // Stars
    uStarDensity: 0.988,
    uStarGrid: 600.0,
    uStarFalloff: 8.0,
    uStarSizeBase: 0.18,
    uStarSizeRange: 0.2,
    uStarTwinkle: 0.7,
    uStarTrim: 0.85,
    uCoolMix: 0.18,
    uWarmMix: 0.15,
    uHeroThreshold: 0.99,
    uHeroHalo: 0.55,
    uHeroHaloRadius: 0.5,
    uHeroBoost: 1.8,
    uHorizonFadeStart: 0.15,
    uHorizonFadeEnd: 0.5,
    // Finish
    uHazeAltitude: 0.3,
    uHazeStrength: 0.15,
    uGrainAmount: 0.022,
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
    uniform sampler2D uLUT;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorZenith;
    uniform vec3 uColorDust;
    uniform vec3 uColorStar;
    uniform vec3 uColorStarCool;
    uniform vec3 uColorStarWarm;
    uniform float uBandAngle;
    uniform float uBandWidth;
    uniform float uMilkyStrength;
    uniform float uCoreWidth;
    uniform float uColorStrength;
    uniform float uDustLaneStrength;
    uniform float uAnimationSpeed;
    uniform float uStarDensity;
    uniform float uStarGrid;
    uniform float uStarFalloff;
    uniform float uStarSizeBase;
    uniform float uStarSizeRange;
    uniform float uStarTwinkle;
    uniform float uStarTrim;
    uniform float uCoolMix;
    uniform float uWarmMix;
    uniform float uHeroThreshold;
    uniform float uHeroHalo;
    uniform float uHeroHaloRadius;
    uniform float uHeroBoost;
    uniform float uHorizonFadeStart;
    uniform float uHorizonFadeEnd;
    uniform float uHazeAltitude;
    uniform float uHazeStrength;
    uniform float uGrainAmount;
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

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p *= 2.07;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Base sky gradient (horizon -> zenith).
      float g = smoothstep(0.0, 1.0, vUv.y);
      vec3 sky = mix(uColorHorizon, uColorZenith, g);

      // Galactic band frame.
      float drift = uTime * uAnimationSpeed * 2.5;
      vec2 p = vec2((vUv.x - 0.5) * uBandWidth, vUv.y - 0.5);
      float cs = cos(uBandAngle), sn = sin(uBandAngle);
      vec2 bandUV = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs);
      float bandAxis = bandUV.y;
      float alongBand = bandUV.x;

      // Flowing river distortion (ink-bleed character).
      vec2 flowUV = vec2(alongBand - drift, bandAxis * 2.5);
      float flowNoise = fbm(flowUV);
      vec2 swirlUV = vec2(alongBand - drift * 1.3, bandAxis * 4.5 + flowNoise * 1.5);
      float swirl = fbm(swirlUV);
      float d = abs(bandAxis + (flowNoise - 0.5) * 0.35 + (swirl - 0.5) * 0.2);

      // Density layers.
      float outerBleed = 1.0 - smoothstep(0.05, 0.45, d);
      float innerInk = 1.0 - smoothstep(0.02, 0.18 + uCoreWidth, d + swirl * 0.08);
      float corePigment = 1.0 - smoothstep(0.0, 0.06 + uCoreWidth * 0.4, abs(bandAxis + (flowNoise - 0.5) * 0.25));
      float poolingNoise = fbm(vec2(alongBand * 3.5 - drift * 0.7, bandAxis * 7.0));
      float pools = smoothstep(0.55, 0.95, poolingNoise) * innerInk;

      // Combined density drives the LUT lookup (0 = empty sky, 1 = brightest core).
      float density = clamp(outerBleed * 0.30 + innerInk * 0.50 + corePigment * 0.55 + pools * 0.70, 0.0, 1.0);

      // Anisotropic dust streaks.
      vec2 dustUV = vec2(alongBand * 0.9 - drift * 0.4, bandAxis * 7.5);
      float dustStreaks = fbm(dustUV);
      float dustMask = smoothstep(0.45, 0.78, dustStreaks) * innerInk;

      // Scroll-coupled drama: peak at center of camp window, soft floor at edges.
      float scrollPeak = 1.0 - 2.0 * abs(uScrollProgress - 0.5);
      scrollPeak = smoothstep(0.0, 1.0, max(0.0, scrollPeak));
      float scrollMix = uScrollFloor + (1.0 - uScrollFloor) * scrollPeak;
      float colorStrengthEffective = uColorStrength * scrollMix;
      float dustEffective = uDustLaneStrength * scrollMix;

      // Sample LUT at current density.
      vec3 lutColor = texture2D(uLUT, vec2(density, 0.5)).rgb;

      // Blend monochrome fallback with LUT color by colorStrength.
      vec3 desaturated = vec3(density * 0.6 + 0.05);
      vec3 nebulaColor = mix(desaturated, lutColor, clamp(0.3 + colorStrengthEffective * 1.4, 0.0, 1.0));

      // Apply dust lane darkening.
      nebulaColor = mix(nebulaColor, uColorDust, dustMask * dustEffective);

      // Composite the band over the base sky.
      sky = mix(sky, nebulaColor, density * uMilkyStrength);

      // Boost brightest pigment-pool centers above bloom threshold (0.5).
      float coreBoost = pools * corePigment * uMilkyStrength * 0.6;
      sky += nebulaColor * coreBoost;

      // ── Stars ──
      vec2 starGrid = vUv * uStarGrid;
      vec2 cell = floor(starGrid);
      float starHash = hash21(cell);
      float starHash2 = hash21(cell + vec2(13.7, 7.31));

      float localDensity = mix(uStarDensity, uStarDensity + 0.015, corePigment);
      float starMask = step(localDensity, starHash);

      float starBrightness = pow(starHash2, uStarFalloff);
      float starSize = uStarSizeBase + starBrightness * uStarSizeRange;

      float starPhase = starHash * 6.2832;
      float twinkleRate = uStarTwinkle * (0.6 + starHash2 * 1.6);
      float twinkle = 0.55 + 0.45 * sin(uTime * twinkleRate + starPhase);

      vec2 starF = fract(starGrid) - 0.5;
      float starDist = length(starF);
      float starGlow = 1.0 - smoothstep(0.0, starSize, starDist);

      // Halo on top (1 - uHeroThreshold) % of stars.
      float heroFlag = step(uHeroThreshold, starHash2);
      float heroHalo = (1.0 - smoothstep(0.0, uHeroHaloRadius, starDist)) * heroFlag * uHeroHalo;

      // Per-star color temperature (3-bin, branchless via step + mix).
      float tempHash = fract(starHash * 7.31 + starHash2 * 3.17);
      vec3 starColor = uColorStar;
      starColor = mix(starColor, uColorStarCool, step(tempHash, uCoolMix));
      starColor = mix(starColor, uColorStarWarm, step(1.0 - uWarmMix, tempHash));

      float horizonFade = smoothstep(uHorizonFadeStart, uHorizonFadeEnd, vUv.y);

      float starVal = starMask * twinkle * starBrightness * horizonFade;
      float starOutput = (starGlow + heroHalo) * starVal;

      float heroBoostMul = 1.0 + heroFlag * uHeroBoost;
      vec3 starContrib = starColor * starOutput * heroBoostMul * uStarTrim;

      // ── Compose final ──
      vec3 final = sky + starContrib;

      // Horizon haze.
      float haze = smoothstep(uHazeAltitude, 0.0, vUv.y);
      final = mix(final, uColorHorizon * 1.05, haze * uHazeStrength);

      // Paper grain.
      float fiber = vnoise(vUv * 90.0);
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
