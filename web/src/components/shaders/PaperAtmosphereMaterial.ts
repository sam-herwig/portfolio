/* eslint-disable */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const PaperAtmosphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uVelocity: 0, // Scroll velocity (0 = still, 1 = fast)
    uAccentColor: new THREE.Color('#f59e0b'),
    uPaperColor: new THREE.Color('#f5f5f4'),
    uInkColor: new THREE.Color('#18181b'),
    uResolution: new THREE.Vector2(1, 1),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uVelocity;
    uniform vec3 uAccentColor;
    uniform vec3 uPaperColor;
    uniform vec3 uInkColor;
    uniform vec2 uResolution;

    // --- Simplex-style noise ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
       -0.577350269189626,
        0.024390243902439
      );
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // Fractional Brownian motion for layered detail
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 st = vec2(uv.x * aspect, uv.y);

      float slowTime = uTime * 0.05;
      float vel = clamp(uVelocity, 0.0, 1.0);

      // --- Paper fiber texture ---
      // Base fiber pattern: high-frequency noise for fine grain
      float fiber1 = fbm(st * 12.0 + slowTime * 0.3);
      float fiber2 = snoise(st * 25.0 + vec2(slowTime * 0.1, 0.0));

      // Directional stretch on fast scroll (fibers align vertically)
      vec2 stretchUV = vec2(st.x, st.y * (1.0 + vel * 0.4));
      float fiberStretched = snoise(stretchUV * 18.0 + vec2(0.0, slowTime));
      float fiber = mix(fiber1, fiberStretched, vel * 0.6);

      // Combine fibers into subtle paper texture
      float paperGrain = 0.03 + fiber * 0.02 + fiber2 * 0.008;

      // --- Wind ripple on fast scroll ---
      float ripple = snoise(vec2(st.x * 3.0 + uTime * 0.8, st.y * 8.0)) * vel * 0.015;

      // --- Base paper color with grain ---
      vec3 color = uPaperColor;
      // Darken slightly with grain (simulates fiber shadows)
      color -= paperGrain;
      // Add ripple as brightness variation
      color += ripple;

      // --- Accent color watercolor seep from edges ---
      // Distance from edges (0 at edge, 1 at center)
      float edgeL = smoothstep(0.0, 0.25, uv.x);
      float edgeR = smoothstep(1.0, 0.75, uv.x);
      float edgeT = smoothstep(1.0, 0.8, uv.y);
      float edgeB = smoothstep(0.0, 0.15, uv.y);
      float edgeMask = 1.0 - (edgeL * edgeR * edgeT * edgeB);

      // Organic bleeding shape via noise
      float bleedNoise = fbm(st * 4.0 + vec2(uTime * 0.2, slowTime));
      float bleedShape = edgeMask * smoothstep(-0.2, 0.5, bleedNoise);

      // Velocity controls how much accent bleeds in
      float bleedStrength = vel * 0.2 * bleedShape;

      // Mix accent watercolor into paper
      vec3 watercolorTint = mix(uAccentColor, uAccentColor * 0.7, bleedNoise);
      color = mix(color, watercolorTint, bleedStrength);

      // --- Very subtle ink speckle (aged paper spots) ---
      float speckle = snoise(st * 50.0 + slowTime * 0.5);
      float speckMask = smoothstep(0.7, 0.75, speckle) * 0.04;
      color = mix(color, uInkColor, speckMask);

      // --- Final output ---
      // Slight warmth shift
      color.r += 0.005;
      color.g += 0.002;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ PaperAtmosphereMaterial });

export { PaperAtmosphereMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      paperAtmosphereMaterial: any;
    }
  }
}
