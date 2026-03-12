import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const WoodcutShaderMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uColorBase: new THREE.Color('#18181b'), // Charcoal Ink
    uColorPaper: new THREE.Color('#f5f5f4'), // Warm Stone Paper
    uColorWater: new THREE.Color('#d1e8e2'), // Pale Map Blue
    uColorSun: new THREE.Color('#fcd34d'),  // Faded Sunset Orange
    uColorAlt: new THREE.Color('#10b981'),  // Neon Emerald
    uOpacity: 1.0,
    uMouse: new THREE.Vector2(0, 0), // Track normalized mouse coordinates
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec2 vWorldPos; // Pass world position x/y to fragment for gradient maths
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;

    float getLuminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vUv = uv;
      vec3 pos = position;

      // Sample texture in vertex shader for DISPLACEMENT
      vec4 texData = texture2D(uTexture, vUv);
      float lum = getLuminance(texData.rgb);

      // Black ink pushes slightly forward for pop-up effect, paper stays flat
      float displacement = (1.0 - lum) * 0.5; 
      
      // Base Reality: Slower, organic breathing effect
      float wind = sin(pos.x * 0.5 + uTime * 0.2) * cos(pos.y * 0.5 + uTime * 0.2) * 0.05;
      
      // Mouse interaction: Pushes the vertices away from the cursor
      float distToMouse = distance(pos.xy, uMouse * 10.0); 
      float mousePush = smoothstep(3.0, 0.0, distToMouse) * 0.5; // Gentle push
      
      // Apply Z displacement (much flatter now)
      pos.z += displacement;
      
      // Apply Mountain Man Base Motion
      pos.x += wind;
      pos.y += wind * 0.5;
      
      // Apply Mouse Push
      pos.z += mousePush * 0.1;

  vDisplacement = displacement; // Pass to fragment for color shading
  
  // Pass XY to fragment so the watercolor gradient aligns cross-screen
  vWorldPos = pos.xy;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying vec2 vWorldPos;
    varying float vDisplacement;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColorBase;
    uniform vec3 uColorPaper;
    uniform vec3 uColorWater;
    uniform vec3 uColorSun;
    uniform vec3 uColorAlt;
    uniform float uOpacity;
    uniform vec2 uMouse;

    float getLuminance(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
    }

void main() {
      // Sample Base Texture
      vec4 texColorG = texture2D(uTexture, vUv);
      
      float lum = getLuminance(texColorG.rgb);
      
      // Isolate Ink (Black) vs Paper (White)
      float inkIntensity = 1.0 - smoothstep(0.4, 0.6, lum); 
      float paperIntensity = smoothstep(0.4, 0.6, lum);
      
      // Sky Mask: Fade out the 'paper' color at the top of the image so layers can heavily overlap without box-bounds
      // If vUv.y approaches 1.0 (top), and it's paper, alpha goes to 0
      float skyGradient = smoothstep(0.6, 1.0, vUv.y); 
      float paperAlpha = 1.0 - (skyGradient * paperIntensity); 

      // --- Watercolor Injection ---
      // 1. Calculate how far this specific pixel is from the mouse cursor in World Space
      // (uMouse is ~ -1 to 1. vWorldPos depends on geometry scale, roughly -10 to 10)
      float distToMouse = distance(vWorldPos * 0.1, uMouse);
      
      // 2. Create two soft radial gradients around the mouse
      float waterRadius = smoothstep(1.5, 0.0, distToMouse); // Wide, soft Blue
      float sunRadius = smoothstep(0.5, 0.0, distToMouse);   // Tight, bright Orange core
      
      // 3. Add organic flow to the watercolor using Time and UV distortion
      float flow = sin(vUv.x * 10.0 + uTime) * cos(vUv.y * 10.0 - uTime) * 0.1;
      waterRadius += flow * waterRadius;
      
      // 4. Mix the watercolor into the base paper tint
      vec3 injectedPaperColor = mix(uColorPaper, uColorWater, waterRadius * 0.6); // 60% max blue
      injectedPaperColor = mix(injectedPaperColor, uColorSun, sunRadius * 0.8);   // 80% max orange at core
      
      // Combine Ink and injected Paper colors
      vec3 finalColor = mix(injectedPaperColor, uColorBase, inkIntensity);

      // Overall alpha for the fragment
      // We keep the ink perfectly opaque, and fade the paper out into the sky, but bound everything by the PNG's innate transparency
      float baseAlpha = texColorG.a;
      float alphaOut = max(inkIntensity, paperAlpha) * uOpacity * baseAlpha;

      if (alphaOut < 0.05) discard;

      gl_FragColor = vec4(finalColor, alphaOut);
}
`
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
