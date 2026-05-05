'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useEffect, useMemo, useRef } from 'react';
import { DataTexture, LinearFilter, LinearSRGBColorSpace, RGBAFormat, TextureLoader, type Texture } from 'three';
import { getFeaturedProjects } from '@/data/projects';
import { MODULE_WINDOWS } from '@/lib/moduleTimeline';
import {
  ABOUT_PRESET_NAMES,
  ABOUT_PRESETS,
  COMBO_PRESET_NAMES,
  COMBO_PRESETS,
  CONTACT_PRESET_NAMES,
  CONTACT_PRESETS,
  HERO_PRESET_NAMES,
  HERO_PRESETS,
  WORK_PRESET_NAMES,
  WORK_PRESETS,
} from './backgroundPresets';

const WORK_THUMBNAILS = getFeaturedProjects()
  .slice(0, 4)
  .map((p) => p.thumbnail);

const placeholderTex = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat);
placeholderTex.needsUpdate = true;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    // Derive UV from NDC position rather than the geometry's uv attribute —
    // drei's ScreenQuad uses an itemSize=2 BufferAttribute that doesn't
    // always wire through to a custom <shaderMaterial>'s default uv binding.
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uResolution;

  // Module exit windows from MODULE_WINDOWS — single source of truth.
  uniform vec2 uHeroExit;
  uniform vec2 uAboutExit;
  uniform vec2 uWorkExit;

  // Hero — Dancing Fluid Ring (B&W)
  // Scroll arc: idle (s=0) → peak (s=uHeroExit.x) → exit (s=uHeroExit.y)
  uniform float uHeroRingThickness;
  uniform float uHeroWarpScale;
  uniform float uHeroWarpSpeed;
  uniform float uHeroWarpIdle;
  uniform float uHeroWarpPeak;
  uniform float uHeroWarpExit;
  uniform float uHeroRadiusIdle;
  uniform float uHeroRadiusPeak;
  uniform float uHeroRadiusExit;

  // About — Animated Line Grid (B&W)
  // Scroll arc: idle (s=0.16) → peak (s=uAboutExit.x) → exit (s=uAboutExit.y)
  // Pattern: 0=Plus (H+V), 1=X (diagonal), 2=Asterisk (Plus+X), 3=Triangle (3 axes)
  uniform int uAboutPattern;
  uniform float uAboutLineWidth;
  uniform float uAboutWaveFreq;
  uniform float uAboutWaveSpeed;
  uniform float uAboutGridIdle;
  uniform float uAboutGridPeak;
  uniform float uAboutGridExit;
  uniform float uAboutWaveIdle;
  uniform float uAboutWavePeak;
  uniform float uAboutWaveExit;

  // Work — Bayer-Dithered Project Reel (B&W)
  // Crossfades the four featured project thumbnails as you scroll the work
  // window (s=0.4 → s=0.8). Per-image aspect ratio drives cover-fit UV.
  uniform sampler2D uWorkTex0;
  uniform sampler2D uWorkTex1;
  uniform sampler2D uWorkTex2;
  uniform sampler2D uWorkTex3;
  uniform float uWorkAR0;
  uniform float uWorkAR1;
  uniform float uWorkAR2;
  uniform float uWorkAR3;
  uniform float uWorkDitherIdle;    // dither pixel scale at scroll-start
  uniform float uWorkDitherPeak;    // dither pixel scale mid-window (sharpest)
  uniform float uWorkDitherExit;    // dither pixel scale at scroll-end
  uniform float uWorkDitherBias;    // shifts the threshold (lighter / darker)
  uniform float uWorkContrast;      // luminance multiplier before threshold

  // Contact — Two Lattices Aligning (B&W)
  // Two stripe fields counter-rotate about a slow global precession; the
  // angular offset between them is scroll-driven (idle → peak → exit) so
  // moiré chaos at scene entry resolves into a single clean grid by scroll-end.
  uniform float uContactStripeScale;
  uniform float uContactLineWidth;
  uniform float uContactRotSpeed;
  uniform float uContactOffsetIdle;
  uniform float uContactOffsetPeak;
  uniform float uContactOffsetExit;

  uniform float uVignette;
  uniform int uDebugMode;

  float vHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = vHash(i);
    float b = vHash(i + vec2(1.0, 0.0));
    float c = vHash(i + vec2(0.0, 1.0));
    float d = vHash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // 4-octave FBM. Sampling on a unit-circle parameterization keeps the field
  // periodic around the ring (no seam at ±π).
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vNoise(p);
      p *= 2.05;
      a *= 0.55;
    }
    return v;
  }

  // Linear ramp matching sceneOpacity in moduleTimeline.ts so HTML overlays and
  // shader weights stay in lockstep across crossfades.
  float linstep(float a, float b, float x) {
    return clamp((x - a) / max(b - a, 1e-6), 0.0, 1.0);
  }

  // Hero — Dancing Fluid Ring: domain-warped polar annulus, pure greyscale.
  // Scroll splits the hero window into two acts: emerge (0 → exit.x) and
  // release (exit.x → exit.y). Both warp amplitude and radius travel
  // idle → peak → exit along that path, smoothstep-eased.
  vec3 modeHero(vec2 p, float t) {
    float r = length(p);
    vec2 n = r > 1e-4 ? p / r : vec2(1.0, 0.0);

    float t1 = smoothstep(0.0, uHeroExit.x, uScroll);
    float t2 = smoothstep(uHeroExit.x, uHeroExit.y, uScroll);
    float warpAmount = mix(mix(uHeroWarpIdle, uHeroWarpPeak, t1), uHeroWarpExit, t2);
    float ringRadius = mix(mix(uHeroRadiusIdle, uHeroRadiusPeak, t1), uHeroRadiusExit, t2);

    // Two warp samples at different scales/phases for fluid asymmetry.
    vec2 warpCoord = n * uHeroWarpScale + vec2(t * uHeroWarpSpeed, t * uHeroWarpSpeed * 0.37);
    float warpA = fbm(warpCoord) - 0.5;
    float warpB = fbm(n * uHeroWarpScale * 1.7 - vec2(t * uHeroWarpSpeed * 0.6, 0.0)) - 0.5;
    float warp = (warpA + warpB * 0.6) * warpAmount;

    float radius = ringRadius + warp;
    float d = abs(r - radius) - uHeroRingThickness;
    float fw = max(fwidth(d) * 1.2, 0.001);
    float ring = 1.0 - smoothstep(0.0, fw, d);

    return vec3(ring);
  }

  // Anti-aliased line at integer offsets along a 1D coord (cell space).
  float gridLine(float coord, float halfW, float fw) {
    float dist = 0.5 - abs(fract(coord) - 0.5);
    return 1.0 - smoothstep(halfW, halfW + fw, dist);
  }

  // About — Animated Line Grid: orthogonal grid whose lines wave slowly along
  // their orthogonal axis. Scroll drives grid density + wave amplitude along
  // an idle → peak → exit arc spanning About's full visibility window.
  vec3 modeAbout(vec2 p, float t) {
    float t1 = smoothstep(0.16, uAboutExit.x, uScroll);
    float t2 = smoothstep(uAboutExit.x, uAboutExit.y, uScroll);
    float gridScale = mix(mix(uAboutGridIdle, uAboutGridPeak, t1), uAboutGridExit, t2);
    float waveAmp   = mix(mix(uAboutWaveIdle, uAboutWavePeak, t1), uAboutWaveExit, t2);

    vec2 q = p * gridScale;

    // Two cross-coupled traveling waves displace the grid coordinates, so
    // lines wave along their orthogonal axis — slow breathing mesh.
    vec2 warp = vec2(
      sin(q.y * uAboutWaveFreq + t * uAboutWaveSpeed) * waveAmp,
      cos(q.x * uAboutWaveFreq * 1.1 + t * uAboutWaveSpeed * 0.83) * waveAmp
    );
    vec2 qw = q + warp;

    float halfW = uAboutLineWidth * 0.5;
    float fw = max(max(fwidth(qw.x), fwidth(qw.y)), 0.001);

    float grid = 0.0;
    if (uAboutPattern == 0) {
      // Plus — orthogonal H + V
      grid = max(gridLine(qw.x, halfW, fw), gridLine(qw.y, halfW, fw));
    } else if (uAboutPattern == 1) {
      // X — 45°-rotated lattice (diagonal cross intersections)
      vec2 rot = vec2(qw.x + qw.y, qw.x - qw.y) * 0.7071;
      grid = max(gridLine(rot.x, halfW, fw), gridLine(rot.y, halfW, fw));
    } else if (uAboutPattern == 2) {
      // Asterisk — Plus + X (eight-pointed)
      vec2 rot = vec2(qw.x + qw.y, qw.x - qw.y) * 0.7071;
      float plus = max(gridLine(qw.x, halfW, fw), gridLine(qw.y, halfW, fw));
      float ex   = max(gridLine(rot.x, halfW, fw), gridLine(rot.y, halfW, fw));
      grid = max(plus, ex);
    } else {
      // Triangle — three line directions at 0°, 60°, 120°
      mat2 r60  = mat2( 0.5, 0.86602540, -0.86602540,  0.5);
      mat2 r120 = mat2(-0.5, 0.86602540, -0.86602540, -0.5);
      float l1 = gridLine(qw.y,            halfW, fw);
      float l2 = gridLine((r60  * qw).y,   halfW, fw);
      float l3 = gridLine((r120 * qw).y,   halfW, fw);
      grid = max(max(l1, l2), l3);
    }

    return vec3(grid);
  }

  // 4x4 ordered Bayer threshold matrix, [0..15] / 16 → [0..1).
  float bayer4(vec2 fragCoord) {
    int x = int(mod(fragCoord.x, 4.0));
    int y = int(mod(fragCoord.y, 4.0));
    int idx = y * 4 + x;
    float v = 0.0;
    if (idx == 0)       v =  0.0;
    else if (idx == 1)  v =  8.0;
    else if (idx == 2)  v =  2.0;
    else if (idx == 3)  v = 10.0;
    else if (idx == 4)  v = 12.0;
    else if (idx == 5)  v =  4.0;
    else if (idx == 6)  v = 14.0;
    else if (idx == 7)  v =  6.0;
    else if (idx == 8)  v =  3.0;
    else if (idx == 9)  v = 11.0;
    else if (idx == 10) v =  1.0;
    else if (idx == 11) v =  9.0;
    else if (idx == 12) v = 15.0;
    else if (idx == 13) v =  7.0;
    else if (idx == 14) v = 13.0;
    else                v =  5.0;
    return v / 16.0;
  }

  // Map screen UV to image UV with CSS-cover semantics — image fills frame,
  // overflow on the longer axis is symmetrically cropped.
  vec2 coverUV(vec2 uv, float screenAR, float imgAR) {
    vec2 scale = imgAR > screenAR
      ? vec2(screenAR / imgAR, 1.0)
      : vec2(1.0, imgAR / screenAR);
    return 0.5 + (uv - 0.5) * scale;
  }

  // Work — Bayer-Dithered Project Grid (2×2): each thumbnail occupies one
  // screen quadrant matching its corner card (TL=0, TR=1, BL=2, BR=3).
  // Scroll arc drives dither chunkiness across the work window: chunky on
  // entry → fine in the middle → chunky on exit.
  vec3 modeWork(vec2 p, float t) {
    float winStart = uHeroExit.y;        // 0.32 — work first becomes visible
    float winEnd   = uWorkExit.y;        // 0.80 — work fully gone
    float winMid   = (winStart + winEnd) * 0.5;
    float t1 = smoothstep(winStart, winMid, uScroll);
    float t2 = smoothstep(winMid, winEnd, uScroll);
    float ditherScale = mix(mix(uWorkDitherIdle, uWorkDitherPeak, t1), uWorkDitherExit, t2);

    // Quadrant pick. Layout:  TL TR
    //                         BL BR
    // vUv.y is 0 at the bottom of NDC; corner cards index in DOM space
    // (top-left = 0, top-right = 1, bottom-left = 2, bottom-right = 3).
    vec2 q = vUv * 2.0;
    int qx = q.x < 1.0 ? 0 : 1;
    int qy = q.y >= 1.0 ? 0 : 1;            // top half (vUv.y >= 0.5) → 0
    int idx = qy * 2 + qx;
    vec2 quadrantUV = fract(q);

    float quadrantAR = uResolution.x / uResolution.y;
    float imgAR =
      idx == 0 ? uWorkAR0 :
      idx == 1 ? uWorkAR1 :
      idx == 2 ? uWorkAR2 : uWorkAR3;
    vec2 sampleUV = coverUV(quadrantUV, quadrantAR, imgAR);

    vec3 col =
      idx == 0 ? texture2D(uWorkTex0, sampleUV).rgb :
      idx == 1 ? texture2D(uWorkTex1, sampleUV).rgb :
      idx == 2 ? texture2D(uWorkTex2, sampleUV).rgb :
                 texture2D(uWorkTex3, sampleUV).rgb;

    // Perceptual luminance, contrast-stretched, then 1-bit Bayer threshold.
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    lum = clamp((lum - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);
    vec2 ditherCoord = floor(gl_FragCoord.xy / max(ditherScale, 1.0));
    float threshold = bayer4(ditherCoord) + uWorkDitherBias;
    float bw = step(threshold, lum);

    return vec3(bw);
  }

  // Contact — Two Lattices Aligning: two stripe fields counter-rotate about a
  // slow global precession. Their angular offset is scroll-driven, so moiré
  // interference at scene entry resolves into a single clean lattice as the
  // user reaches the bottom of the page.
  vec3 modeContact(vec2 p, float t) {
    // Contact owns the canvas from uWorkExit.y (0.8) to s=1.0; alignment
    // moment lands near the end of scroll, with a brief release phase past it.
    float winStart = uWorkExit.y;            // 0.80
    float winMid   = mix(winStart, 1.0, 0.7); // alignment moment
    float winEnd   = 1.0;
    float t1 = smoothstep(winStart, winMid, uScroll);
    float t2 = smoothstep(winMid, winEnd, uScroll);
    float offset = mix(mix(uContactOffsetIdle, uContactOffsetPeak, t1), uContactOffsetExit, t2);

    // Both grids precess together; only the offset between them matters for moiré.
    float globalAngle = t * uContactRotSpeed;
    float a1 = globalAngle - offset * 0.5;
    float a2 = globalAngle + offset * 0.5;
    mat2 r1 = mat2(cos(a1), -sin(a1), sin(a1), cos(a1));
    mat2 r2 = mat2(cos(a2), -sin(a2), sin(a2), cos(a2));

    vec2 q1 = r1 * p * uContactStripeScale;
    vec2 q2 = r2 * p * uContactStripeScale;

    float halfW = uContactLineWidth * 0.5;
    float fw = max(0.5 * (fwidth(q1.x) + fwidth(q2.x)), 0.001);

    float line1 = gridLine(q1.x, halfW, fw);
    float line2 = gridLine(q2.x, halfW, fw);

    return vec3(max(line1, line2));
  }

  // Custom <shaderMaterial> bypasses the colorspace_fragment chunk so we encode
  // linear→sRGB ourselves to match outputColorSpace=SRGBColorSpace.
  vec3 sRGBEncode(vec3 c) {
    vec3 cutoff = vec3(lessThanEqual(c, vec3(0.0031308)));
    vec3 lower = c * 12.92;
    vec3 higher = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, cutoff);
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uResolution.x / uResolution.y;

    // Debug mode 1 — verify vUv plumbing. Should show a red→yellow→green→black quad gradient.
    if (uDebugMode == 1) { gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0); return; }

    // Debug mode 2 — verify uScroll. Solid color: red increases as scroll increases.
    if (uDebugMode == 2) { gl_FragColor = vec4(uScroll, 1.0 - uScroll, 0.0, 1.0); return; }

    float s = uScroll;
    float wHero    = 1.0 - linstep(uHeroExit.x, uHeroExit.y, s);
    float wAbout   = linstep(uHeroExit.x, uHeroExit.y, s) * (1.0 - linstep(uAboutExit.x, uAboutExit.y, s));
    float wWork    = linstep(uAboutExit.x, uAboutExit.y, s) * (1.0 - linstep(uWorkExit.x, uWorkExit.y, s));
    float wContact = linstep(uWorkExit.x, uWorkExit.y, s);

    // Debug mode 3 — visualize weights. R=hero, G=about, B=work, mix-of-all = contact.
    if (uDebugMode == 3) { gl_FragColor = vec4(wHero, wAbout, wWork + wContact, 1.0); return; }

    // Debug mode 4 — force 100% hero everywhere.
    if (uDebugMode == 4) { gl_FragColor = vec4(modeHero(p, uTime), 1.0); return; }

    vec3 col = vec3(0.0);
    if (wHero    > 0.001) col += modeHero(p, uTime)    * wHero;
    if (wAbout   > 0.001) col += modeAbout(p, uTime)   * wAbout;
    if (wWork    > 0.001) col += modeWork(p, uTime)    * wWork;
    if (wContact > 0.001) col += modeContact(p, uTime) * wContact;

    float vig = 1.0 - smoothstep(0.45, 1.0, length(p));
    col *= mix(1.0, vig, uVignette);

    float dither = (vHash(gl_FragCoord.xy) - 0.5) / 255.0;
    col += dither;

    col = clamp(col, 0.0, 1.0);
    col = sRGBEncode(col);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const uniforms = {
  uTime: { value: 0 },
  uScroll: { value: 0 },
  uResolution: { value: [1, 1] as [number, number] },

  uHeroExit: {
    value: [MODULE_WINDOWS.hero.exitStart, MODULE_WINDOWS.hero.exitEnd] as [number, number],
  },
  uAboutExit: {
    value: [MODULE_WINDOWS.about.exitStart, MODULE_WINDOWS.about.exitEnd] as [number, number],
  },
  uWorkExit: {
    value: [MODULE_WINDOWS.work.exitStart, MODULE_WINDOWS.work.exitEnd] as [number, number],
  },

  uHeroRingThickness: { value: 0.035 },
  uHeroWarpScale: { value: 1.4 },
  uHeroWarpSpeed: { value: 0.18 },
  uHeroWarpIdle: { value: 0.02 },
  uHeroWarpPeak: { value: 0.18 },
  uHeroWarpExit: { value: 0.04 },
  uHeroRadiusIdle: { value: 0.42 },
  uHeroRadiusPeak: { value: 0.48 },
  uHeroRadiusExit: { value: 0.65 },

  uAboutPattern: { value: 0 },
  uAboutLineWidth: { value: 0.04 },
  uAboutWaveFreq: { value: 0.3 },
  uAboutWaveSpeed: { value: 0.15 },
  uAboutGridIdle: { value: 8.0 },
  uAboutGridPeak: { value: 12.0 },
  uAboutGridExit: { value: 18.0 },
  uAboutWaveIdle: { value: 0.05 },
  uAboutWavePeak: { value: 0.4 },
  uAboutWaveExit: { value: 0.65 },

  uWorkTex0: { value: placeholderTex as Texture },
  uWorkTex1: { value: placeholderTex as Texture },
  uWorkTex2: { value: placeholderTex as Texture },
  uWorkTex3: { value: placeholderTex as Texture },
  uWorkAR0: { value: 16.0 / 9.0 },
  uWorkAR1: { value: 16.0 / 9.0 },
  uWorkAR2: { value: 16.0 / 9.0 },
  uWorkAR3: { value: 16.0 / 9.0 },
  uWorkDitherIdle: { value: 8.0 },
  uWorkDitherPeak: { value: 3.0 },
  uWorkDitherExit: { value: 10.0 },
  uWorkDitherBias: { value: 0.0 },
  uWorkContrast: { value: 1.1 },

  uContactStripeScale: { value: 16.0 },
  uContactLineWidth: { value: 0.18 },
  uContactRotSpeed: { value: 0.06 },
  uContactOffsetIdle: { value: 0.18 },
  uContactOffsetPeak: { value: 0.0 },
  uContactOffsetExit: { value: 0.04 },

  uVignette: { value: 0.55 },
  uDebugMode: { value: 0 },
};

