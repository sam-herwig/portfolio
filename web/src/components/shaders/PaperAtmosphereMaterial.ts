/* eslint-disable */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const PaperAtmosphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uPaperColor: new THREE.Color('#f9fafb'), // Background token — paper
    uInkColor: new THREE.Color('#18181b'), // Foreground token — ink
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
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
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
      vec2 i1 = vec2(step(x0.y, x0.x), step(x0.x, x0.y));
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
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 st = vec2(uv.x * aspect, uv.y);

      float slowTime = uTime * 0.05;

      // --- Paper fiber texture (time-driven only, no velocity coupling) ---
      float fiber = fbm(st * 12.0 + slowTime * 0.3);
      float paperGrain = 0.03 + fiber * 0.02;

      // --- Base paper color with grain ---
      vec3 color = uPaperColor;
      color -= paperGrain;
      color = max(color, vec3(0.0));

      // --- Very subtle ink speckle (aged paper spots) ---
      float speckle = fract(sin(dot(st * 50.0 + slowTime * 0.5, vec2(12.9898, 78.233))) * 43758.5453);
      float speckMask = smoothstep(0.7, 0.75, speckle) * 0.04;
      color = mix(color, uInkColor, speckMask);

      color = clamp(color, 0.0, 1.0);

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
