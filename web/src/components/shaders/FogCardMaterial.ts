/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Volumetric Fog Card Material with Soft Particles
 * Uses a depth buffer to fade out intersections and animated noise for billowing volume.
 */
const FogCardShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new Color('#7a8696'),
    uOpacity: 1.0,
    uResolution: [1, 1],
    uDepthBuffer: null,
    uCameraNear: 0.1,
    uCameraFar: 1000,
    uSoftness: 1.5,
    uNoiseScale: 0.5,
    uNoiseSpeed: 0.2,
  },
  // ── Vertex ─────────────────────────────────────────────────────────────
  `
    varying vec2 vUv;
    varying vec4 vScreenPos;
    
    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      // Compute screen position for depth buffer sampling
      vScreenPos = gl_Position;
    }
  `,
  // ── Fragment ───────────────────────────────────────────────────────────
  `
    precision highp float;
    
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform sampler2D uDepthBuffer;
    uniform vec2 uResolution;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform float uSoftness;
    uniform float uNoiseScale;
    uniform float uNoiseSpeed;

    varying vec2 vUv;
    varying vec4 vScreenPos;

    #include <packing>

    // 2D Random
    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation
        vec2 u = f*f*(3.0-2.0*f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    // FBM
    float fbm (in vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 0.0;
        for (int i = 0; i < 3; i++) {
            value += amplitude * noise(st);
            st *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    float getViewZ(const in float depth) {
        return perspectiveDepthToViewZ(depth, uCameraNear, uCameraFar);
    }

    void main() {
      // 1. Billowing Noise Alpha
      vec2 noiseUv = vUv * uNoiseScale;
      // Move UVs slowly to simulate billowing
      noiseUv.y -= uTime * uNoiseSpeed;
      noiseUv.x += sin(uTime * 0.1) * 0.1;
      
      // Calculate FBM for soft, clumpy fog
      float fogMask = fbm(noiseUv);
      
      // Soften the edges of the quad
      float edgeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
      float edgeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      float edgeMask = edgeX * edgeY;

      // Combine masks
      float finalAlpha = fogMask * edgeMask * uOpacity;

      // 2. Soft Particle Depth Test
      // Normalize screen coordinates
      vec2 screenUv = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
      
      // Read depth from the depth buffer
      float fragCoordZ = texture2D(uDepthBuffer, screenUv).x;
      
      // Convert depth values to ViewZ
      float sceneZ = getViewZ(fragCoordZ);
      float particleZ = getViewZ(gl_FragCoord.z);
      
      // Calculate depth difference and apply softness
      float depthFade = clamp((particleZ - sceneZ) / uSoftness, 0.0, 1.0);
      
      // Final color and alpha
      gl_FragColor = vec4(uColor, finalAlpha * depthFade);
    }
  `,
);

extend({ FogCardShaderMaterial });

export { FogCardShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fogCardShaderMaterial: any;
    }
  }
}
