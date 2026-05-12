'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useEffect, useRef } from 'react';
import { MODULE_WINDOWS } from '@/lib/moduleTimeline';
import { useSceneStore } from '@/lib/useSceneStore';
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
  uniform vec2 uModuleCenter; // visible slot center in vUv [0,1] space

  // Module exit windows from MODULE_WINDOWS — single source of truth.
  uniform vec2 uHeroExit;
  uniform vec2 uAboutExit;
  uniform vec2 uWorkExit;

  // Hero — SDF Shape Morph (B&W)
  // 4 keypoints across hero window: circle → triangle → square → hexagon.
  // Linger-then-whoosh easing on the morph; FBM warp dissolves shape mid-segment
  // and crystallizes it at each keypoint via a tent activity signal.
  uniform float uHeroRingThickness;
  uniform float uHeroShapeRadius;
  uniform float uHeroWarpScale;
  uniform float uHeroWarpSpeed;
  uniform float uHeroWarpBase;   // warp at keypoints
  uniform float uHeroWarpPeak;   // additional warp at mid-segment
  uniform float uHeroRotRate;    // total rotation across hero window (radians)

  // About — Plus-Grid SDF Mosaic (B&W)
  // Tessellated cells, each containing a glyph that morphs through 4 keypoints
  // (Plus → X → Diamond → Circle) with linger-then-whoosh easing — mirrors
  // hero's SDF morph idiom. Per-cell radial phase offset propagates the morph
  // wave outward from a focal point (uAboutRadialCenter), so cells near the
  // focal point lead and cells at the periphery lag.
  uniform float uAboutGridScale;
  uniform float uAboutStrokeWidth;
  uniform vec2  uAboutRadialCenter;
  uniform float uAboutStaggerStrength;
  uniform float uAboutWaveAmp;
  uniform float uAboutRotRate;

  // Work — three procedural modes, switched by uWorkMode (0/1/2). All B&W,
  // all single-fragment-pass, all driven by the same scroll-window envelope
  // the rest of the modules use. Each mode owns its own knob set:
  //   0 = Spread — contact-sheet ledger of card-frames (siblings About).
  //   1 = Stack  — horizontal ridgeline of bar-spines (siblings Hero).
  //   2 = Index  — single card SDF morphing through formats (siblings Hero).
  uniform int uWorkMode;

  // Spread mode
  uniform float uWorkGridCols;
  uniform float uWorkGridRows;
  uniform float uWorkCardPadding;
  uniform float uWorkStrokeWidth;
  uniform vec2  uWorkRadialCenter;
  uniform float uWorkStaggerStrength;
  uniform float uWorkRotRate;
  uniform float uWorkDotSize;

  // Stack mode
  uniform float uWorkBarCount;
  uniform float uWorkBarGap;
  uniform float uWorkBaseHeight;
  uniform float uWorkVarianceIdle;
  uniform float uWorkVariancePeak;
  uniform float uWorkVarianceExit;
  uniform float uWorkBreathSpeed;

  // Index mode
  uniform float uWorkCardSize;
  uniform float uWorkRingThickness;
  uniform float uWorkWarpScale;
  uniform float uWorkWarpSpeed;
  uniform float uWorkWarpBase;
  uniform float uWorkWarpPeak;
  uniform float uWorkSubGridDensity;

  // Contact — Two Lattices Aligning (B&W)
  uniform float uContactStripeScale;
  uniform float uContactLineWidth;
  uniform float uContactRotSpeed;
  uniform float uContactOffsetIdle;
  uniform float uContactOffsetPeak;
  uniform float uContactOffsetExit;

  uniform float uVignette;
  uniform float uCrossfadeWidth;
  uniform int uDebugMode;

  // Interaction layer — universal cursor disturbance applied uniformly to all
  // four module evaluations. uMouse is in vUv [0,1] space; main() transforms
  // it into module-local p-space before applyInteraction warps the lookup
  // coord. Modes map to ints; uniform branch keeps dispatch coherent.
  //   0 Off · 1 Magnet · 2 Repel · 3 Swirl · 4 Ripple · 5 Lens
  uniform vec2 uMouse;
  uniform int uInteractionMode;
  uniform float uInteractionStrength;
  uniform float uInteractionRadius;
  uniform float uInteractionFreq;

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

  float linstep(float a, float b, float x) {
    return clamp((x - a) / max(b - a, 1e-6), 0.0, 1.0);
  }

  // === Easing for the morph timeline ===
  // Linger-then-whoosh: 15% plateau at each end, cubic ease through middle 70%.
  float linger(float lt) {
    return smoothstep(0.15, 0.85, lt);
  }

  // Tent activity signal: 0 at keypoints, 1 mid-segment, zero derivative at
  // endpoints (smoother than a parabola — keypoints feel truly resolved).
  float tent(float lt) {
    return smoothstep(0.0, 0.5, lt) * smoothstep(1.0, 0.5, lt);
  }

  // === 2D SDFs (Inigo Quilez canon, iquilezles.org/articles/distfunctions2d) ===
  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  // Equilateral triangle, point-up (vertical symmetry axis through apex).
  float sdEquilateralTriangle(vec2 p, float r) {
    const float k = 1.7320508; // sqrt(3)
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
  }

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  // Regular hexagon, flat-top by default. We rotate input by 30° before calling
  // to align it pointy-top so the vertical axis of symmetry matches circle/
  // triangle/square — keeps the morph reading as symmetric pulse, not wobble.
  float sdHexagon(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
  }

  // Plus / cross — union of two perpendicular boxes.
  float sdPlus(vec2 p, float armLen, float armWidth) {
    return min(sdBox(p, vec2(armLen, armWidth)), sdBox(p, vec2(armWidth, armLen)));
  }

  // X — Plus rotated 45°.
  float sdX(vec2 p, float armLen, float armWidth) {
    vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.7071;
    return sdPlus(q, armLen, armWidth);
  }

  // Filled diamond (rotated square). L1 norm SDF.
  float sdDiamond(vec2 p, float halfDiag) {
    return abs(p.x) + abs(p.y) - halfDiag;
  }

  // Anti-aliased line at integer offsets along a 1D coord (cell space).
  float gridLine(float coord, float halfW, float fw) {
    float dist = 0.5 - abs(fract(coord) - 0.5);
    return 1.0 - smoothstep(halfW, halfW + fw, dist);
  }

  // === Hero — SDF Shape Morph ===
  // Maps uScroll across [0, uHeroExit.y] to a 4-keypoint timeline (3 segments).
  // Each segment lingers at its endpoints and whooshes through the middle;
  // FBM warp amplitude follows a tent (calm at keypoints, turbulent mid-morph).
  // Subtle scroll-driven rotation is paced by the same morph timing.
  vec3 modeHero(vec2 p, float t) {
    float halfCF = uCrossfadeWidth * 0.5;
    float heroMid = (uHeroExit.x + uHeroExit.y) * 0.5;
    float visEnd = heroMid + halfCF;
    float t01 = clamp(uScroll / max(visEnd, 1e-4), 0.0, 1.0);
    float seg = t01 * 3.0;
    float i = min(floor(seg), 2.0);
    float lt = clamp(seg - i, 0.0, 1.0);
    float ta = tent(lt);
    float morphMix = linger(lt);

    // Rotation tracks the morph cadence: each segment contributes uHeroRotRate/3.
    float rotProgress = (i + linger(lt)) / 3.0;
    float angle = uHeroRotRate * rotProgress;
    float ca = cos(angle);
    float sa = sin(angle);
    vec2 pr = mat2(ca, -sa, sa, ca) * p;

    // Evaluate all 4 SDFs unconditionally — branchless segment select below
    // is cheaper than predicated branches on the GPU.
    float r = uHeroShapeRadius;
    float d0 = sdCircle(pr, r);
    float d1 = sdEquilateralTriangle(pr, r);
    float d2 = sdBox(pr, vec2(r));
    // Hexagon: rotate input 30° to convert flat-top → pointy-top.
    float ch = 0.86602540; // cos(30°)
    float sh = 0.5;        // sin(30°)
    vec2 phex = mat2(ch, -sh, sh, ch) * pr;
    float d3 = sdHexagon(phex, r);

    // Branchless segment endpoint pick via step() masks.
    float m0 = step(i, 0.5);
    float m1 = step(0.5, i) * step(i, 1.5);
    float m2 = step(1.5, i);
    float dA = m0 * d0 + m1 * d1 + m2 * d2;
    float dB = m0 * d1 + m1 * d2 + m2 * d3;

    float d = mix(dA, dB, morphMix);

    // FBM warp added directly to distance — between keypoints the SDF "fronts"
    // dissolve into turbulent ripples; at keypoints (ta → 0) the shape returns
    // to its clean polygon edge.
    float warpAmp = uHeroWarpBase + uHeroWarpPeak * ta;
    vec2 warpCoord = pr * uHeroWarpScale + vec2(t * uHeroWarpSpeed, t * uHeroWarpSpeed * 0.37);
    float warpA = fbm(warpCoord) - 0.5;
    float warpB = fbm(pr * uHeroWarpScale * 1.7 - vec2(t * uHeroWarpSpeed * 0.6, 0.0)) - 0.5;
    d += (warpA + warpB * 0.6) * warpAmp;

    float fw = max(fwidth(d) * 1.2, 0.001);
    float ring = 1.0 - smoothstep(0.0, fw, abs(d) - uHeroRingThickness);
    return vec3(ring);
  }

  // === About — Plus-Grid SDF Mosaic ===
  // Tessellated cells via domain repetition. Each cell hosts a glyph that
  // morphs through 4 SDF keypoints (Plus → X → Diamond → Circle) with the
  // same linger/tent cadence hero uses. A per-cell radial phase offset
  // propagates the morph wave outward from uAboutRadialCenter, so cells
  // near the focal point lead the morph and peripheral cells lag.
  vec3 modeAbout(vec2 p, float t) {
    float halfCF = uCrossfadeWidth * 0.5;
    float heroMid = (uHeroExit.x + uHeroExit.y) * 0.5;
    float aboutMid = (uAboutExit.x + uAboutExit.y) * 0.5;
    float aboutStart = heroMid - halfCF;
    float aboutEnd = aboutMid + halfCF;
    float globalT01 = clamp((uScroll - aboutStart) / max(aboutEnd - aboutStart, 1e-4), 0.0, 1.0);

    // Subtle progressive grid rotation across the about window.
    float globalAngle = uAboutRotRate * globalT01;
    float gca = cos(globalAngle);
    float gsa = sin(globalAngle);
    vec2 pr = mat2(gca, -gsa, gsa, gca) * p;

    // Domain repetition.
    vec2 cell = pr * uAboutGridScale;
    vec2 cellId = floor(cell);
    vec2 cellP = fract(cell) - 0.5;

    // Per-cell radial phase. cellCenter is in canvas-local (pre-scale) coords
    // so uAboutRadialCenter is consistent with the screen, not the grid.
    vec2 cellCenter = (cellId + 0.5) / uAboutGridScale;
    float radial = length(cellCenter - uAboutRadialCenter);
    float phase = radial * uAboutStaggerStrength;

    // Rescale per-cell timeline so peripheral cells still finish within
    // the global window. Worst-case radial ≈ 1.0 → maxPhase = staggerStrength.
    float maxPhase = uAboutStaggerStrength;
    float cellT01 = clamp(
      (globalT01 - phase) / max(1.0 - maxPhase, 1e-3),
      0.0, 1.0
    );

    // 3 segments across 4 keypoints (Plus → X → Diamond → Circle).
    float seg = cellT01 * 3.0;
    float i = min(floor(seg), 2.0);
    float lt = clamp(seg - i, 0.0, 1.0);
    float ta = tent(lt);
    float morphMix = linger(lt);

    // Subtle per-cell wave warp, gated by tent (clean keypoints, turbulent
    // mid-morph). Per-cell phase seed gives organic variation across the field.
    vec2 phaseSeed = cellId * 0.31;
    vec2 wp = cellP + vec2(
      sin(t * 0.5 + phaseSeed.x) * uAboutWaveAmp * ta,
      cos(t * 0.4 + phaseSeed.y) * uAboutWaveAmp * ta
    );

    // Glyph dimensions in cell-local space (cellP ∈ [-0.5, 0.5]).
    const float armLen = 0.4;
    const float halfDiag = 0.4;
    const float radius = 0.4;
    float strokeW = uAboutStrokeWidth;

    // Evaluate all 4 SDFs unconditionally — branchless segment select below.
    float d0 = sdPlus(wp, armLen, strokeW);
    float d1 = sdX(wp, armLen, strokeW);
    float d2 = sdDiamond(wp, halfDiag);
    float d3 = sdCircle(wp, radius);

    float m0 = step(i, 0.5);
    float m1 = step(0.5, i) * step(i, 1.5);
    float m2 = step(1.5, i);
    float dA = m0 * d0 + m1 * d1 + m2 * d2;
    float dB = m0 * d1 + m1 * d2 + m2 * d3;

    float d = mix(dA, dB, morphMix);

    // Filled glyph with analytic AA edge.
    float fw = max(fwidth(d) * 1.2, 0.001);
    float glyph = 1.0 - smoothstep(-fw, fw, d);

    return vec3(glyph);
  }

  // Shared work-window scroll envelope. Returns vec3(globalT01, t1, t2) where
  // globalT01 spans aboutMid → workMid+halfCF, t1 ramps idle→peak in the
  // first half, t2 ramps peak→exit in the second half. Mirrors the
  // about/work transitional window the previous dither modeWork used so the
  // new modes inherit identical timing.
  vec3 workEnvelope() {
    float halfCF = uCrossfadeWidth * 0.5;
    float aboutMid = (uAboutExit.x + uAboutExit.y) * 0.5;
    float workMid  = (uWorkExit.x + uWorkExit.y) * 0.5;
    float winStart = aboutMid - halfCF;
    float winEnd   = workMid + halfCF;
    float winMid   = (winStart + winEnd) * 0.5;
    float gT01 = clamp((uScroll - winStart) / max(winEnd - winStart, 1e-4), 0.0, 1.0);
    float t1 = smoothstep(winStart, winMid, uScroll);
    float t2 = smoothstep(winMid, winEnd, uScroll);
    return vec3(gT01, t1, t2);
  }

  // === Work mode 0 — Spread ===
  // Tessellated card-frame grid (cols × rows) where each cell hosts a small
  // ledger glyph that morphs bullet → fold → tag → check across the work
  // window. Per-cell radial phase from uWorkRadialCenter propagates the morph
  // diagonally — same idiom as the About plus-grid mosaic.
  vec3 modeWorkSpread(vec2 p, float t) {
    vec3 env = workEnvelope();
    float globalT01 = env.x;

    // Optional whole-field rotation (subtle drift).
    float ang = uWorkRotRate * globalT01;
    vec2 pr = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;

    // Cell tessellation. Normalize pr by aspect on x so uWorkGridCols reads
    // as visible column count (pr is aspect-multiplied in main()). pr.y is
    // already in [-0.5, 0.5] so uWorkGridRows is direct.
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 cell = vec2((pr.x / max(aspect, 1e-3)) * uWorkGridCols, pr.y * uWorkGridRows);
    vec2 cellId = floor(cell);
    vec2 cellP = fract(cell) - 0.5;

    // Per-cell radial phase. cellCenter normalized to roughly [-0.5, 0.5]^2
    // canvas space so uWorkRadialCenter reads as a screen-space focal point.
    vec2 cellCenter = (cellId + 0.5) / vec2(uWorkGridCols, uWorkGridRows);
    float radial = length(cellCenter - uWorkRadialCenter);
    float phase = radial * uWorkStaggerStrength;
    float cellT01 = clamp(
      (globalT01 - phase) / max(1.0 - uWorkStaggerStrength, 1e-3),
      0.0, 1.0
    );

    // Analytic pixel size in cell-local coords. fwidth on cell-local SDFs
    // (frame ring, glyph) blows up at cell boundaries because fract()
    // discontinuities and per-cell cellT01 jumps produce huge gradients
    // across the 2×2 derivative quad. That aliases into a faint dashed
    // seam at every column edge. Computing the pixel size analytically
    // from uResolution + grid density bypasses derivatives entirely so
    // anti-aliasing is uniform inside each cell with no boundary spike.
    // The 0.5 multiplier collapses the AA half-width to ~half a pixel,
    // which removes the grainy mid-grey shimmer on slow-rotating dots
    // and keeps edges close to a hard binary line.
    float pxX = (aspect / max(uResolution.x, 1.0)) * uWorkGridCols;
    float pxY = (1.0 / max(uResolution.y, 1.0)) * uWorkGridRows;
    float fwAA = length(vec2(pxX, pxY)) * 0.5;

    // Card-frame ring: sdBox subtracted from a slightly larger sdBox.
    vec2 frameHalf = vec2(0.5 - uWorkCardPadding);
    float frameOuter = sdBox(cellP, frameHalf);
    float frameInner = sdBox(cellP, frameHalf - vec2(uWorkStrokeWidth));
    float frameStroke = max(-frameOuter, frameInner);
    float frame = 1.0 - smoothstep(0.0, fwAA, abs(frameStroke));

    // Ledger glyph anchored at left side of cell (like a list bullet).
    vec2 g = cellP - vec2(-0.28, 0.0);

    // 3 segments across 4 keypoints: bullet → fold → tag → check.
    float seg = cellT01 * 3.0;
    float i = min(floor(seg), 2.0);
    float lt = clamp(seg - i, 0.0, 1.0);
    float morphMix = linger(lt);

    // Single multiplier scales all 4 morph keypoints proportionally so
    // the bullet→fold→tag→check sequence keeps its relative shape ratios
    // as the user dials dot size up or down.
    float ds = max(uWorkDotSize, 0.01);
    float dBullet = sdCircle(g, 0.04 * ds);
    float dFold   = sdBox(g, vec2(0.07, 0.018) * ds);
    float dTag    = sdDiamond(g, 0.07 * ds);
    float dCheck  = sdPlus(g, 0.07 * ds, 0.018 * ds);

    float m0 = step(i, 0.5);
    float m1 = step(0.5, i) * step(i, 1.5);
    float m2 = step(1.5, i);
    float dA = m0 * dBullet + m1 * dFold   + m2 * dTag;
    float dB = m0 * dFold   + m1 * dTag    + m2 * dCheck;
    float dG = mix(dA, dB, morphMix);

    float glyph = 1.0 - smoothstep(-fwAA, fwAA, dG);

    return vec3(max(frame, glyph));
  }

  // === Work mode 1 — Stack ===
  // Horizontal ridgeline of vertical bar-spines, heights driven by per-bar
  // hash + FBM breath, gated by the idle/peak/exit variance envelope. A few
  // outlier bars rise on exit (the case studies stepping out of the catalog).
  vec3 modeWorkStack(vec2 p, float t) {
    vec3 env = workEnvelope();
    float t1 = env.y;
    float t2 = env.z;

    // Normalize x by aspect so uWorkBarCount reads as visible bar count
    // (p.x is already aspect-multiplied in main()).
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float n = max(uWorkBarCount, 1.0);
    float u = (p.x / max(aspect, 1e-3) + 0.5) * n; // 0..n across visible width
    float bar = floor(u);
    float local = fract(u);
    float gap = clamp(uWorkBarGap, 0.0, 0.45);
    float inBar = step(gap, local) * step(local, 1.0 - gap);

    float seed = vHash(vec2(bar, 17.0));
    float variance = mix(mix(uWorkVarianceIdle, uWorkVariancePeak, t1), uWorkVarianceExit, t2);
    float breath = fbm(vec2(bar * 0.7, t * uWorkBreathSpeed)) - 0.5;
    float h = uWorkBaseHeight + variance * (seed - 0.5) + variance * 0.4 * breath;

    // Outlier accent on exit: the top ~8% of bars rise sharply.
    float outlier = step(0.92, seed) * t2 * 0.18;
    h += outlier;

    float topY = -0.5 + clamp(h, 0.0, 0.95);
    float fw = max(fwidth(p.y) * 1.5, 0.001);
    float fill = 1.0 - smoothstep(topY - fw, topY + fw, p.y);
    return vec3(fill * inBar);
  }

  // === Work mode 2 — Index ===
  // Single dominant card SDF that morphs through 4 format keypoints across
  // the work window: landscape → portrait → square → contact-sheet (square +
  // an internal grid of stripes). FBM warp on the edge using Hero's library.
  vec3 modeWorkIndex(vec2 p, float t) {
    vec3 env = workEnvelope();
    float globalT01 = env.x;

    float seg = globalT01 * 3.0;
    float i = min(floor(seg), 2.0);
    float lt = clamp(seg - i, 0.0, 1.0);
    float ta = tent(lt);
    float morphMix = linger(lt);

    float s = uWorkCardSize;
    float dLand = sdBox(p, vec2(s, s * 0.6));
    float dPort = sdBox(p, vec2(s * 0.6, s));
    float dSqr  = sdBox(p, vec2(s * 0.78));
    float dGrid = sdBox(p, vec2(s * 0.92, s * 0.62));

    float m0 = step(i, 0.5);
    float m1 = step(0.5, i) * step(i, 1.5);
    float m2 = step(1.5, i);
    float dA = m0 * dLand + m1 * dPort + m2 * dSqr;
    float dB = m0 * dPort + m1 * dSqr  + m2 * dGrid;
    float d = mix(dA, dB, morphMix);

    // FBM warp injected into distance — calm at keypoints, turbulent mid-segment.
    float warpAmp = uWorkWarpBase + uWorkWarpPeak * ta;
    vec2 warpCoord = p * uWorkWarpScale + vec2(t * uWorkWarpSpeed, t * uWorkWarpSpeed * 0.43);
    float w = (fbm(warpCoord) - 0.5);
    d += w * warpAmp;

    float fw = max(fwidth(d) * 1.2, 0.001);
    float ring = 1.0 - smoothstep(0.0, fw, abs(d) - uWorkRingThickness);

    // On the final keypoint, subdivide the card with vertical stripes — turns
    // the square into a contact-sheet/grid format. Only inside the card body.
    float inside = 1.0 - smoothstep(-fw, fw, d);
    float stripeFW = max(fwidth(p.x) * 1.5, 0.001);
    float stripe = gridLine(p.x * uWorkSubGridDensity, 0.04, stripeFW);
    float gridReveal = step(1.5, i) * morphMix * stripe * inside;

    return vec3(max(ring, gridReveal));
  }

  vec3 modeWork(vec2 p, float t) {
    if (uWorkMode == 1) return modeWorkStack(p, t);
    if (uWorkMode == 2) return modeWorkIndex(p, t);
    return modeWorkSpread(p, t);
  }

  vec3 modeContact(vec2 p, float t) {
    float halfCF = uCrossfadeWidth * 0.5;
    float workMid = (uWorkExit.x + uWorkExit.y) * 0.5;
    float winStart = workMid - halfCF;
    float winMid   = mix(winStart, 1.0, 0.7);
    float winEnd   = 1.0;
    float t1 = smoothstep(winStart, winMid, uScroll);
    float t2 = smoothstep(winMid, winEnd, uScroll);
    float offset = mix(mix(uContactOffsetIdle, uContactOffsetPeak, t1), uContactOffsetExit, t2);

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

  // Universal interaction warp. Transforms the fragment lookup coord based
  // on cursor position so every module mode (Hero/About/Work/Contact)
  // inherits the same disturbance vocabulary without per-mode code edits.
  // Modes are unaware they're being driven — they just see a deformed p.
  vec2 applyInteraction(vec2 p) {
    if (uInteractionMode == 0) return p;
    vec2 mouseP = uMouse - uModuleCenter;
    mouseP.x *= uResolution.x / uResolution.y;
    vec2 d = p - mouseP;
    float d2 = dot(d, d);
    float fall = exp(-d2 / max(uInteractionRadius * uInteractionRadius, 1e-4));
    if (uInteractionMode == 1) {
      return p - d * fall * uInteractionStrength;
    } else if (uInteractionMode == 2) {
      return p + d * fall * uInteractionStrength;
    } else if (uInteractionMode == 3) {
      float angle = fall * uInteractionStrength * 1.5708;
      float ca = cos(angle);
      float sa = sin(angle);
      return mouseP + mat2(ca, -sa, sa, ca) * d;
    } else if (uInteractionMode == 4) {
      float dist = sqrt(d2 + 1e-6);
      return p + (d / dist) * sin(dist * uInteractionFreq - uTime * 2.0) * fall * uInteractionStrength * 0.05;
    } else if (uInteractionMode == 5) {
      return mouseP + d * (1.0 - fall * uInteractionStrength);
    }
    return p;
  }

  vec3 sRGBEncode(vec3 c) {
    vec3 cutoff = vec3(lessThanEqual(c, vec3(0.0031308)));
    vec3 lower = c * 12.92;
    vec3 higher = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, cutoff);
  }

  void main() {
    // Anchor module-centered content to the visible slot's center, not the
    // canvas center. The canvas is now full-viewport with clip-path masking
    // the visible region, so without this offset the Hero SDF moon would
    // render at viewport-center and the right-half clip would only reveal
    // its left edge.
    vec2 p = vUv - uModuleCenter;
    p.x *= uResolution.x / uResolution.y;
    p = applyInteraction(p);

    if (uDebugMode == 1) { gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0); return; }
    if (uDebugMode == 2) { gl_FragColor = vec4(uScroll, 1.0 - uScroll, 0.0, 1.0); return; }

    float s = uScroll;
    float halfCF = uCrossfadeWidth * 0.5;
    float heroMid = (uHeroExit.x + uHeroExit.y) * 0.5;
    float aboutMid = (uAboutExit.x + uAboutExit.y) * 0.5;
    float workMid = (uWorkExit.x + uWorkExit.y) * 0.5;
    float heroExit = linstep(heroMid - halfCF, heroMid + halfCF, s);
    float aboutExit = linstep(aboutMid - halfCF, aboutMid + halfCF, s);
    float workExit = linstep(workMid - halfCF, workMid + halfCF, s);
    float wHero    = 1.0 - heroExit;
    float wAbout   = heroExit * (1.0 - aboutExit);
    float wWork    = aboutExit * (1.0 - workExit);
    float wContact = workExit;

    if (uDebugMode == 3) { gl_FragColor = vec4(wHero, wAbout, wWork + wContact, 1.0); return; }
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
  uModuleCenter: { value: [0.75, 0.5] as [number, number] },

  uHeroExit: {
    value: [MODULE_WINDOWS.hero.exitStart, MODULE_WINDOWS.hero.exitEnd] as [number, number],
  },
  uAboutExit: {
    value: [MODULE_WINDOWS.about.exitStart, MODULE_WINDOWS.about.exitEnd] as [number, number],
  },
  uWorkExit: {
    value: [MODULE_WINDOWS.work.exitStart, MODULE_WINDOWS.work.exitEnd] as [number, number],
  },

  uHeroRingThickness: { value: 0.01 },
  uHeroShapeRadius: { value: 0.3 },
  uHeroWarpScale: { value: 1.0 / 4.5 },
  uHeroWarpSpeed: { value: 0.12 },
  uHeroWarpBase: { value: 0.015 },
  uHeroWarpPeak: { value: 0.1 },
  uHeroRotRate: { value: 0.5 },

  uAboutGridScale: { value: 14.0 },
  uAboutStrokeWidth: { value: 0.07 },
  uAboutRadialCenter: { value: [-0.35, 0.0] as [number, number] },
  uAboutStaggerStrength: { value: 0.3 },
  uAboutWaveAmp: { value: 0.05 },
  uAboutRotRate: { value: 0.1 },

  uWorkMode: { value: 0 },

  uWorkGridCols: { value: 11.0 },
  uWorkGridRows: { value: 8.0 },
  uWorkCardPadding: { value: 0.12 },
  uWorkStrokeWidth: { value: 0.04 },
  uWorkRadialCenter: { value: [-0.5, 0.5] as [number, number] },
  uWorkStaggerStrength: { value: 0.61 },
  uWorkRotRate: { value: 0.53 },
  uWorkDotSize: { value: 2.0 },

  uWorkBarCount: { value: 40.0 },
  uWorkBarGap: { value: 0.07 },
  uWorkBaseHeight: { value: 0.47 },
  uWorkVarianceIdle: { value: 0.31 },
  uWorkVariancePeak: { value: 0.6 },
  uWorkVarianceExit: { value: 0.45 },
  uWorkBreathSpeed: { value: 0.46 },

  uWorkCardSize: { value: 0.34 },
  uWorkRingThickness: { value: 0.008 },
  uWorkWarpScale: { value: 1.4 },
  uWorkWarpSpeed: { value: 0.18 },
  uWorkWarpBase: { value: 0.005 },
  uWorkWarpPeak: { value: 0.06 },
  uWorkSubGridDensity: { value: 9.0 },

  uContactStripeScale: { value: 19.0 },
  uContactLineWidth: { value: 0.08 },
  uContactRotSpeed: { value: 0.01 },
  uContactOffsetIdle: { value: 0.18 },
  uContactOffsetPeak: { value: 0.0 },
  uContactOffsetExit: { value: 0.0 },

  uVignette: { value: 0.55 },
  uCrossfadeWidth: { value: 0.03 },
  uDebugMode: { value: 0 },

  uMouse: { value: [0.5, 0.5] as [number, number] },
  uInteractionMode: { value: 1 },
  uInteractionStrength: { value: 1.03 },
  uInteractionRadius: { value: 0.13 },
  uInteractionFreq: { value: 8.5 },
};

