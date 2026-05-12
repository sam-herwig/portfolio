'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useEffect, useRef } from 'react';
import { CanvasTexture, LinearFilter, type Texture } from 'three';
import { MODULE_WINDOWS } from '@/lib/moduleTimeline';
import { useSceneStore } from '@/lib/useSceneStore';
import {
  LETTER_FILL_PRESET_NAMES,
  LETTER_FILL_PRESETS,
  TRANSITION_PRESET_NAMES,
  TRANSITION_PRESETS,
} from './backgroundPresets';

// Dedicated entity for the inter-module letter moment. Owns the three
// CanvasTexture name masks and runs its own ScreenQuad+fragment shader
// composited on top of BackgroundField. Two orthogonal axes drive the
// look:
//
//   Reveal (when pixels turn on) — Scan / Plate / Slat. Geometric
//     deterministic threshold fields swept by a 0..1 reveal envelope.
//   Fill (what the lit pixels look like) — Engrave / Riso / Loom /
//     Section. Hard-edge B&W pattern families calibrated for letterform
//     density so the silhouette never reads sparse.
//
// Outside transition windows the shader outputs alpha=0 everywhere, so
// the BackgroundField below shows through unmolested.

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
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

  uniform vec2 uHeroExit;
  uniform vec2 uAboutExit;
  uniform vec2 uWorkExit;

  uniform sampler2D uAboutNameMask;
  uniform sampler2D uWorkNameMask;
  uniform sampler2D uContactNameMask;

  // Interaction layer mirrored from BackgroundField via useSceneStore so the
  // single Leva folder in BackgroundField drives both shaders. The warp is
  // applied to the texture-sample UV (mask only — reveal sweep and fill
  // pattern stay screen-aligned), so letterforms physically deform under
  // the cursor while the reveal/fill rhythm reads cleanly.
  //   0 Off · 1 Magnet · 2 Repel · 3 Swirl · 4 Ripple · 5 Lens
  uniform vec2 uMouse;
  uniform int uInteractionMode;
  uniform float uInteractionStrength;
  uniform float uInteractionRadius;
  uniform float uInteractionFreq;

  // Reveal pattern (Scan/Plate/Slat).
  uniform float uPatternScale;
  uniform float uEdgeFeather;
  uniform int   uTransitionPattern;
  uniform vec2  uLetterEmerge;
  uniform vec2  uLetterDissipate;

  // Fill pattern (Engrave/Riso/Loom/Section).
  uniform int   uLetterFillPattern;
  uniform float uLetterFillScale;
  uniform float uLetterFillMotion;

  float vHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // vUv-space variant of BackgroundField's applyInteraction. Converts uv
  // through screen-centered + aspect-corrected p-space so the magnet feels
  // identical between the two shaders (same radius, same falloff), then
  // converts back to vUv for texture sampling.
  vec2 applyInteractionVUv(vec2 uv) {
    if (uInteractionMode == 0) return uv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = uv - 0.5;
    p.x *= aspect;
    vec2 mouseP = uMouse - 0.5;
    mouseP.x *= aspect;
    vec2 d = p - mouseP;
    float d2 = dot(d, d);
    float fall = exp(-d2 / max(uInteractionRadius * uInteractionRadius, 1e-4));
    vec2 warpedP = p;
    if (uInteractionMode == 1) {
      warpedP = p - d * fall * uInteractionStrength;
    } else if (uInteractionMode == 2) {
      warpedP = p + d * fall * uInteractionStrength;
    } else if (uInteractionMode == 3) {
      float angle = fall * uInteractionStrength * 1.5708;
      float ca = cos(angle);
      float sa = sin(angle);
      warpedP = mouseP + mat2(ca, -sa, sa, ca) * d;
    } else if (uInteractionMode == 4) {
      float dist = sqrt(d2 + 1e-6);
      warpedP = p + (d / dist) * sin(dist * uInteractionFreq - uTime * 2.0) * fall * uInteractionStrength * 0.05;
    } else if (uInteractionMode == 5) {
      warpedP = mouseP + d * (1.0 - fall * uInteractionStrength);
    }
    warpedP.x /= aspect;
    return warpedP + 0.5;
  }

  // ===== Fill family 0 — Engrave =====
  // Three superposed binary line layers OR'd via max(). The whole plate
  // slowly rotates around its centroid; the 35° layer additionally swings
  // ±15° on a faster clock; each layer has its own phase drift so lines
  // visibly slide while crossings march. Period derived from
  // uLetterFillScale (lines per viewport-height).
  float fillEngrave(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 c = vec2(uResolution.x / uResolution.y, 1.0) * 0.5;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    // Whole-plate slow rotation around screen center.
    float plateAng = t * 0.12;
    float ca = cos(plateAng);
    float sa = sin(plateAng);
    vec2 r = ar - c;
    ar = c + vec2(r.x * ca - r.y * sa, r.x * sa + r.y * ca);

    float period = 1.0 / max(uLetterFillScale, 1.0);
    float lineW = 0.55;

    float a0 = 0.0;
    float a1 = radians(35.0) + sin(t * 0.9) * radians(15.0);
    float a2 = radians(75.0);

    vec2 d0 = vec2(cos(a0), sin(a0));
    vec2 d1 = vec2(cos(a1), sin(a1));
    vec2 d2 = vec2(cos(a2), sin(a2));

    // Per-layer phase drift — lines slide along their own axis.
    float c0 = mod(dot(ar, d0) + t * 0.06, period) / period;
    float c1 = mod(dot(ar, d1) - t * 0.04, period) / period;
    float c2 = mod(dot(ar, d2) + t * 0.05, period) / period;

    float l0 = step(c0, lineW);
    float l1 = step(c1, lineW);
    float l2 = step(c2, lineW);

    return max(max(l0, l1), l2);
  }

  // ===== Fill family 1 — Riso =====
  // Square cell grid; per-cell circular SDF with radius FLOOR of 0.55*cell
  // so dots never disappear. Density wave sweeps L→R continuously, plus
  // each dot orbits a small distance around its cell center on a hashed
  // phase — gives the field a shimmer without translating any pixel
  // softly. Hard-edge SDF the whole way.
  float fillRiso(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    float n = max(uLetterFillScale, 4.0);
    vec2 cell = floor(ar * n);
    vec2 cellUv = fract(ar * n) - 0.5;

    // Per-cell hashed orbit phase — dots circle inside their cell.
    float ph = vHash(cell) * 6.2831853;
    vec2 orbit = vec2(cos(t * 1.6 + ph), sin(t * 1.6 + ph)) * 0.18;

    // Density wave sweeping L→R, continuous.
    float wave = 0.5 + 0.5 * cos(uv.x * 6.2831853 * 1.5 - t * 1.4);
    float r = mix(0.55, 0.95, wave);

    float d = length(cellUv - orbit) * 2.0; // 0 at orbited center
    return step(d, r);
  }

  // ===== Fill family 2 — Loom =====
  // Truchet weave — every cell is fully painted (no leak-through). Each
  // cell picks one of four motifs by hash + motif clock; clock advances
  // continuously, with a spatial wave so flips PROPAGATE across the
  // silhouette diagonally instead of firing all at once.
  //   0 solid; 1 NE+SW filled corners; 2 NW+SE filled corners; 3 diagonal.
  float fillLoom(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    float n = max(uLetterFillScale, 6.0);
    vec2 cell = floor(ar * n);
    vec2 cellUv = fract(ar * n);

    float h = vHash(cell);
    // Spatial wave: cells along the NE-SW diagonal flip in phase, so a
    // wave of motif changes propagates across the field.
    float wave = (cell.x + cell.y) * 0.18;
    float clk = floor(t * 1.4 + wave + h * 4.0);
    float motif = mod(clk, 4.0);

    float fill = 0.0;
    if (motif < 0.5) {
      fill = 1.0;
    } else if (motif < 1.5) {
      float d1 = length(cellUv - vec2(1.0, 1.0));
      float d2 = length(cellUv - vec2(0.0, 0.0));
      fill = max(step(d1, 0.5), step(d2, 0.5));
    } else if (motif < 2.5) {
      float d1 = length(cellUv - vec2(0.0, 1.0));
      float d2 = length(cellUv - vec2(1.0, 0.0));
      fill = max(step(d1, 0.5), step(d2, 0.5));
    } else {
      float diag = step(cellUv.x, cellUv.y);
      fill = h > 0.5 ? diag : 1.0 - diag;
    }
    return fill;
  }

  // ===== Fill family 3 — Section =====
  // Single-angle dense 45° hatch. Line width breathes 40%↔85% on a fast
  // clock AND lines slide along their axis on a slow clock — the sliding
  // makes the hatch look like a CRT raster scanning, the breathing like
  // a printer's plate inking.
  float fillSection(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    float period = 1.0 / max(uLetterFillScale, 1.0);
    float angle = radians(45.0);
    vec2 dir = vec2(cos(angle), sin(angle));
    float lineW = 0.625 + 0.225 * sin(t * 1.8);
    float band = mod(dot(ar, dir) + t * 0.08, period) / period;
    return step(band, lineW);
  }

  // ===== Fill family 4 — Course =====
  // Running-bond brickwork — alternating rows offset ½ unit. Bricks are
  // 2× wider than tall (period halved on x); a thin black mortar gutter
  // (~7% of cell on each axis) defines the grid. A row-by-row sweep
  // wave blanks out ~3% of bricks per tick and propagates top→bottom so
  // the wall reads alive without ever dropping below ~70% coverage.
  // Built-thing sibling to Loom (woven units → stacked units).
  float fillCourse(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    float n = max(uLetterFillScale, 6.0);
    float row = floor(ar.y * n);
    float offset = mod(row, 2.0) * 0.5;
    float colF = ar.x * n * 0.5 + offset;
    float col = floor(colF);
    vec2 cellUv = vec2(fract(colF), fract(ar.y * n));
    float mortar = step(0.07, cellUv.x) * step(cellUv.x, 0.93)
                 * step(0.07, cellUv.y) * step(cellUv.y, 0.93);
    float h = vHash(vec2(col, row));
    float sweep = floor(t * 1.2 - row * 0.25);
    float dropped = step(0.97, fract(h + sweep * 0.3137));
    return mortar * (1.0 - dropped);
  }

  // ===== Fill family 5 — Tape =====
  // Per-row horizontal ticker conveyors of variable-width vertical bars.
  // Each row scrolls at its own hashed speed (0.4–1.0×) so the strata
  // visibly shear past each other; per-cell hashed widths (0.45–0.95 of
  // cell) keep the rhythm reading as data, not wallpaper. Modulo wrap
  // means no bar ever leaves the field — average coverage ~70%, motion
  // is the dominant idea.
  float fillTape(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    float n = max(uLetterFillScale, 4.0);
    float row = floor(ar.y * n * 0.5);
    float speed = 0.4 + vHash(vec2(row, 7.0)) * 0.6;
    float x = ar.x * n + t * speed * 6.0;
    vec2 cell = vec2(floor(x), row);
    float w = 0.45 + vHash(cell) * 0.5;
    return step(fract(x), w);
  }

  // ===== Fill family 6 — Scope =====
  // Hard-edged concentric rings expanding from a focus that orbits a
  // small radius. Outward march via floor(r - t·speed); 2-cycle band
  // parity guarantees an exact 50% coverage floor regardless of focus
  // position. The drift keeps the radial origin off-center so bands
  // curve unpredictably across the silhouette — sonar / oscilloscope
  // / depth-finder language. Adds radial geometry no other fill has.
  float fillScope(vec2 uv, float u) {
    float t = uTime * uLetterFillMotion;
    vec2 ar = uv * vec2(uResolution.x / uResolution.y, 1.0);
    vec2 c = vec2(uResolution.x / uResolution.y, 1.0) * 0.5;
    vec2 focus = c + vec2(cos(t * 0.7), sin(t * 0.9)) * 0.18;
    float n = max(uLetterFillScale, 4.0);
    float r = length(ar - focus) * n;
    float band = floor(r - t * 1.6);
    return mod(band, 2.0);
  }

  float letterFill(vec2 uv, float u) {
    if (uLetterFillPattern == 1) return fillRiso(uv, u);
    if (uLetterFillPattern == 2) return fillLoom(uv, u);
    if (uLetterFillPattern == 3) return fillSection(uv, u);
    if (uLetterFillPattern == 4) return fillCourse(uv, u);
    if (uLetterFillPattern == 5) return fillTape(uv, u);
    if (uLetterFillPattern == 6) return fillScope(uv, u);
    return fillEngrave(uv, u);
  }

  // Reveal pattern threshold for the active transition. Scan = top→bottom
  // line; Plate = square iris from screen center; Slat = N quantized
  // bands top→bottom. Same mechanism as before — only the selector lives
  // here now instead of inside BackgroundField.
  float revealThreshold(vec2 uv) {
    if (uTransitionPattern == 1) {
      return max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0;
    }
    if (uTransitionPattern == 2) {
      float n = max(uPatternScale, 1.0);
      return (floor((1.0 - uv.y) * n) + 0.5) / n;
    }
    return 1.0 - uv.y;
  }

  void main() {
    float s = uScroll;
    float pt = revealThreshold(vUv);
    // Warp the mask sample coord — reveal sweep and fill pattern stay on
    // plain vUv so the letter beat's cadence reads cleanly while the
    // letterform itself deforms under the cursor.
    vec2 maskUv = applyInteractionVUv(vUv);

    // Branch on which transition window contains s. Scroll is uniform per
    // frame so all pixels take the same branch — full warp coherence,
    // free branching. Outside any window pop=mask=0 → alpha=0 (no draw).
    float pop = 0.0;
    float maskV = 0.0;
    float u = 0.0;

    if (s >= uHeroExit.x && s <= uHeroExit.y) {
      u = (s - uHeroExit.x) / max(uHeroExit.y - uHeroExit.x, 1e-6);
      float emerge = smoothstep(uLetterEmerge.x, uLetterEmerge.y, u);
      float dissipate = smoothstep(uLetterDissipate.x, uLetterDissipate.y, u);
      float reveal = emerge * (1.0 - dissipate);
      pop = smoothstep(pt - uEdgeFeather, pt + uEdgeFeather, reveal);
      maskV = texture2D(uAboutNameMask, maskUv).r;
    } else if (s >= uAboutExit.x && s <= uAboutExit.y) {
      u = (s - uAboutExit.x) / max(uAboutExit.y - uAboutExit.x, 1e-6);
      float emerge = smoothstep(uLetterEmerge.x, uLetterEmerge.y, u);
      float dissipate = smoothstep(uLetterDissipate.x, uLetterDissipate.y, u);
      float reveal = emerge * (1.0 - dissipate);
      pop = smoothstep(pt - uEdgeFeather, pt + uEdgeFeather, reveal);
      maskV = texture2D(uWorkNameMask, maskUv).r;
    } else if (s >= uWorkExit.x && s <= uWorkExit.y) {
      u = (s - uWorkExit.x) / max(uWorkExit.y - uWorkExit.x, 1e-6);
      float emerge = smoothstep(uLetterEmerge.x, uLetterEmerge.y, u);
      float dissipate = smoothstep(uLetterDissipate.x, uLetterDissipate.y, u);
      float reveal = emerge * (1.0 - dissipate);
      pop = smoothstep(pt - uEdgeFeather, pt + uEdgeFeather, reveal);
      maskV = texture2D(uContactNameMask, maskUv).r;
    }

    // Fill: outside letter, output black (covers BG); inside letter,
    // output the chosen fill pattern. Alpha is the reveal pop so the
    // moment fades in/out via the pattern threshold sweep, not via a
    // global crossfade. Same compositing semantics as before — the
    // change is only WHERE this lives and WHAT'S inside the letter.
    float fillVal = letterFill(vUv, u);
    vec3 col = maskV * vec3(fillVal);
    gl_FragColor = vec4(col, pop);
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

  uAboutNameMask: { value: null as Texture | null },
  uWorkNameMask: { value: null as Texture | null },
  uContactNameMask: { value: null as Texture | null },

  // Reveal pattern defaults match the Scan transition preset (rebased to
  // the 160svh transition window in moduleTimeline.ts).
  uPatternScale: { value: 1.0 },
  uEdgeFeather: { value: 0.004 },
  uTransitionPattern: { value: 0 },
  uLetterEmerge: { value: [0.176, 0.288] as [number, number] },
  uLetterDissipate: { value: [0.712, 0.824] as [number, number] },

  // Fill pattern defaults match the Scope letter-fill preset.
  uLetterFillPattern: { value: 6 },
  uLetterFillScale: { value: 17.0 },
  uLetterFillMotion: { value: 0.5 },

  // Interaction layer — driven by useSceneStore (mirrored from
  // BackgroundField's Leva folder). Defaults match the store's defaults so
  // SSR and first-frame are coherent before the store is read.
  uMouse: { value: [0.5, 0.5] as [number, number] },
  uInteractionMode: { value: 1 },
  uInteractionStrength: { value: 1.03 },
  uInteractionRadius: { value: 0.13 },
  uInteractionFreq: { value: 8.5 },
};