export default function BackgroundField({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  // Load the four featured project thumbnails once. We bypass Three's auto
  // sRGB decode (LinearSRGBColorSpace) so the dither operates on perceptual
  // values, then the shared sRGBEncode tail handles output gamma.
  const loader = useMemo(() => new TextureLoader(), []);
  useEffect(() => {
    let cancelled = false;
    Promise.all(WORK_THUMBNAILS.map((url) => loader.loadAsync(url))).then((textures) => {
      if (cancelled) return;
      const slots: Array<keyof typeof uniforms> = ['uWorkTex0', 'uWorkTex1', 'uWorkTex2', 'uWorkTex3'];
      const ars: Array<keyof typeof uniforms> = ['uWorkAR0', 'uWorkAR1', 'uWorkAR2', 'uWorkAR3'];
      textures.forEach((tex, i) => {
        tex.colorSpace = LinearSRGBColorSpace;
        tex.minFilter = LinearFilter;
        tex.magFilter = LinearFilter;
        tex.needsUpdate = true;
        (uniforms[slots[i]] as { value: Texture }).value = tex;
        const img = tex.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          (uniforms[ars[i]] as { value: number }).value = img.width / img.height;
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [loader]);

  // setRef holds Leva's imperative `set` so preset onChange handlers can
  // cascade into the per-uniform controls. We can't reference `set` inside the
  // useControls input directly (chicken-and-egg), so we read through the ref.
  const setRef = useRef<((values: Record<string, unknown>) => void) | null>(null);

  const [controls, set] = useControls('Background', () => ({
    Combo: folder(
      {
        bgCombo: {
          value: 'Recommended',
          options: ['(custom)', ...COMBO_PRESET_NAMES],
          label: 'combo',
          onChange: (name: string, _path: string, ctx: { initial: boolean }) => {
            if (ctx.initial || name === '(custom)' || !setRef.current) return;
            const combo = COMBO_PRESETS[name];
            if (!combo) return;
            // Apply preset selectors AND their values directly — leva's `set`
            // does not trigger nested onChange handlers, so we flatten here.
            setRef.current({
              heroPreset: combo.hero,
              aboutPreset: combo.about,
              workPreset: combo.work,
              contactPreset: combo.contact,
              ...HERO_PRESETS[combo.hero],
              ...ABOUT_PRESETS[combo.about],
              ...WORK_PRESETS[combo.work],
              ...CONTACT_PRESETS[combo.contact],
            });
          },
        },
      },
      { collapsed: false },
    ),
    Hero: folder(
      {
        heroPreset: {
          value: 'Halo',
          options: HERO_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = HERO_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        heroRingThickness: { value: 0.018, min: 0.002, max: 0.2, step: 0.001 },
        // Higher = longer, more spread-out warp bumps; lower = busy/chaotic.
        heroDisturbanceLength: { value: 4.5, min: 0.2, max: 12.0, step: 0.05 },
        heroWarpSpeed: { value: 0.12, min: 0.0, max: 1.5, step: 0.01 },
        ScrollArc: folder(
          {
            heroWarpIdle: { value: 0.015, min: 0.0, max: 0.4, step: 0.005 },
            heroWarpPeak: { value: 0.1, min: 0.0, max: 0.4, step: 0.005 },
            heroWarpExit: { value: 0.03, min: 0.0, max: 0.4, step: 0.005 },
            heroRadiusIdle: { value: 0.4, min: 0.05, max: 0.95, step: 0.005 },
            heroRadiusPeak: { value: 0.45, min: 0.05, max: 0.95, step: 0.005 },
            heroRadiusExit: { value: 0.85, min: 0.05, max: 1.4, step: 0.005 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: false },
    ),
    About: folder(
      {
        aboutPreset: {
          value: 'Linen',
          options: ABOUT_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = ABOUT_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        aboutPattern: {
          value: 0,
          options: { Plus: 0, X: 1, Asterisk: 2, Triangle: 3 },
        },
        aboutLineWidth: { value: 0.018, min: 0.005, max: 0.4, step: 0.001 },
        aboutWaveFreq: { value: 0.2, min: 0.0, max: 3.0, step: 0.01 },
        aboutWaveSpeed: { value: 0.08, min: 0.0, max: 1.5, step: 0.01 },
        AboutScrollArc: folder(
          {
            aboutGridIdle: { value: 10, min: 1.0, max: 60.0, step: 0.5 },
            aboutGridPeak: { value: 16, min: 1.0, max: 60.0, step: 0.5 },
            aboutGridExit: { value: 22, min: 1.0, max: 80.0, step: 0.5 },
            aboutWaveIdle: { value: 0.02, min: 0.0, max: 2.0, step: 0.01 },
            aboutWavePeak: { value: 0.1, min: 0.0, max: 2.0, step: 0.01 },
            aboutWaveExit: { value: 0.18, min: 0.0, max: 2.0, step: 0.01 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: true },
    ),
    Work: folder(
      {
        workPreset: {
          value: 'Newsprint',
          options: WORK_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = WORK_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        workDitherBias: { value: 0.0, min: -0.5, max: 0.5, step: 0.01 },
        workContrast: { value: 1.2, min: 0.3, max: 3.0, step: 0.05 },
        WorkScrollArc: folder(
          {
            workDitherIdle: { value: 9, min: 1.0, max: 24.0, step: 0.5 },
            workDitherPeak: { value: 3, min: 1.0, max: 24.0, step: 0.5 },
            workDitherExit: { value: 11, min: 1.0, max: 24.0, step: 0.5 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: true },
    ),
    Contact: folder(
      {
        contactPreset: {
          value: 'Quiet Crossing',
          options: CONTACT_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = CONTACT_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        contactStripeScale: { value: 30, min: 2.0, max: 80.0, step: 0.5 },
        contactLineWidth: { value: 0.08, min: 0.02, max: 0.5, step: 0.005 },
        contactRotSpeed: { value: 0.015, min: 0.0, max: 0.6, step: 0.005 },
        ContactScrollArc: folder(
          {
            contactOffsetIdle: { value: 0.18, min: -0.6, max: 0.6, step: 0.005 },
            contactOffsetPeak: { value: 0.0, min: -0.6, max: 0.6, step: 0.005 },
            contactOffsetExit: { value: 0.0, min: -0.6, max: 0.6, step: 0.005 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: true },
    ),
    Frame: folder(
      {
        vignette: { value: 0.55, min: 0, max: 1, step: 0.05 },
      },
      { collapsed: true },
    ),
    Debug: folder(
      {
        debugMode: {
          value: 0,
          options: { off: 0, vUv: 1, scroll: 2, weights: 3, heroOnly: 4 },
        },
      },
      { collapsed: true },
    ),
  }));

  // Make set() available to onChange closures defined inside the hook.
  useEffect(() => {
    setRef.current = set as (values: Record<string, unknown>) => void;
  }, [set]);

  useEffect(() => {
    uniforms.uHeroRingThickness.value = controls.heroRingThickness;
    uniforms.uHeroWarpScale.value = 1.0 / Math.max(controls.heroDisturbanceLength, 0.0001);
    uniforms.uHeroWarpSpeed.value = controls.heroWarpSpeed;
    uniforms.uHeroWarpIdle.value = controls.heroWarpIdle;
    uniforms.uHeroWarpPeak.value = controls.heroWarpPeak;
    uniforms.uHeroWarpExit.value = controls.heroWarpExit;
    uniforms.uHeroRadiusIdle.value = controls.heroRadiusIdle;
    uniforms.uHeroRadiusPeak.value = controls.heroRadiusPeak;
    uniforms.uHeroRadiusExit.value = controls.heroRadiusExit;

    uniforms.uAboutPattern.value = controls.aboutPattern;
    uniforms.uAboutLineWidth.value = controls.aboutLineWidth;
    uniforms.uAboutWaveFreq.value = controls.aboutWaveFreq;
    uniforms.uAboutWaveSpeed.value = controls.aboutWaveSpeed;
    uniforms.uAboutGridIdle.value = controls.aboutGridIdle;
    uniforms.uAboutGridPeak.value = controls.aboutGridPeak;
    uniforms.uAboutGridExit.value = controls.aboutGridExit;
    uniforms.uAboutWaveIdle.value = controls.aboutWaveIdle;
    uniforms.uAboutWavePeak.value = controls.aboutWavePeak;
    uniforms.uAboutWaveExit.value = controls.aboutWaveExit;

    uniforms.uWorkDitherIdle.value = controls.workDitherIdle;
    uniforms.uWorkDitherPeak.value = controls.workDitherPeak;
    uniforms.uWorkDitherExit.value = controls.workDitherExit;
    uniforms.uWorkDitherBias.value = controls.workDitherBias;
    uniforms.uWorkContrast.value = controls.workContrast;

    uniforms.uContactStripeScale.value = controls.contactStripeScale;
    uniforms.uContactLineWidth.value = controls.contactLineWidth;
    uniforms.uContactRotSpeed.value = controls.contactRotSpeed;
    uniforms.uContactOffsetIdle.value = controls.contactOffsetIdle;
    uniforms.uContactOffsetPeak.value = controls.contactOffsetPeak;
    uniforms.uContactOffsetExit.value = controls.contactOffsetExit;

    uniforms.uVignette.value = controls.vignette;
    uniforms.uDebugMode.value = controls.debugMode;
  }, [controls]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = scrollRef.current;
    uniforms.uResolution.value = [state.size.width, state.size.height];
  });

  return (
    <ScreenQuad renderOrder={-10}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </ScreenQuad>
  );
}
