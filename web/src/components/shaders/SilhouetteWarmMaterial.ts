/* eslint-disable */
import { Color, Vector3, type Texture } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Silhouette warm-tint material — samples a woodblock silhouette texture and
 * adds a whisper of amber light on the fire-facing side of the shape.
 *
 * The tint is keyed on the fragment's world-space distance to a fire anchor,
 * not view-space, so parallax layers at different depths all pick up a
 * consistent "look at the fire" wash.
 */
const SilhouetteWarmShaderMaterial = shaderMaterial(
  {
    uTexture: null as Texture | null,
    uFireAnchor: new Vector3(0, -2, -10),
    uWarmColor: new Color('#f6c400'),
    uCoolShadow: new Color('#1f2937'),
    uInfluenceRadius: 28.0, // world units — how far warm light reaches
    uFirePulse: 0.0, // 0..1 shared with FireHaloMaterial
    uWarmStrength: 0.35,
    uOpacity: 1.0,
  },
  // ── Vertex ─────────────────────────────────────────────────────────────
  `
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // ── Fragment ───────────────────────────────────────────────────────────
  `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    uniform sampler2D uTexture;
    uniform vec3 uFireAnchor;
    uniform vec3 uWarmColor;
    uniform vec3 uCoolShadow;
    uniform float uInfluenceRadius;
    uniform float uFirePulse;
    uniform float uWarmStrength;
    uniform float uOpacity;

    void main() {
      vec4 texColor = texture2D(uTexture, vUv);

      // Hard-edged cutout — assets were exported with alpha-keyed background.
      if (texColor.a < 0.5) discard;

      // Fire-facing falloff. Distance in world-space XY (Z collapsed) so the
      // wash tracks the camera-view-plane approximation of "how close am I
      // to the fire on screen".
      vec2 delta = vWorldPos.xy - uFireAnchor.xy;
      float d = length(delta);
      float warmMask = 1.0 - smoothstep(0.0, uInfluenceRadius, d);
      warmMask *= (0.8 + clamp(uFirePulse, 0.0, 1.0) * 0.4);

      // Cool the shadow side slightly; warm the fire side.
      vec3 base = texColor.rgb;
      vec3 cooled = mix(base, uCoolShadow, 0.15 * (1.0 - warmMask));
      vec3 warmed = mix(cooled, uWarmColor, warmMask * uWarmStrength);

      gl_FragColor = vec4(warmed, texColor.a * uOpacity);
    }
  `,
);

extend({ SilhouetteWarmShaderMaterial });

export { SilhouetteWarmShaderMaterial };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      silhouetteWarmShaderMaterial: any;
    }
  }
}