export default function LetterFillField() {
  const setRef = useRef<((values: Record<string, unknown>) => void) | null>(null);

  // Rasterize "About", "Work", "Contact" into viewport-sized CanvasTextures.
  // Red channel = 1 inside the glyph fills, 0 elsewhere. Each mask is
  // sampled in vUv space at viewport resolution. Pixel-square font matches
  // the homepage's PixelTitle identity. CSS vars from next/font live on
  // <body>, not <html>.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    type Bundle = { canvas: HTMLCanvasElement; tex: CanvasTexture; text: string };

    const make = (uniform: { value: Texture | null }, text: string): Bundle => {
      const canvas = document.createElement('canvas');
      const tex = new CanvasTexture(canvas);
      tex.minFilter = LinearFilter;
      tex.magFilter = LinearFilter;
      uniform.value = tex;
      return { canvas, tex, text };
    };

    const bundles: Bundle[] = [
      make(uniforms.uAboutNameMask, 'About'),
      make(uniforms.uWorkNameMask, 'Work'),
      make(uniforms.uContactNameMask, 'Contact'),
    ];

    // Pick one fontPx for all three words by fitting the LONGEST string to
    // 88% of viewport width. Earlier the per-word width-fit let "Work" stay
    // large while "Contact" shrank on narrow viewports — letter beats across
    // module transitions read inconsistently. Mobile DPR clamps to 1.5 to
    // match SceneCanvas's mobile Canvas dpr so the mask texture isn't
    // authored above the canvas's actual render resolution.
    const drawAll = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const isMobile = winW < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const w = Math.max(1, Math.round(winW * dpr));
      const h = Math.max(1, Math.round(winH * dpr));
      const family =
        getComputedStyle(document.body).getPropertyValue('--font-geist-pixel-square').trim() || 'monospace';

      const probe = document.createElement('canvas').getContext('2d');
      const targetWidth = 0.88 * w;
      let fontPx = Math.round(0.5 * h);
      if (probe) {
        probe.font = `500 ${fontPx}px ${family}`;
        let maxWidth = 0;
        for (const b of bundles) {
          const m = probe.measureText(b.text);
          if (m.width > maxWidth) maxWidth = m.width;
        }
        if (maxWidth > targetWidth) {
          fontPx = Math.round((fontPx * targetWidth) / maxWidth);
        }
      }

      for (const { canvas, tex, text } of bundles) {
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'white';
        ctx.font = `500 ${fontPx}px ${family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, h / 2);
        tex.needsUpdate = true;
      }
    };

    drawAll();

    // iOS Safari fires resize on every URL-bar show/hide; without this
    // debounce all three masks would re-rasterize and re-upload to GPU
    // mid-scroll. rAF-coalesce and skip height-only wobbles smaller than the
    // URL-bar delta — width changes (rotation, split-screen) are the real
    // layout signal that warrants a redraw.
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dw = Math.abs(window.innerWidth - lastW);
        const dh = Math.abs(window.innerHeight - lastH);
        if (dw < 1 && dh < 120) return;
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        drawAll();
      });
    };
    window.addEventListener('resize', onResize);

    let cancelled = false;
    if ('fonts' in document) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) drawAll();
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      bundles.forEach((b) => b.tex.dispose());
    };
  }, []);

  const [controls, set] = useControls('LetterMoment', () => ({
    Reveal: folder(
      {
        transitionPreset: {
          value: 'Scan',
          options: TRANSITION_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = TRANSITION_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        transitionPattern: {
          value: 0,
          options: { scan: 0, plate: 1, slat: 2 },
          label: 'pattern',
        },
        edgeFeather: { value: 0.004, min: 0.001, max: 0.05, step: 0.001 },
        patternScale: { value: 1.0, min: 1.0, max: 24.0, step: 0.5, label: 'scale (slat N)' },
        letterEmergeStart: { value: 0.176, min: 0.1, max: 0.4, step: 0.01 },
        letterEmergeEnd: { value: 0.288, min: 0.15, max: 0.5, step: 0.01 },
        letterDissipateStart: { value: 0.712, min: 0.5, max: 0.85, step: 0.01 },
        letterDissipateEnd: { value: 0.824, min: 0.55, max: 0.95, step: 0.01 },
      },
      { collapsed: true },
    ),
    Fill: folder(
      {
        letterFillPreset: {
          value: 'Scope',
          options: LETTER_FILL_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = LETTER_FILL_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        letterFillPattern: {
          value: 6,
          options: { engrave: 0, riso: 1, loom: 2, section: 3, course: 4, tape: 5, scope: 6 },
          label: 'pattern',
        },
        letterFillScale: { value: 17.0, min: 4.0, max: 200.0, step: 1.0, label: 'scale' },
        letterFillMotionSpeed: { value: 0.5, min: 0.0, max: 4.0, step: 0.05, label: 'motion' },
      },
      { collapsed: true },
    ),
  }));

  useEffect(() => {
    setRef.current = set as (values: Record<string, unknown>) => void;
  }, [set]);

  useEffect(() => {
    uniforms.uPatternScale.value = controls.patternScale;
    uniforms.uEdgeFeather.value = controls.edgeFeather;
    uniforms.uTransitionPattern.value = controls.transitionPattern;
    uniforms.uLetterEmerge.value = [controls.letterEmergeStart, controls.letterEmergeEnd];
    uniforms.uLetterDissipate.value = [controls.letterDissipateStart, controls.letterDissipateEnd];

    uniforms.uLetterFillPattern.value = controls.letterFillPattern;
    uniforms.uLetterFillScale.value = controls.letterFillScale;
    uniforms.uLetterFillMotion.value = controls.letterFillMotionSpeed;
  }, [controls]);

  useFrame((state) => {
    const store = useSceneStore.getState();
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = store.scrollProgress;
    uniforms.uResolution.value = [state.size.width, state.size.height];

    // Pull interaction params + mouse target from the shared store. Same
    // 0.08 lerp factor as BackgroundField so the two shaders track in sync.
    uniforms.uInteractionMode.value = store.interactionMode;
    uniforms.uInteractionStrength.value = store.interactionStrength;
    uniforms.uInteractionRadius.value = store.interactionRadius;
    uniforms.uInteractionFreq.value = store.interactionFreq;
    const target = store.mouseTarget;
    const m = uniforms.uMouse.value;
    m[0] += (target[0] - m[0]) * 0.08;
    m[1] += (target[1] - m[1]) * 0.08;
  });

  return (
    <ScreenQuad renderOrder={-9}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        transparent
      />
    </ScreenQuad>
  );
}
