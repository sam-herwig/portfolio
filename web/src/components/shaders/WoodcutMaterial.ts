/* eslint-disable */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const WoodcutShaderMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uColorBase: new THREE.Color('#18181b'), // Foreground token — ink
    uColorPaper: new THREE.Color('#f9fafb'), // Background token — paper (used as fill for transparent areas if needed)
    uOpacity: 1.0,
    uPaperOpacity: 1.0, // 1.0 = fill transparent areas with uColorPaper, 0.0 = leave transparent
    uWind: 0.0, // Global synchronized continuous wind
    uMouse: new THREE.Vector2(0, 0), // Normalized cursor (-1..1)

    // Ink Bleed Leva Controls
    uRadius: 0.2,
    uStrength: 0.05,
    uNoiseScale: 50.0,
    uSpeed: 0.5,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec2 vWorldPos;
    varying vec2 vScreenPos;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uWind;
    uniform vec2 uMouse;

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Passthrough for fragment varyings
      vDisplacement = 0.0;
      vWorldPos = pos.xy;

      vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      
      // Calculate normalized device coordinates (-1 to 1) for the fragment
      vScreenPos = clipPos.xy / clipPos.w;
      
      gl_Position = clipPos;
    }
  `,
  // Fragment Shader
  `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vWorldPos;
    varying vec2 vScreenPos;
    varying float vDisplacement;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColorBase;
    uniform vec3 uColorPaper;
    uniform float uOpacity;
    uniform float uPaperOpacity;
    uniform vec2 uMouse;
    
    uniform float uRadius;
    uniform float uStrength;
    uniform float uNoiseScale;
    uniform float uSpeed;

    // Classic 2D noise for organic bleed
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // Value Noise
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    void main() {
      // 1. Calculate Cursor Proximity using Screen Coordinates
      // Both vScreenPos and uMouse are in NDC (-1 to 1).
      // If window aspect ratio is not 1:1, distance will be an oval, but it's fine for this effect.
      // To make it circular, we would need to pass aspect ratio, but we'll stick to basic distance for now.
      float distToMouse = distance(vScreenPos, uMouse);
      
      // The "Wetness" radius — 1.0 at center of cursor, 0.0 at edge
      // Scale radius by 2 because screen space is -1 to 1 (width 2)
      float wetRadius = 1.0 - smoothstep(0.0, uRadius * 2.0, distToMouse);

      // 2. Generate Organic Noise for the Bleed Pattern
      float timeFlow = uTime * uSpeed;
      float noiseVal = noise(vUv * uNoiseScale + timeFlow); // High frequency fiber noise
      float macroNoise = noise(vUv * (uNoiseScale * 0.1) - timeFlow * 0.5); // Low freq for clustering

      // Combine noises to create a chaotic bleed map
      float bleedMap = (noiseVal * 0.7 + macroNoise * 0.3);
      
      // 3. Distort UVs based on the Bleed Map and Wetness
      vec2 distortedUv = vUv;
      
      if (wetRadius > 0.01 && uStrength > 0.0) {
        // Create an outward push vector based on noise
        vec2 pushDir = vec2(
          noise(vUv * 10.0 + uTime) - 0.5,
          noise(vUv * 10.0 - uTime + 100.0) - 0.5
        );
        
        distortedUv += pushDir * bleedMap * wetRadius * uStrength;
      }

      // 4. Sample Texture with Distorted UVs
      vec4 texColor = texture2D(uTexture, distortedUv);
      float inkIntensity = texColor.a;

      // 5. Soften/Blur the edges where wet
      if (wetRadius > 0.01 && uStrength > 0.0) {
         // Soften the alpha contrast based on wetness
         inkIntensity *= smoothstep(0.0, 0.5 + (uStrength * 5.0), inkIntensity + (bleedMap * wetRadius * 0.5));
      }

      // 6. Combine Ink and Paper
      vec3 finalColor = mix(uColorPaper, uColorBase, inkIntensity);
      
      float finalAlpha = mix(inkIntensity, 1.0, uPaperOpacity) * uOpacity;

      if (finalAlpha < 0.05) discard;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `,
);

extend({ WoodcutShaderMaterial });

export { WoodcutShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      woodcutShaderMaterial: any;
    }
  }
}
