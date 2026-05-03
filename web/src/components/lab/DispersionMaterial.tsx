'use client';

import { type IUniform, MeshPhysicalMaterial, Texture, Vector2 } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';

const vertexShader = /* glsl */ `
  varying vec3 vDispWorldPos;
  varying vec3 vDispWorldNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDispWorldPos = worldPos.xyz;
    vDispWorldNormal = normalize(mat3(modelMatrix) * normal);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform float uIorR;
  uniform float uIorG;
  uniform float uIorB;
  uniform float uRefractPower;
  uniform float uFresnelPower;
  uniform float uSaturation;

  varying vec3 vDispWorldPos;
  varying vec3 vDispWorldNormal;

  vec3 sat(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec3 normal = normalize(vDispWorldNormal);
    vec3 viewDir = normalize(vDispWorldPos - cameraPosition);

    vec3 rR = refract(viewDir, normal, 1.0 / uIorR);
    vec3 rG = refract(viewDir, normal, 1.0 / uIorG);
    vec3 rB = refract(viewDir, normal, 1.0 / uIorB);

    vec3 col;
    col.r = texture2D(uScene, uv + rR.xy * uRefractPower).r;
    col.g = texture2D(uScene, uv + rG.xy * uRefractPower).g;
    col.b = texture2D(uScene, uv + rB.xy * uRefractPower).b;
    col = sat(col, uSaturation);

    float NdotV = max(dot(normal, -viewDir), 0.0);
    float fresnel = pow(1.0 - NdotV, uFresnelPower);

    vec3 finalColor = mix(col, vec3(1.0), fresnel * 0.25);
    csm_FragColor = vec4(finalColor, 1.0);
  }
`;

export interface DispersionUniforms {
  uScene: { value: Texture | null };
  uResolution: { value: Vector2 };
  uIorR: { value: number };
  uIorG: { value: number };
  uIorB: { value: number };
  uRefractPower: { value: number };
  uFresnelPower: { value: number };
  uSaturation: { value: number };
}

export function makeDispersionUniforms(): DispersionUniforms {
  return {
    uScene: { value: null },
    uResolution: { value: new Vector2() },
    uIorR: { value: 1.15 },
    uIorG: { value: 1.18 },
    uIorB: { value: 1.22 },
    uRefractPower: { value: 0.4 },
    uFresnelPower: { value: 4.0 },
    uSaturation: { value: 1.1 },
  };
}

interface Props {
  uniforms: DispersionUniforms;
}

export default function DispersionMaterial({ uniforms }: Props) {
  return (
    <CustomShaderMaterial
      baseMaterial={MeshPhysicalMaterial}
      uniforms={uniforms as unknown as Record<string, IUniform<unknown>>}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      metalness={0.0}
      roughness={0.0}
    />
  );
}
