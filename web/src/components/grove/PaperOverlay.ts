import { Effect } from 'postprocessing';
import { Color, Uniform } from 'three';

/**
 * PaperOverlay — full-screen watercolor paper pass.
 *
 * Runs after the whole scene composes, so every pixel — sky, mountain, mist,
 * water — gets the same paper tooth. Four layered effects in one pass:
 *
 *  1. Paper tooth: multiplicative fbm around 1.0 — pigment settles into the
 *     fiber valleys, lifts along the peaks.
 *  2. Fine grain: additive high-frequency noise for tactile surface.
 *  3. Warm paper tint: pulls the cool digital composite toward warm ivory.
 *     Prevents the scene reading as "desaturated photo."
 *  4. Vignette: soft edge darkening mimicking fiber density falloff.
 *
 * All magnitudes are uniforms so Leva can tune in real time.
 */

const fragmentShader = /* glsl */ `
  uniform float uToothAmp;
  uniform float uToothScale;
  uniform float uGrainAmount;
  uniform float uGrainScale;
  uniform float uWarmAmount;
  uniform vec3  uWarmTint;
  uniform float uVignetteStrength;
  uniform float uVignetteInner;
  uniform float uVignetteOuter;

  float _hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float _vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = _hash21(i);
    float b = _hash21(i + vec2(1.0, 0.0));
    float c = _hash21(i + vec2(0.0, 1.0));
    float d = _hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float _fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * _vnoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float toothField = _fbm(uv * uToothScale);
    float tooth = (1.0 - uToothAmp) + uToothAmp * toothField * 2.0;

    float fine = _fbm(uv * uGrainScale) - 0.5;

    vec3 col = inputColor.rgb * tooth;
    col += vec3(fine) * uGrainAmount;

    vec3 warm = col * uWarmTint;
    col = mix(col, warm, uWarmAmount);

    float dist = length(uv - 0.5);
    float vig = smoothstep(uVignetteOuter, uVignetteInner, dist);
    col *= mix(1.0 - uVignetteStrength, 1.0, vig);

    outputColor = vec4(col, inputColor.a);
  }
`;

export class PaperOverlayEffect extends Effect {
  constructor() {
    super('PaperOverlayEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['uToothAmp', new Uniform(0.05)],
        ['uToothScale', new Uniform(600)],
        ['uGrainAmount', new Uniform(0.018)],
        ['uGrainScale', new Uniform(2400)],
        ['uWarmAmount', new Uniform(0.28)],
        ['uWarmTint', new Uniform(new Color(1.03, 1.008, 0.975))],
        ['uVignetteStrength', new Uniform(0.15)],
        ['uVignetteInner', new Uniform(0.4)],
        ['uVignetteOuter', new Uniform(1.05)],
      ]),
    });
  }

  set(name: string, value: number | Color) {
    const u = this.uniforms.get(name);
    if (u) u.value = value;
  }
}
