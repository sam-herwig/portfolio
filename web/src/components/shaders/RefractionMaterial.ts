/* eslint-disable */
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const RefractionShaderMaterial = shaderMaterial(
    {
        uTexture: null,
        uRefraction: 0.05,
        uTime: 0,
        uWinSize: new THREE.Vector2(1920, 1080),
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform sampler2D uTexture;
    uniform float uRefraction;
    uniform vec2 uWinSize;
    uniform float uTime;
    
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // Calculate normalized screen coordinates based on gl_FragCoord and window resolution
      vec2 screenUv = gl_FragCoord.xy / uWinSize;
      
      // Use the normal of the text mesh to deform the screen background UVs
      vec2 distortedUv = screenUv + (vNormal.xy * uRefraction);
      
      vec4 refractedBg = texture2D(uTexture, distortedUv);
      
      // Add a slight specular glint or frosted rim to define the edges of the text
      float fresnel = pow(1.0 - dot(vec3(0.0, 0.0, 1.0), vNormal), 3.0);
      vec3 finalColor = mix(refractedBg.rgb, vec3(1.0), fresnel * 0.3);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
    `
);

extend({ RefractionShaderMaterial });

export { RefractionShaderMaterial };

declare global {
    namespace JSX {
        interface IntrinsicElements {
            refractionShaderMaterial: any;
        }
    }
}
