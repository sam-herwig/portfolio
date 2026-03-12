import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// A custom shader material for our high-tech particle system
const ParticleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uAlternateReality: 0, // Used for cross-fading the opacity
    uColorPoints: new THREE.Color('#10b981'), // Neon Emerald
    uPixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uPixelRatio;

    // We will pass an extra attribute for randomization per-particle
    attribute float aScale;
    attribute vec3 aRandomPos;

    // Pass color intensity to fragment
    varying float vDistanceToCenter;

void main() {
      // Base position is a scattered sphere/field
      vec3 pos = position;

      // 1. Orbital Physics
      // Particles slowly orbit around the center based on their random seed
      float angle = uTime * (0.1 + aScale * 0.2);
      float s = sin(angle);
      float c = cos(angle);

      // Apply rotation around Y and Z axis
      mat3 rotMat = mat3(
  c, 0.0, s,
  0.0, 1.0, 0.0,
  -s, 0.0, c
);
  pos = rotMat * pos;

  // Add some chaotic sine wave motion
  pos.y += sin(uTime * aScale * 2.0 + pos.x) * 0.5;

      // 2. Mouse Interaction (Magnetic Repulsion)
      // Project mouse into a rough World Space coordinate
      vec3 mouseWorld = vec3(uMouse.x * 15.0, uMouse.y * 15.0, 0.0);
      float distToMouse = distance(pos, mouseWorld);

      // If the mouse gets close, aggressively push the particles away
      float repulsion = smoothstep(5.0, 0.0, distToMouse);
      vec3 pushDir = normalize(pos - mouseWorld);
  pos += pushDir * repulsion * 4.0;

      // 3. Size and Scale setup
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuates based on distance to camera (standard point rendering)
  gl_PointSize = (15.0 * aScale * uPixelRatio) * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;

  // Pass distance to center for radial coloration
  vDistanceToCenter = length(pos) / 10.0;
}
`,
  // Fragment Shader
  `
    uniform vec3 uColorPoints;
    uniform float uAlternateReality;
    
    varying float vDistanceToCenter;

void main() {
      // 1. Draw a soft circular particle (discarding corners of the square gl_Point)
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  if (distanceToCenter > 0.5) discard;

      // 2. Soft glow falloff
      float alpha = 1.0 - smoothstep(0.1, 0.5, distanceToCenter);

  // 3. Fade edges of the particle field to black
  alpha *= 1.0 - smoothstep(0.5, 1.0, vDistanceToCenter);

  // 4. Fade entire system in/out based on the Reality Toggle state
  // (uAlternateReality goes from 0.0 to 1.0)
  alpha *= uAlternateReality;

  gl_FragColor = vec4(uColorPoints, alpha);
}
`
);

extend({ ParticleShaderMaterial });

export { ParticleShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      particleShaderMaterial: any;
    }
  }
}
