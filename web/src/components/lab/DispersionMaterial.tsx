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
  uniform float uMode;

  varying vec3 vDispWorldPos;
  varying vec3 vDispWorldNormal;

  vec3 sat(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
  }

  // 3-channel per-channel IOR refraction (commit 3 baseline)
  vec3 dispersion3(vec2 uv, vec3 viewDir, vec3 normal) {
    vec3 rR = refract(viewDir, normal, 1.0 / uIorR);
    vec3 rG = refract(viewDir, normal, 1.0 / uIorG);
    vec3 rB = refract(viewDir, normal, 1.0 / uIorB);

    vec3 col;
    col.r = texture2D(uScene, uv + rR.xy * uRefractPower).r;
    col.g = texture2D(uScene, uv + rG.xy * uRefractPower).g;
    col.b = texture2D(uScene, uv + rB.xy * uRefractPower).b;
    return col;
  }

  // 6-channel rygcbv spectral split (Petrick → Heckel)
  // Six wavelengths sampled across the visible spectrum, recombined via
  // hue-tinted weights (R / Y / G / C / B / V).
  vec3 dispersion6(vec2 uv, vec3 viewDir, vec3 normal) {
    float ior0 = uIorR;
    float ior1 = mix(uIorR, uIorB, 0.2);
    float ior2 = mix(uIorR, uIorB, 0.4);
    float ior3 = mix(uIorR, uIorB, 0.6);
    float ior4 = mix(uIorR, uIorB, 0.8);
    float ior5 = uIorB;

    vec3 d0 = refract(viewDir, normal, 1.0 / ior0);
    vec3 d1 = refract(viewDir, normal, 1.0 / ior1);
    vec3 d2 = refract(viewDir, normal, 1.0 / ior2);
    vec3 d3 = refract(viewDir, normal, 1.0 / ior3);
    vec3 d4 = refract(viewDir, normal, 1.0 / ior4);
    vec3 d5 = refract(viewDir, normal, 1.0 / ior5);

    vec3 s0 = texture2D(uScene, uv + d0.xy * uRefractPower).rgb;
    vec3 s1 = texture2D(uScene, uv + d1.xy * uRefractPower).rgb;
    vec3 s2 = texture2D(uScene, uv + d2.xy * uRefractPower).rgb;
    vec3 s3 = texture2D(uScene, uv + d3.xy * uRefractPower).rgb;
    vec3 s4 = texture2D(uScene, uv + d4.xy * uRefractPower).rgb;
    vec3 s5 = texture2D(uScene, uv + d5.xy * uRefractPower).rgb;

    vec3 w0 = vec3(1.00, 0.00, 0.00); // R 700nm
    vec3 w1 = vec3(1.00, 1.00, 0.00); // Y 580nm
    vec3 w2 = vec3(0.00, 1.00, 0.00); // G 540nm
    vec3 w3 = vec3(0.00, 1.00, 1.00); // C 480nm
    vec3 w4 = vec3(0.00, 0.00, 1.00); // B 460nm
    vec3 w5 = vec3(0.50, 0.00, 1.00); // V 410nm

    vec3 totalW = w0 + w1 + w2 + w3 + w4 + w5;
    return (s0 * w0 + s1 * w1 + s2 * w2 + s3 * w3 + s4 * w4 + s5 * w5) / totalW;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec3 normal = normalize(vDispWorldNormal);
    vec3 viewDir = normalize(vDispWorldPos - cameraPosition);

    vec3 col = uMode > 0.5
      ? dispersion6(uv, viewDir, normal)
      : dispersion3(uv, viewDir, normal);
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
  uMode: { value: number };
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
    uMode: { value: 1 },
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
