/* eslint-disable */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * WaterMaterial — the /shhhh stream surface shader.
 *
 * Composition (back → front):
 *   1. Caustics — animated procedural sin/cos noise grid, modulated by flow
 *   2. Surface flow — UV-scrolled fBm noise in flow direction, gives current
 *   3. Mouse ripples — up to 8 active radial expanding rings, decay over ~2s
 *   4. Mouse hover displacement — subtle real-time push from cursor
 *   5. Edge foam — band based on uEdgeMask sampler (foam where water meets rocks)
 *   6. Final composite — monochrome paper/ink mix
 *
 * Uniforms:
 *   uTime         — seconds since mount
 *   uMouse        — normalized cursor in plane space (-1..1)
 *   uRipples      — Float32Array(32): up to 8 ripples × vec4(x, y, t0, strength)
 *   uFlowDir      — vec2 flow direction (default down-and-right slight)
 *   uColorPaper   — light paper tone
 *   uColorInk     — dark ink tone
 *   uEdgeMask     — optional foam mask sampler (white = rock contact)
 */

const MAX_RIPPLES = 8;
const initialRipples = new Float32Array(MAX_RIPPLES * 4);

const WaterShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(2, 2), // off-plane default → no displacement
    uRipples: initialRipples,
    uFlowDir: new THREE.Vector2(0.6, -0.4),
    uColorPaper: new THREE.Color('#f9fafb'),
    uColorInk: new THREE.Color('#18181b'),
    uEdgeMask: null,
    uHasEdgeMask: 0.0,
    uOpacity: 1.0,
  },
  /* ── Vertex Shader ─────────────────────────────────────────────────── */
  `
    varying vec2 vUv;
    varying vec2 vPlanePos;

    void main() {
      vUv = uv;
      // vPlanePos in -1..1 across the plane (uv * 2 - 1).
      vPlanePos = uv * 2.0 - 1.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* ── Fragment Shader ───────────────────────────────────────────────── */
  `
    precision highp float;

    #define MAX_RIPPLES 8

    varying vec2 vUv;
    varying vec2 vPlanePos;

    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec4 uRipples[MAX_RIPPLES];
    uniform vec2 uFlowDir;
    uniform vec3 uColorPaper;
    uniform vec3 uColorInk;
    uniform sampler2D uEdgeMask;
    uniform float uHasEdgeMask;
    uniform float uOpacity;

    /* ── Hash + value noise primitives ────────────────────────────────── */
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float valueNoise(vec2 p) {
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
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    /* ── Caustics — interfering sin/cos cells, drift with flow ───────── */
    float caustics(vec2 p, float t) {
      vec2 q = p * 4.0 + uFlowDir * t * 0.4;
      float c = 0.0;
      c += sin(q.x * 1.7 + sin(q.y * 1.3 + t * 0.6));
      c += sin(q.y * 1.5 + cos(q.x * 1.1 - t * 0.5));
      c += sin((q.x + q.y) * 1.2 + t * 0.7);
      c = c / 3.0;
      return pow(0.5 + 0.5 * c, 3.0);
    }

    /* ── Single ripple ring — expands outward, decays over ~2s ───────── */
    float ripple(vec2 p, vec2 center, float age, float strength) {
      if (age < 0.0 || age > 2.0) return 0.0;
      float r = distance(p, center);
      float radius = age * 0.9;          // wave travels outward
      float thickness = 0.05 + age * 0.04; // softens with time
      float ring = exp(-pow((r - radius) / thickness, 2.0));
      float decay = 1.0 - smoothstep(0.0, 2.0, age);
      return ring * decay * strength;
    }

    void main() {
      vec2 p = vPlanePos;
      float t = uTime;

      /* 1. Surface flow — moving fBm in flow direction */
      vec2 flowP = p * 2.5 + uFlowDir * t * 0.25;
      float flow = fbm(flowP);

      /* 2. Caustics */
      float caus = caustics(p, t);

      /* 3. Mouse hover displacement — subtle warp toward cursor */
      vec2 toMouse = p - uMouse;
      float mouseDist = length(toMouse);
      float mouseInfluence = exp(-mouseDist * 4.0) * 0.04;
      vec2 warp = normalize(toMouse + 1e-5) * mouseInfluence;

      /* Re-sample noise with warp + ripple offsets */
      float warpedFlow = fbm(flowP + warp * 6.0);

      /* 4. Mouse ripples — accumulate active rings */
      float rippleSum = 0.0;
      for (int i = 0; i < MAX_RIPPLES; i++) {
        vec4 r = uRipples[i];
        float age = t - r.z;
        rippleSum += ripple(p, r.xy, age, r.w);
      }

      /* 5. Edge foam — white band where uEdgeMask > 0 */
      float foam = 0.0;
      if (uHasEdgeMask > 0.5) {
        float mask = texture2D(uEdgeMask, vUv).r;
        // Animate the foam edge slightly with time + flow
        float foamNoise = fbm(p * 6.0 + uFlowDir * t * 0.6);
        foam = smoothstep(0.4, 0.7, mask) * (0.6 + 0.4 * foamNoise);
      }

      /* ── Composite — monochrome paper/ink toning ───────────────────── */
      // Base water tone — paper with subtle darkening from flow
      float darken = 0.10 + 0.18 * (1.0 - warpedFlow);

      // Caustics push toward paper (lighten)
      float lighten = caus * 0.22;

      // Ripples push toward ink (darken on the leading edge)
      float rippleDark = clamp(rippleSum, 0.0, 1.0) * 0.6;

      // Mix ink → paper based on accumulated lightness
      float lightness = clamp(1.0 - darken + lighten - rippleDark, 0.0, 1.0);
      vec3 col = mix(uColorInk, uColorPaper, lightness);

      // Foam = pure paper, additive
      col = mix(col, uColorPaper, foam);

      gl_FragColor = vec4(col, uOpacity);
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
