/* eslint-disable */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const WoodcutShaderMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uColorBase: new THREE.Color('#18181b'), // Foreground token — ink
    uColorPaper: new THREE.Color('#f9fafb'), // Background token — paper
    uColorWater: new THREE.Color('#d1e8e2'), // Pale map blue — watercolor bleed
    uColorSun: new THREE.Color('#fcd34d'), // Faded sunset orange — cursor hotspot
    uOpacity: 1.0,
    uPaperOpacity: 1.0, // 1.0 = opaque paper (hero), 0.0 = transparent paper (sprites)
    uWind: 0.0, // Global synchronized continuous wind
    uMouse: new THREE.Vector2(0, 0), // Normalized cursor (-1..1)
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec2 vWorldPos;
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

      /* ── VERTEX EFFECTS DISABLED — uncomment block to re-enable ─────────
         Kept verbatim so A/B toggling is a single uncomment. When re-enabling,
         also set pos.z += displacement, pos.x += wind, pos.y += wind * 0.2,
         pos.x += pushDir.x * mousePush, pos.z -= mousePush * 0.5 below.

      // Luminance-based Z pop — ink surges forward, paper stays flat
      vec4 texData = texture2D(uTexture, vUv);
      float lum = getLuminance(texData.rgb);
      float displacement = (1.0 - lum) * 0.5;

      // Time-driven wind sway — top rows sway more via vUv.y weight
      float swayBlend = vUv.y;
      float wind = sin(pos.x * 0.2 + uWind * 1.5) * 0.2 * swayBlend;

      // Mouse repulsion: pushes vertices away from the cursor
      vec2 worldMouse = uMouse * 50.0;
      float distToMouse = distance(pos.xy, worldMouse);
      float mousePush = smoothstep(20.0, 0.0, distToMouse) * 3.0 * swayBlend;
      vec2 pushDir = normalize(pos.xy - worldMouse);

      pos.z += displacement;
      pos.x += wind;
      pos.y += wind * 0.2;
      pos.x += pushDir.x * mousePush;
      pos.z -= mousePush * 0.5;
      ── END DISABLED BLOCK ───────────────────────────────────────────── */

      // Passthrough for fragment varyings (watercolor still reads vWorldPos)
      vDisplacement = 0.0;
      vWorldPos = pos.xy;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vWorldPos;
    varying float vDisplacement;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColorBase;
    uniform vec3 uColorPaper;
    uniform vec3 uColorWater;
    uniform vec3 uColorSun;
    uniform float uOpacity;
    uniform float uPaperOpacity;
    uniform vec2 uMouse;

    float getLuminance(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec4 texColorG = texture2D(uTexture, vUv);
      float lum = getLuminance(texColorG.rgb);

      // Isolate Ink (Black) vs Paper (White)
      float inkIntensity = 1.0 - smoothstep(0.4, 0.6, lum);
      float paperIntensity = smoothstep(0.4, 0.6, lum);

      // Sky Mask: fade paper color at top of plane for overlap-friendly layers
      float skyGradient = smoothstep(0.6, 1.0, vUv.y);
      float paperAlpha = 1.0 - (skyGradient * paperIntensity);

      // Watercolor Injection — cursor-following radial washes
      float distToMouse = distance(vWorldPos * 0.1, uMouse);
      float waterRadius = smoothstep(1.5, 0.0, distToMouse); // wide soft blue
      float sunRadius = smoothstep(0.5, 0.0, distToMouse); // tight bright orange core

      // Organic flow distortion via time
      float flow = sin(vUv.x * 10.0 + uTime) * cos(vUv.y * 10.0 - uTime) * 0.1;
      waterRadius += flow * waterRadius;

      // Mix the watercolor into the base paper tint
      vec3 injectedPaperColor = mix(uColorPaper, uColorWater, waterRadius * 0.6);
      injectedPaperColor = mix(injectedPaperColor, uColorSun, sunRadius * 0.8);

      // Combine ink and injected paper
      vec3 finalColor = mix(injectedPaperColor, uColorBase, inkIntensity);

      float baseAlpha = texColorG.a;
      float adjustedPaperAlpha = paperAlpha * uPaperOpacity;
      float alphaOut = max(inkIntensity, adjustedPaperAlpha) * uOpacity * baseAlpha;

      if (alphaOut < 0.05) discard;

      gl_FragColor = vec4(finalColor, alphaOut);
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
