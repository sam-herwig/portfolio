/* eslint-disable */
import { Color } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * NightAtmosphereMaterial - A procedural atmospheric shader replacing the campfire video.
 * Features soft volumetric-looking fog, deep sky gradient, and warm fire light bleeding
 * from the bottom of the scene.
 */
const NightAtmosphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorBase: new Color('#020617'), // Deep slate blue (night sky)
    uColorFog: new Color('#0f172a'), // Slightly lighter misty blue
    uColorFireGlow: new Color('#ea580c'), // Embers orange
    uOpacity: 1.0,
    uFogSpeed: 0.05,
    uFogScale: 2.0,
    uFogDensity: 1.0,
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
    uniform vec3 uColorBase;
    uniform vec3 uColorFog;
    uniform vec3 uColorFireGlow;
    uniform float uOpacity;
    uniform float uFogSpeed;
    uniform float uFogScale;
    uniform float uFogDensity;

    // Hash without Sine
    float hash12(vec2 p) {
      vec3 p3  = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    // Value noise
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
        mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    // Fractal Brownian Motion
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * vnoise(p * frequency);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      // Procedural slow-moving fog / mist
      vec2 fogUv = vUv * uFogScale;
      // Domain warping for fluid look
      vec2 q = vec2(
        fbm(fogUv + vec2(0.0, uTime * uFogSpeed)),
        fbm(fogUv + vec2(5.2, 1.3 - uTime * uFogSpeed * 0.8))
      );
      float fogMask = fbm(fogUv + 4.0 * q + vec2(uTime * uFogSpeed * 0.5));
      
      // Modulate fog height by density: when density is 0, fog hugs the ground.
      // When density is 1, it fills the screen.
      float heightFalloff = smoothstep(1.0, 0.0, vUv.y);
      float effectiveDensity = mix(fogMask * heightFalloff, fogMask, clamp(uFogDensity, 0.0, 1.0));

      vec3 color = uColorFog;

      // Fire light bleeding from the bottom
      // Stronger near uv.y = 0, fading out upwards, modulated by noise for a flickering effect
      float fireBase = pow(1.0 - vUv.y, 3.0);
      float fireFlicker = vnoise(vec2(uTime * 2.0, vUv.x * 5.0)) * 0.2 + 0.8;
      
      // Fire glow spreads through the fog
      float glowSpread = smoothstep(0.2, 1.0, fogMask) * pow(1.0 - vUv.y, 1.5);
      
      vec3 fireBlend = mix(uColorFireGlow * 0.2, uColorFireGlow, fireFlicker);
      
      // Combine fire light
      color = mix(color, fireBlend, fireBase * 0.5 + glowSpread * 0.7);

      // Very subtle grain to tie it together
      float grain = (hash12(vUv * 500.0) - 0.5) * 0.03;
      color += grain;

      // Calculate alpha so that non-foggy areas are transparent, allowing SumiSky to show through
      float alpha = clamp(effectiveDensity * 1.5 + (fireBase * 0.5 + glowSpread * 0.7), 0.0, 1.0);

      gl_FragColor = vec4(color, alpha * uOpacity);
    }
  `,
);

extend({ NightAtmosphereMaterial });

export { NightAtmosphereMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      nightAtmosphereMaterial: any;
    }
  }
}