export default function BackgroundField() {
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
    Interaction: folder(
      {
        interactionMode: {
          value: 1,
          options: { Off: 0, Magnet: 1, Repel: 2, Swirl: 3, Ripple: 4, Lens: 5 },
          label: 'mode',
        },
        interactionStrength: { value: 1.03, min: 0, max: 2.0, step: 0.01, label: 'strength' },
        interactionRadius: { value: 0.13, min: 0.05, max: 1.5, step: 0.01, label: 'radius' },
        interactionFreq: { value: 8.5, min: 2, max: 60, step: 0.5, label: 'ripple freq' },
      },
      { collapsed: false },
    ),
    Hero: folder(
      {
        heroPreset: {
          value: 'Switchback',
          options: HERO_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = HERO_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        heroRingThickness: { value: 0.01, min: 0.002, max: 0.2, step: 0.001 },
        heroShapeRadius: { value: 0.3, min: 0.1, max: 0.9, step: 0.005 },
        heroDisturbanceLength: { value: 4.5, min: 0.2, max: 12.0, step: 0.05 },
        heroWarpSpeed: { value: 0.12, min: 0.0, max: 1.5, step: 0.01 },
        ShapeArc: folder(
          {
            heroWarpBase: { value: 0.015, min: 0.0, max: 0.4, step: 0.005 },
            heroWarpPeak: { value: 0.1, min: 0.0, max: 0.5, step: 0.005 },
            heroRotRate: { value: 0.5, min: -3.14, max: 3.14, step: 0.01 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: false },
    ),
    About: folder(
      {
        aboutPreset: {
          value: 'Ridgeline',
          options: ABOUT_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = ABOUT_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        aboutGridScale: { value: 14.0, min: 1.0, max: 60.0, step: 0.5 },
        aboutStrokeWidth: { value: 0.07, min: 0.01, max: 0.3, step: 0.005 },
        AboutMorph: folder(
          {
            aboutRadialCenter: { value: [-0.35, 0.0] as [number, number], step: 0.05 },
            aboutStaggerStrength: { value: 0.3, min: 0.0, max: 1.0, step: 0.01 },
            aboutWaveAmp: { value: 0.05, min: 0.0, max: 0.3, step: 0.005 },
            aboutRotRate: { value: 0.1, min: -1.0, max: 1.0, step: 0.01 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: true },
    ),
    Work: folder(
      {
        workPreset: {
          value: 'Spread',
          options: WORK_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = WORK_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        workMode: {
          value: 0,
          options: { Spread: 0, Stack: 1, Index: 2 },
          label: 'mode',
        },
        WorkSpread: folder(
          {
            workGridCols: { value: 11, min: 2, max: 16, step: 1 },
            workGridRows: { value: 8, min: 1, max: 12, step: 1 },
            workCardPadding: { value: 0.12, min: 0.0, max: 0.3, step: 0.005 },
            workStrokeWidth: { value: 0.04, min: 0.002, max: 0.08, step: 0.001 },
            workRadialCenter: { value: [-0.5, 0.5] as [number, number], step: 0.05 },
            workStaggerStrength: { value: 0.61, min: 0.0, max: 1.0, step: 0.01 },
            workRotRate: { value: 0.53, min: -1.5, max: 1.5, step: 0.01 },
            workDotSize: { value: 2.0, min: 0.3, max: 5.0, step: 0.05, label: 'dot size' },
          },
          { collapsed: true },
        ),
        WorkStack: folder(
          {
            workBarCount: { value: 40, min: 6, max: 120, step: 1 },
            workBarGap: { value: 0.07, min: 0.0, max: 0.45, step: 0.01 },
            workBaseHeight: { value: 0.47, min: 0.05, max: 0.95, step: 0.01 },
            workVarianceIdle: { value: 0.31, min: 0.0, max: 0.8, step: 0.01 },
            workVariancePeak: { value: 0.6, min: 0.0, max: 0.8, step: 0.01 },
            workVarianceExit: { value: 0.45, min: 0.0, max: 0.8, step: 0.01 },
            workBreathSpeed: { value: 0.46, min: 0.0, max: 2.0, step: 0.01 },
          },
          { collapsed: true },
        ),
        WorkIndex: folder(
          {
            workCardSize: { value: 0.34, min: 0.1, max: 0.6, step: 0.005 },
            workRingThickness: { value: 0.008, min: 0.001, max: 0.05, step: 0.001 },
            workWarpScale: { value: 1.4, min: 0.2, max: 6.0, step: 0.05 },
            workWarpSpeed: { value: 0.18, min: 0.0, max: 1.5, step: 0.01 },
            workWarpBase: { value: 0.005, min: 0.0, max: 0.3, step: 0.005 },
            workWarpPeak: { value: 0.06, min: 0.0, max: 0.4, step: 0.005 },
            workSubGridDensity: { value: 9, min: 2, max: 30, step: 0.5 },
          },
          { collapsed: true },
        ),
      },
      { collapsed: true },
    ),
    Contact: folder(
      {
        contactPreset: {
          value: 'Crossing',
          options: CONTACT_PRESET_NAMES,
          label: 'preset',
          onChange: (name: string, _path: string, _ctx: { initial: boolean }) => {
            if (!setRef.current) return;
            const preset = CONTACT_PRESETS[name];
            if (preset) setRef.current(preset);
          },
        },
        contactStripeScale: { value: 19, min: 2.0, max: 80.0, step: 0.5 },
        contactLineWidth: { value: 0.08, min: 0.02, max: 0.5, step: 0.005 },
        contactRotSpeed: { value: 0.01, min: 0.0, max: 0.6, step: 0.005 },
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
        crossfadeWidth: { value: 0.03, min: 0.0, max: 0.16, step: 0.005, label: 'crossfade' },
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

  useEffect(() => {
    setRef.current = set as (values: Record<string, unknown>) => void;
  }, [set]);

  useEffect(() => {
    uniforms.uHeroRingThickness.value = controls.heroRingThickness;
    uniforms.uHeroShapeRadius.value = controls.heroShapeRadius;
    uniforms.uHeroWarpScale.value = 1.0 / Math.max(controls.heroDisturbanceLength, 0.0001);
    uniforms.uHeroWarpSpeed.value = controls.heroWarpSpeed;
    uniforms.uHeroWarpBase.value = controls.heroWarpBase;
    uniforms.uHeroWarpPeak.value = controls.heroWarpPeak;
    uniforms.uHeroRotRate.value = controls.heroRotRate;

    uniforms.uAboutGridScale.value = controls.aboutGridScale;
    uniforms.uAboutStrokeWidth.value = controls.aboutStrokeWidth;
    uniforms.uAboutRadialCenter.value = controls.aboutRadialCenter as [number, number];
    uniforms.uAboutStaggerStrength.value = controls.aboutStaggerStrength;
    uniforms.uAboutWaveAmp.value = controls.aboutWaveAmp;
    uniforms.uAboutRotRate.value = controls.aboutRotRate;

    uniforms.uWorkMode.value = controls.workMode;

    uniforms.uWorkGridCols.value = controls.workGridCols;
    uniforms.uWorkGridRows.value = controls.workGridRows;
    uniforms.uWorkCardPadding.value = controls.workCardPadding;
    uniforms.uWorkStrokeWidth.value = controls.workStrokeWidth;
    uniforms.uWorkRadialCenter.value = controls.workRadialCenter as [number, number];
    uniforms.uWorkStaggerStrength.value = controls.workStaggerStrength;
    uniforms.uWorkRotRate.value = controls.workRotRate;
    uniforms.uWorkDotSize.value = controls.workDotSize;

    uniforms.uWorkBarCount.value = controls.workBarCount;
    uniforms.uWorkBarGap.value = controls.workBarGap;
    uniforms.uWorkBaseHeight.value = controls.workBaseHeight;
    uniforms.uWorkVarianceIdle.value = controls.workVarianceIdle;
    uniforms.uWorkVariancePeak.value = controls.workVariancePeak;
    uniforms.uWorkVarianceExit.value = controls.workVarianceExit;
    uniforms.uWorkBreathSpeed.value = controls.workBreathSpeed;

    uniforms.uWorkCardSize.value = controls.workCardSize;
    uniforms.uWorkRingThickness.value = controls.workRingThickness;
    uniforms.uWorkWarpScale.value = controls.workWarpScale;
    uniforms.uWorkWarpSpeed.value = controls.workWarpSpeed;
    uniforms.uWorkWarpBase.value = controls.workWarpBase;
    uniforms.uWorkWarpPeak.value = controls.workWarpPeak;
    uniforms.uWorkSubGridDensity.value = controls.workSubGridDensity;

    uniforms.uContactStripeScale.value = controls.contactStripeScale;
    uniforms.uContactLineWidth.value = controls.contactLineWidth;
    uniforms.uContactRotSpeed.value = controls.contactRotSpeed;
    uniforms.uContactOffsetIdle.value = controls.contactOffsetIdle;
    uniforms.uContactOffsetPeak.value = controls.contactOffsetPeak;
    uniforms.uContactOffsetExit.value = controls.contactOffsetExit;

    uniforms.uVignette.value = controls.vignette;
    uniforms.uCrossfadeWidth.value = controls.crossfadeWidth;
    uniforms.uDebugMode.value = controls.debugMode;

    uniforms.uInteractionMode.value = controls.interactionMode;
    uniforms.uInteractionStrength.value = controls.interactionStrength;
    uniforms.uInteractionRadius.value = controls.interactionRadius;
    uniforms.uInteractionFreq.value = controls.interactionFreq;

    // Mirror to the scene store so LetterFillField reads the same values
    // and the Leva folder here is the single source of truth.
    useSceneStore
      .getState()
      .setInteraction(
        controls.interactionMode,
        controls.interactionStrength,
        controls.interactionRadius,
        controls.interactionFreq,
      );
  }, [controls]);

  // Read scroll directly per frame — the wrapper rect, scroll dispatch, and
  // canvasSlot() interpolation are already smooth, and uResolution is updated
  // unconditionally below. A second damping layer on uScroll only created
  // phase mismatch with uResolution (visible as grid-cell staircase during
  // wrapper resize). Tight 1:1 tracking keeps morph weights and aspect-driven
  // shader logic on the same frame cadence.
  useFrame((state) => {
    const store = useSceneStore.getState();
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = store.scrollProgress;
    uniforms.uResolution.value = [state.size.width, state.size.height];
    uniforms.uModuleCenter.value = store.slotCenter;

    // Exponential lerp toward the mouseTarget written by HomeSceneRoot's
    // pointermove listener. 0.08 is the canonical r3f cursor-damping factor
    // (~8-frame half-life at 60fps) — kills sub-pixel jitter without
    // visible lag on the warped p-coord.
    const target = store.mouseTarget;
    const m = uniforms.uMouse.value;
    m[0] += (target[0] - m[0]) * 0.08;
    m[1] += (target[1] - m[1]) * 0.08;
  });

  return (
    <ScreenQuad renderOrder={-10}>
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
