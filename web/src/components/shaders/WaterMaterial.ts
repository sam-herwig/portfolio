/* eslint-disable */
import { Color, Vector3 } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const MAX_RIPPLES = 8;
const initialRipples = new Float32Array(MAX_RIPPLES * 4);

const WaterShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uRipples: initialRipples,
    uMountainTex: null,
    uSunDir: new Vector3(-0.3, 0.4, -0.6).normalize(),

    uBillboardX: 0.0,
    uBillboardZ: -95.0,
    uBillboardY: 18.0,
    uBillboardW: 240.0,
    uBillboardH: 45.0,

    uColorHorizon: new Color('#c7ccc9'),
    uColorWaterFar: new Color('#6b7a85'),
    uColorWaterNear: new Color('#b2b9b8'),
    uColorRippleTint: new Color('#8a9299'),
    uColorSpec: new Color('#e8ecef'),

    // New Colors
    uColorCaustics: new Color('#ffffff'),
    uColorFoam: new Color('#f0f4f5'),

    uFogColor: new Color('#c7ccc9'),
    uFogDensity: 0.011,

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

    // New Controls
    uCausticIntensity: 0.2,
    uFoamThreshold: 0.02,
    uWaveSteepness: 0.05,
  },
  /* ── Vertex ─────────────────────────────────────────────────────────── */
  `
    #define MAX_RIPPLES 8

    uniform float uTime;
    uniform vec4 uRipples[MAX_RIPPLES];
    uniform float uWaveSteepness;

    varying vec3 vWorldPos;
    varying vec3 vViewPos;
    varying vec3 vNormal;
    varying float vCrest;

    /* Gerstner Wave implementation */
    vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal, float t) {
      float steepness = wave.z * uWaveSteepness;
      float wavelength = wave.w;
      float k = 2.0 * 3.14159 / wavelength;
      float c = sqrt(9.8 / k);
      vec2 d = normalize(wave.xy);
      float f = k * (dot(d, p.xz) - c * t);
      float a = steepness / k;
      
      tangent += vec3(
        -d.x * d.x * (steepness * sin(f)),
        d.x * (steepness * cos(f)),
        -d.x * d.y * (steepness * sin(f))
      );
      binormal += vec3(
        -d.x * d.y * (steepness * sin(f)),
        d.y * (steepness * cos(f)),
        -d.y * d.y * (steepness * sin(f))
      );
      return vec3(
        d.x * (a * cos(f)),
        a * sin(f),
        d.y * (a * cos(f))
      );
    }

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
          float dRadial = amp * gauss * (-2.0 * x / thick);
          vec2 dir = (p - r.xy) / max(dist, 0.001);
          dg += dir * dRadial;
          crest = max(crest, gauss * decay * r.w);
        }
      }
    }

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vec3 p = worldPos.xyz;
      float t = uTime;
      
      vec3 tangent = vec3(1.0, 0.0, 0.0);
      vec3 binormal = vec3(0.0, 0.0, 1.0);
      
      // Wave directions, steepness baseline, wavelength
      vec4 waveA = vec4(1.0, 0.3, 0.5, 6.0);
      vec4 waveB = vec4(-0.7, 0.5, 0.4, 11.0);
      vec4 waveC = vec4(0.2, -1.0, 0.2, 3.5);
      vec4 waveD = vec4(0.9, -0.1, 0.1, 1.8);
      
      vec3 pOffset = vec3(0.0);
      pOffset += gerstnerWave(waveA, p, tangent, binormal, t);
      pOffset += gerstnerWave(waveB, p, tangent, binormal, t);
      pOffset += gerstnerWave(waveC, p, tangent, binormal, t);
      pOffset += gerstnerWave(waveD, p, tangent, binormal, t);
      
      p += pOffset;
      
      float hRip; vec2 gRip; float crest;
      rippleContrib(worldPos.xz, t, hRip, gRip, crest);
      p.y += hRip;
      tangent.y += gRip.x; 
      binormal.y += gRip.y; 
      
      vNormal = normalize(cross(binormal, tangent));
      vWorldPos = p;
      
      vec4 viewPos = viewMatrix * vec4(p, 1.0);
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
    
    uniform vec3 uColorCaustics;
    uniform vec3 uColorFoam;
    uniform float uCausticIntensity;
    uniform float uFoamThreshold;

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
    
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p)*43758.5453);
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
    
    float voronoi(vec2 x, float t) {
      vec2 n = floor(x);
      vec2 f = fract(x);
      float res = 8.0;
      for(int j=-1; j<=1; j++)
      for(int i=-1; i<=1; i++) {
        vec2 g = vec2(float(i),float(j));
        vec2 o = hash2(n + g);
        o = 0.5 + 0.5*sin(t + 6.2831*o);
        vec2 r = g - f + o;
        float d = dot(r,r);
        res = min(res, d);
      }
      return sqrt(res);
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vWorldPos);
      float viewDist = length(vViewPos);

      vec2 warpBase = vWorldPos.xz * uWarpScale;
      vec2 q = vec2(
        fbm(warpBase + vec2(0.0, uTime * 0.030)),
        fbm(warpBase + vec2(5.2, 1.3) + vec2(uTime * 0.025, 0.0))
      );
      vec2 warp = vec2(
        fbm(warpBase + 4.0 * q),
        fbm(warpBase + 4.0 * q + vec2(8.3, 2.8))
      ) - 0.5;

      float bokT = clamp(smoothstep(8.0, 70.0, viewDist) + warp.x * uBokashiWarp, 0.0, 1.0);
      vec3 waterBody = mix(uColorWaterNear, uColorWaterFar, smoothstep(0.0, 0.5, bokT));
      waterBody = mix(waterBody, uColorHorizon, smoothstep(0.5, 1.0, bokT));

      float pigment = fbm(vWorldPos.xz * 0.08 + vec2(uTime * 0.015, -uTime * 0.010));
      vec3 wetTone = mix(uColorWaterNear, uColorRippleTint, 0.25);
      waterBody = mix(waterBody, wetTone, smoothstep(0.4, 0.75, pigment) * uPigmentAmount);

      float F = pow(1.0 - max(0.0, dot(N, V)), uFresnelExp);

      vec3 R = reflect(-V, N);
      vec3 reflCol = uColorHorizon;
      if (R.z < -0.001) {
        float tHit = (uBillboardZ - vWorldPos.z) / R.z;
        if (tHit > 0.0) {
          vec3 hit = vWorldPos + R * tHit;
          float u = (hit.x - uBillboardX + uBillboardW * 0.5) / uBillboardW;
          float v = (hit.y - (uBillboardY - uBillboardH * 0.5)) / uBillboardH;
          u += -N.x * 0.04 + warp.x * uReflWarpU;
          v += -N.z * 0.02 + warp.y * uReflWarpV;
          if (u >= 0.0 && u <= 1.0 && v >= 0.0 && v <= 1.0) {
            vec4 sampleCol = texture2D(uMountainTex, vec2(u, v));
            vec3 mCol = sampleCol.rgb;
            float bottomFade = 1.0 - smoothstep(0.75, 1.0, 1.0 - v);
            float mAlpha = sampleCol.a * bottomFade;
            float lum = dot(mCol, vec3(0.299, 0.587, 0.114));
            mCol = mix(mCol, vec3(lum), 0.30);
            mCol = mix(mCol, uColorWaterFar, 0.25);
            reflCol = mix(uColorHorizon, mCol, mAlpha);
          }
        }
      }

      float Fjitter = F * uReflStrength + warp.y * uFresnelJitter * smoothstep(0.1, 0.6, F);
      vec3 col = mix(waterBody, reflCol, clamp(Fjitter, 0.0, 1.0));

      float shoulder = 1.0 - abs(N.y);
      float pool = smoothstep(0.05, 0.25, shoulder);
      pool *= 0.5 + 0.5 * fbm(vWorldPos.xz * 0.4 + uTime * 0.020);
      col *= 1.0 - pool * uEdgeDarken;

      /* Caustics */
      float caustics = voronoi(vWorldPos.xz * 0.5 + uTime * 0.2, uTime * 0.5);
      caustics = pow(1.0 - caustics, 3.0) * uCausticIntensity;
      float causticsMask = smoothstep(40.0, 10.0, viewDist);
      col += uColorCaustics * caustics * causticsMask;

      /* Crest Specular */
      vec3 H = normalize(uSunDir + V);
      float spec = pow(max(0.0, dot(N, H)), uCrestSpecExp);
      col += uColorSpec * spec * vCrest * uCrestSpecStrength;

      /* Wake Ripple Tint */
      col = mix(col, uColorRippleTint, vCrest * uRippleTint);
      
      /* Gerstner Foam */
      float foamNoise = fbm(vWorldPos.xz * 2.0 - uTime * 0.5);
      float foamMask = smoothstep(uFoamThreshold, uFoamThreshold + 0.05, vWorldPos.y) * foamNoise;
      col = mix(col, uColorFoam, clamp(foamMask, 0.0, 1.0));

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
