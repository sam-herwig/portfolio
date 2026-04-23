/* eslint-disable */
import { Color, Vector3 } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * WaterMaterial — /shhhh dawn lake, true 3D horizontal surface.
 *
 * Vertex:
 *   - Four summed directional sines for rest motion (total crest ~5 cm).
 *   - Radial ripple waves at world-XZ click points (amp 4 cm, speed 1.4 m/s,
 *     lifetime 3.5 s).
 *   - Analytic normals computed from the partial derivatives of the wave
 *     sum — cheaper and less "plastic" than a normal map.
 *
 * Fragment:
 *   - Bokashi by distance: near→far→horizon across viewDist 8–70 m. Sells
 *     recession across the lake surface.
 *   - Fresnel: pow(1 - N·V, 4) mixes water body with reflection; grazing
 *     angles at the horizon read as mirror, near-camera reads as pigment.
 *   - Stylized reflection: reflected view ray projected onto the mountain
 *     billboard plane; on-billboard UVs sample the painted mountain (desat
 *     30%, tint 25% toward far-water), off-billboard UVs fall back to
 *     horizon color. A vertical alpha ramp matches the billboard's own
 *     fade so reflections dissolve into fog where the mountain does.
 *   - Crest specular: Blinn-Phong against a fake low-sun direction, gated
 *     by the ripple crest mask so only raised wavefronts glint.
 *   - Paper grain in screen space for sumi-e tooth at any angle.
 *   - Manual exp² fog mix at the end so the water dissolves into the scene
 *     fog band without depending on ShaderMaterial fog chunks.
 */

const MAX_RIPPLES = 8;
const initialRipples = new Float32Array(MAX_RIPPLES * 4);

const WaterShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uRipples: initialRipples,
    uMountainTex: null,
    uSunDir: new Vector3(-0.3, 0.4, -0.6).normalize(),

    // Billboard geometry so the reflection can project onto it.
    uBillboardX: 0.0,
    uBillboardZ: -95.0,
    uBillboardY: 18.0,
    uBillboardW: 240.0,
    uBillboardH: 45.0,

    // Cool dawn palette — no warm tones.
    uColorHorizon: new Color('#c7ccc9'),
    uColorWaterFar: new Color('#6b7a85'),
    uColorWaterNear: new Color('#b2b9b8'),
    uColorRippleTint: new Color('#8a9299'),
    uColorSpec: new Color('#e8ecef'),

    uFogColor: new Color('#c7ccc9'),
    uFogDensity: 0.011,

    // Tunable feel knobs (exposed via Leva).
    uFresnelExp: 4.0,
    uReflStrength: 0.9,
    uFresnelJitter: 0.08,
    uBokashiWarp: 0.12,
    uReflWarpU: 0.022,
    uReflWarpV: 0.016,
    uWarpScale: 0.15,
    uPigmentAmount: 0.3,
    uEdgeDarken: 0.14,
    uCrestSpecStrength: 0.35,
    uCrestSpecExp: 80.0,
    uRippleTint: 0.12,
  },
  /* ── Vertex ─────────────────────────────────────────────────────────── */
  `
    #define MAX_RIPPLES 8

    uniform float uTime;
    uniform vec4 uRipples[MAX_RIPPLES];

    varying vec3 vWorldPos;
    varying vec3 vViewPos;
    varying vec3 vNormal;
    varying float vCrest;

    /* Four directional sine waves — tiny amplitudes, gentle speeds.
       Dawn/still: you have to look twice to see motion. */
    float waveH(vec2 p, float t) {
      float h = 0.0;
      h += sin(dot(p, vec2(1.0, 0.3))  * (6.2831853 / 6.0)  + t * 0.40) * 0.018;
      h += sin(dot(p, vec2(-0.7, 0.5)) * (6.2831853 / 11.0) + t * 0.30) * 0.022;
      h += sin(dot(p, vec2(0.2, -1.0)) * (6.2831853 / 3.5)  + t * 0.60) * 0.008;
      h += sin(dot(p, vec2(0.9, -0.1)) * (6.2831853 / 1.8)  + t * 0.90) * 0.004;
      return h;
    }

    /* Analytic gradient of waveH — exactly the sum of d/dxz of each sine. */
    vec2 waveG(vec2 p, float t) {
      vec2 g = vec2(0.0);
      float k;
      k = 6.2831853 / 6.0;
      g += vec2(1.0, 0.3)  * cos(dot(p, vec2(1.0, 0.3))  * k + t * 0.40) * 0.018 * k;
      k = 6.2831853 / 11.0;
      g += vec2(-0.7, 0.5) * cos(dot(p, vec2(-0.7, 0.5)) * k + t * 0.30) * 0.022 * k;
      k = 6.2831853 / 3.5;
      g += vec2(0.2, -1.0) * cos(dot(p, vec2(0.2, -1.0)) * k + t * 0.60) * 0.008 * k;
      k = 6.2831853 / 1.8;
      g += vec2(0.9, -0.1) * cos(dot(p, vec2(0.9, -0.1)) * k + t * 0.90) * 0.004 * k;
      return g;
    }

    /* Radial ripple contribution at world XZ. */
    void rippleContrib(vec2 p, float t, out float dy, out vec2 dg, out float crest) {
      dy = 0.0;
      dg = vec2(0.0);
      crest = 0.0;
      for (int i = 0; i < MAX_RIPPLES; i++) {
        vec4 r = uRipples[i];
        float age = t - r.z;
        if (age > 0.0 && age < 3.5) {
          float dist = distance(p, r.xy);
          float radius = age * 1.4;
          float thick = 0.08 + age * 0.04;
          float x = (dist - radius) / thick;
          float gauss = exp(-x * x);
          float decay = 1.0 - smoothstep(0.0, 3.5, age);
          float amp = 0.04 * decay * r.w;
          dy += amp * gauss;
          /* radial derivative of gauss × amp */
          float dRadial = amp * gauss * (-2.0 * x / thick);
          vec2 dir = (p - r.xy) / max(dist, 0.001);
          dg += dir * dRadial;
          crest = max(crest, gauss * decay * r.w);
        }
      }
    }

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vec2 xz = worldPos.xz;
      float t = uTime;

      float hRest = waveH(xz, t);
      vec2  gRest = waveG(xz, t);
      float hRip; vec2 gRip; float crest;
      rippleContrib(xz, t, hRip, gRip, crest);

      worldPos.y += hRest + hRip;
      vec2 grad = gRest + gRip;

      /* Normal of the height field: N = normalize(-dH/dx, 1, -dH/dz).
         grad.x = dH/dx, grad.y = dH/dz (because xz = worldPos.xz). */
      vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));
      vWorldPos = worldPos.xyz;

      vec4 viewPos = viewMatrix * worldPos;
      vViewPos = viewPos.xyz;
      vCrest = crest;

      gl_Position = projectionMatrix * viewPos;
    }
  `,
  /* ── Fragment ───────────────────────────────────────────────────────── */
  `
    precision highp float;

    varying vec3 vWorldPos;
    varying vec3 vViewPos;
    varying vec3 vNormal;
    varying float vCrest;

    uniform float uTime;
    uniform sampler2D uMountainTex;
    uniform vec3 uSunDir;

    uniform float uBillboardX;
    uniform float uBillboardZ;
    uniform float uBillboardY;
    uniform float uBillboardW;
    uniform float uBillboardH;

    uniform vec3 uColorHorizon;
    uniform vec3 uColorWaterFar;
    uniform vec3 uColorWaterNear;
    uniform vec3 uColorRippleTint;
    uniform vec3 uColorSpec;

    uniform vec3 uFogColor;
    uniform float uFogDensity;

    uniform float uFresnelExp;
    uniform float uReflStrength;
    uniform float uFresnelJitter;
    uniform float uBokashiWarp;
    uniform float uReflWarpU;
    uniform float uReflWarpV;
    uniform float uWarpScale;
    uniform float uPigmentAmount;
    uniform float uEdgeDarken;
    uniform float uCrestSpecStrength;
    uniform float uCrestSpecExp;
    uniform float uRippleTint;

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
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vWorldPos);
      float viewDist = length(vViewPos);

      /* ── Domain-warped flow field (Iñigo Quilez trick) ───────────
         fbm(p + fbm(p + fbm(p))) — produces slow, non-repeating motion
         that reads as pigment drifting across wet paper. Reused below
         for bokashi boundary, reflection UVs, and fresnel bleed so all
         three transitions feel organically bled instead of pasted. */
      vec2 warpBase = vWorldPos.xz * uWarpScale;
      vec2 q = vec2(
        fbm(warpBase + vec2(0.0, uTime * 0.030)),
        fbm(warpBase + vec2(5.2, 1.3) + vec2(uTime * 0.025, 0.0))
      );
      vec2 warp = vec2(
        fbm(warpBase + 4.0 * q),
        fbm(warpBase + 4.0 * q + vec2(8.3, 2.8))
      ) - 0.5;

      /* ── Bokashi by distance ─────────────────────────────────────── */
      float bokT = clamp(smoothstep(8.0, 70.0, viewDist) + warp.x * uBokashiWarp, 0.0, 1.0);
      vec3 waterBody = mix(uColorWaterNear, uColorWaterFar, smoothstep(0.0, 0.5, bokT));
      waterBody = mix(waterBody, uColorHorizon, smoothstep(0.5, 1.0, bokT));

      /* Pigment density — two not-quite-mixed tones drift over the body. */
      float pigment = fbm(vWorldPos.xz * 0.08 + vec2(uTime * 0.015, -uTime * 0.010));
      vec3 wetTone = mix(uColorWaterNear, uColorRippleTint, 0.25);
      waterBody = mix(waterBody, wetTone, smoothstep(0.4, 0.75, pigment) * uPigmentAmount);

      /* ── Fresnel ─────────────────────────────────────────────────── */
      float F = pow(1.0 - max(0.0, dot(N, V)), uFresnelExp);

      /* ── Reflection via reflected view ray → billboard plane ─────── */
      vec3 R = reflect(-V, N);
      vec3 reflCol = uColorHorizon;
      if (R.z < -0.001) {
        float tHit = (uBillboardZ - vWorldPos.z) / R.z;
        if (tHit > 0.0) {
          vec3 hit = vWorldPos + R * tHit;
          float u = (hit.x - uBillboardX + uBillboardW * 0.5) / uBillboardW;
          float v = (hit.y - (uBillboardY - uBillboardH * 0.5)) / uBillboardH;
          /* Wave-normal wobble + domain-warp bleed. The warp term is the
             living-paper move — reflection edges breathe and drift. */
          u += -N.x * 0.04 + warp.x * uReflWarpU;
          v += -N.z * 0.02 + warp.y * uReflWarpV;
          if (u >= 0.0 && u <= 1.0 && v >= 0.0 && v <= 1.0) {
            vec4 sampleCol = texture2D(uMountainTex, vec2(u, v));
            vec3 mCol = sampleCol.rgb;
            /* Match the billboard's own bottom-alpha fade so reflections
               dissolve where the mountain does. */
            float bottomFade = 1.0 - smoothstep(0.75, 1.0, 1.0 - v);
            float mAlpha = sampleCol.a * bottomFade;
            /* Desaturate 30%, tint 25% toward far-water palette. */
            float lum = dot(mCol, vec3(0.299, 0.587, 0.114));
            mCol = mix(mCol, vec3(lum), 0.30);
            mCol = mix(mCol, uColorWaterFar, 0.25);
            reflCol = mix(uColorHorizon, mCol, mAlpha);
          }
        }
      }

      /* ── Combine water + reflection with noise-jittered fresnel ──── */
      float Fjitter = F * uReflStrength + warp.y * uFresnelJitter * smoothstep(0.1, 0.6, F);
      vec3 col = mix(waterBody, reflCol, clamp(Fjitter, 0.0, 1.0));

      /* ── Edge darkening / pigment pooling on wave shoulders ─────── */
      float shoulder = 1.0 - abs(N.y);
      float pool = smoothstep(0.05, 0.25, shoulder);
      pool *= 0.5 + 0.5 * fbm(vWorldPos.xz * 0.4 + uTime * 0.020);
      col *= 1.0 - pool * uEdgeDarken;

      /* ── Crest specular (Blinn-Phong), gated by ripple crest ─────── */
      vec3 H = normalize(uSunDir + V);
      float spec = pow(max(0.0, dot(N, H)), uCrestSpecExp);
      col += uColorSpec * spec * vCrest * uCrestSpecStrength;

      /* Slight ripple tint on the wake for a touch of ink-wash. */
      col = mix(col, uColorRippleTint, vCrest * uRippleTint);

      /* ── Manual exp² fog ─────────────────────────────────────────── */
      float fogAmount = 1.0 - exp(-pow(uFogDensity * viewDist, 2.0));
      col = mix(col, uFogColor, fogAmount);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
);

extend({ WaterShaderMaterial });

export { WaterShaderMaterial, MAX_RIPPLES };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      waterShaderMaterial: any;
    }
  }
}
