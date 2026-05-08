'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { button, folder, useControls } from 'leva';
import { useEffect, useRef } from 'react';
import { type ShaderMaterial, Vector2 } from 'three';
import { useSceneStore } from '@/lib/useSceneStore';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform int   uIndex;
  uniform float uWeight;

  // 0 — Mission Bell: halftone (V0), concentric op-art (V1), constructivist glyphs (V2).
  uniform int   uMBVariant;
  uniform vec2  uMBFocal;
  uniform float uMBDotPitch;
  uniform float uMBCoreRadius;
  uniform float uMBStippleJitter;
  uniform float uMBBurstWedges;
  uniform float uMBBurstDuty;
  uniform float uMBWedgeAngle;
  uniform float uMBWedgeSoftness;
  uniform float uMBHaloRadius;
  uniform float uMBHaloWidth;
  uniform float uMBCycles;
  uniform float uMBIdleDrift;
  uniform float uMBWhooshGain;

  // 1 — New Belgium: chronograph (V0), industrial caliper (V1), cartographic atlas (V2).
  uniform int   uNBVariant;
  uniform vec2  uNBFocal;
  uniform float uNBStroke;
  uniform float uNBRingRadius;
  uniform float uNBRingInner;
  uniform float uNBGapHalfAngle;
  uniform float uNBSpokeCount;
  uniform float uNBBarCount;
  uniform float uNBBarAmpMax;
  uniform float uNBLogBase;
  uniform float uNBSpiralPitch;
  uniform float uNBSpiralTurns;
  uniform float uNBCycles;
  uniform float uNBIdleDrift;
  uniform float uNBWhooshGain;

  // 2 — Consume & Create: scalar wave field (1-bit, 4 keypoints).
  uniform vec2  uCCSourceA;
  uniform vec2  uCCSourceB;
  uniform float uCCFreq;
  uniform float uCCPropAngle;
  uniform float uCCChirp;
  uniform float uCCChirpTilt;
  uniform float uCCCycles;
  uniform float uCCIdlePhase;
  uniform float uCCWhooshGain;

  // 3 — CraftedKit: Truchet tessellation (1-bit, 4 keypoints).
  uniform vec2  uCKFocal;
  uniform float uCKStroke;
  uniform float uCKCellSize;
  uniform float uCKArcRadius;
  uniform float uCKGridTilt;
  uniform vec2  uCKFocalCell;
  uniform float uCKCycles;
  uniform float uCKIdleDrift;
  uniform float uCKWhooshGain;

  varying vec2 vUv;

  // ---- Hash helpers (used by MB dot jitter and CK cell hashing). ----
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  // ---- Linger-then-whoosh easing — mirrors BackgroundField.tsx:138,144. ----
  float linger(float lt) { return smoothstep(0.15, 0.85, lt); }
  float tent(float lt)   { return smoothstep(0.0, 0.5, lt) * smoothstep(1.0, 0.5, lt); }

  // ---- Shared morph machinery: branchless segment select + softmin blend. ----
  // Used by all four modes; expects one scalar per keypoint and returns the
  // 1-bit-thresholdable scalar (SDF for distance fields, wave for CC).
  float morphSegment(float d0, float d1, float d2, float d3,
                     float lt, float i, float kSoft) {
    float m0 = step(i, 0.5);
    float m1 = step(0.5, i) * step(i, 1.5);
    float m2 = step(1.5, i) * step(i, 2.5);
    float m3 = step(2.5, i);
    float dA = m0 * d0 + m1 * d1 + m2 * d2 + m3 * d3;
    float dB = m0 * d1 + m1 * d2 + m2 * d3 + m3 * d0;
    float morphMix = linger(lt);
    float ta       = tent(lt);
    float k = max(kSoft, 1e-4);
    float h = clamp(0.5 + 0.5 * (dB - dA) / k, 0.0, 1.0);
    float dSoft = mix(dB, dA, h) - k * h * (1.0 - h);
    float dEnd  = mix(dA, dB, morphMix);
    return mix(dEnd, dSoft, ta);
  }

  // ============================================================
  // 0 — Mission Bell: halftone / Risograph / Sister Corita Kent.
  //   K0 stipple core   K1 12-wedge burst   K2 diagonal halftone   K3 halo aureole
  // Single ordered dot lattice, four mask functions decide dot radius.
  // ============================================================
  float dotMask(vec2 p, float pitch, float radius, float jitter, float t) {
    vec2 cell  = floor(p / pitch);
    vec2 local = (fract(p / pitch) - 0.5) * pitch;
    vec2 wob   = (hash22(cell) - 0.5) * jitter * pitch;
    return length(local + wob * sin(t + cell.x * 1.3)) - radius;
  }
  float mbStipple(vec2 p, float pitch, float coreR, float jit, float t) {
    float d     = dotMask(p, pitch, 0.30 * pitch, jit, t);
    float voidR = coreR - length(p);
    return max(d, -voidR);
  }
  float mbBurst(vec2 p, float pitch, float wedges, float duty, float jit, float t) {
    float ang = atan(p.y, p.x);
    float w   = abs(fract(ang / 6.28318531 * wedges + 0.5) - 0.5) * 2.0;
    float r   = mix(0.05, 0.45, smoothstep(duty, 0.0, w)) * pitch;
    return dotMask(p, pitch, r, jit, t);
  }
  float mbWedge(vec2 p, float pitch, float angle, float soft, float jit, float t) {
    vec2  axis = vec2(cos(angle), sin(angle));
    float u    = dot(p, axis);
    float r    = mix(0.48, 0.02, smoothstep(-soft, soft, u)) * pitch;
    return dotMask(p, pitch, r, jit, t);
  }
  float mbHalo(vec2 p, float pitch, float r0, float w, float jit, float t) {
    float rho  = length(p);
    float bell = exp(-pow((rho - r0) / max(w, 1e-3), 2.0));
    float r    = mix(0.05, 0.46, bell) * pitch;
    return dotMask(p, pitch, r, jit, t);
  }

  vec3 modeMissionBell(vec2 cuv) {
    vec2 p = cuv - uMBFocal;
    float idle = uTime * uMBIdleDrift;
    float ca = cos(idle), sa = sin(idle);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uMBCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float jit = uMBStippleJitter;
    float pit = uMBDotPitch;
    float t   = uTime * 0.6;

    float d0 = mbStipple(p, pit, uMBCoreRadius, jit, t);
    float d1 = mbBurst(p, pit, uMBBurstWedges, uMBBurstDuty, jit, t);
    float d2 = mbWedge(p, pit, uMBWedgeAngle, uMBWedgeSoftness, jit, t);
    float d3 = mbHalo(p, pit, uMBHaloRadius, uMBHaloWidth, jit, t);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uMBWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  // ============================================================
  // 0.A — Mission Bell V1: Concentric Op-Art (Riley rings around focal).
  //   K0 concentric rings   K1 chevron-pie of arcs   K2 spiral coupling   K3 dual-focus moiré
  // ============================================================
  float sdRings(float rho, float pitch, float halfW) {
    float u = rho / max(pitch, 1e-4);
    float dist = (0.5 - abs(fract(u) - 0.5)) * pitch;
    return dist - halfW;
  }
  float mbV1_K0(vec2 p, float pitch, float halfW, float clampR) {
    float rho = length(p);
    float d = sdRings(rho, pitch, halfW);
    return max(d, rho - clampR);
  }
  float mbV1_K1(vec2 p, float pitch, float halfW, float wedgesF, float duty, float clampR) {
    float rho   = length(p);
    float d     = sdRings(rho, pitch, halfW);
    float wC    = max(wedgesF, 1.0);
    float ang   = atan(p.y, p.x);
    float seg   = 6.28318531 / wC;
    float wAng  = mod(ang + seg * 0.5, seg) - seg * 0.5;
    float wHalf = duty * 0.5 * seg;
    float slat  = (abs(wAng) - wHalf) * max(rho, 1e-3);
    return max(max(d, slat), rho - clampR);
  }
  float mbV1_K2(vec2 p, float pitch, float halfW, float twist, float clampR) {
    float rho   = length(p);
    float ang   = atan(p.y, p.x);
    float phase = rho - twist * pitch * ang * 0.15915494;
    float u     = phase / max(pitch, 1e-4);
    float dist  = (0.5 - abs(fract(u) - 0.5)) * pitch;
    return max(dist - halfW, rho - clampR);
  }
  float mbV1_K3(vec2 p, float pitch, float halfW, float offset, float clampR) {
    vec2  a  = vec2(-offset * 0.5, 0.0);
    vec2  b  = vec2( offset * 0.5, 0.0);
    float dA = sdRings(length(p - a), pitch, halfW);
    float dB = sdRings(length(p - b), pitch, halfW);
    return max(min(dA, dB), length(p) - clampR);
  }

  vec3 modeMissionBellV1(vec2 cuv) {
    vec2 p = cuv - uMBFocal;
    float idle = uTime * uMBIdleDrift;
    float ca = cos(idle), sa = sin(idle);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uMBCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float pit    = uMBDotPitch * 2.5;
    float halfW  = uMBCoreRadius * 0.5;
    float clampR = uMBHaloRadius * 1.4;

    float d0 = mbV1_K0(p, pit, halfW, clampR);
    float d1 = mbV1_K1(p, pit, halfW, uMBBurstWedges, uMBBurstDuty, clampR);
    float d2 = mbV1_K2(p, pit, halfW, uMBWedgeAngle, clampR);
    float d3 = mbV1_K3(p, pit, halfW, uMBWedgeSoftness, clampR);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uMBWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  // ============================================================
  // 0.B — Mission Bell V2: Constructivist Glyphs (orthogonal bars, nested rects).
  //   K0 orthogonal lattice   K1 oblique chevron stripes   K2 nested rect frames   K3 stacked slabs
  // ============================================================
  float sdRect(vec2 p, vec2 halfSize) {
    vec2 d = abs(p) - halfSize;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }
  float sdStripes1D(float u, float pitch, float halfW) {
    float dist = (0.5 - abs(fract(u / max(pitch, 1e-4)) - 0.5)) * pitch;
    return dist - halfW;
  }
  float mbV2_K0(vec2 p, float pitch, float halfW, float extent) {
    float h = sdStripes1D(p.x, pitch, halfW);
    float v = sdStripes1D(p.y, pitch, halfW);
    return max(min(h, v), sdRect(p, vec2(extent)));
  }
  float mbV2_K1(vec2 p, float pitch, float halfW, float wedgesF, float duty, float angle, float extent) {
    vec2  axis     = vec2(cos(angle), sin(angle));
    vec2  perp     = vec2(-axis.y, axis.x);
    float u        = dot(p, perp);
    float effPitch = pitch * (8.0 / max(wedgesF, 1.0));
    float thick    = halfW * mix(0.6, 1.4, duty);
    return max(sdStripes1D(u, effPitch, thick), sdRect(p, vec2(extent)));
  }
  float mbV2_K2(vec2 p, float halfW, float countF, float extent) {
    int   count = int(clamp(countF, 1.0, 16.0));
    float d     = 1.0;
    for (int n = 0; n < 16; n++) {
      if (n >= count) break;
      float t = (float(n) + 0.5) / float(count);
      float r = extent * (1.0 - t * 0.85);
      float frame = abs(sdRect(p, vec2(r))) - halfW;
      d = min(d, frame);
    }
    return d;
  }
  float mbV2_K3(vec2 p, float pitch, float halfW, float thickMul, float extent, float jit) {
    float d = 1.0;
    for (int k = 0; k < 8; k++) {
      float kf  = float(k);
      float yc  = (kf - 3.5) * pitch;
      vec2  h2  = hash22(vec2(0.0, kf) + 7.0);
      float len = mix(0.45, extent, h2.x);
      float xc  = (h2.y - 0.5) * (extent - len) * 2.0 * jit;
      vec2  q   = p - vec2(xc, yc);
      d = min(d, sdRect(q, vec2(len, halfW * thickMul)));
    }
    return max(d, sdRect(p, vec2(extent)));
  }

  vec3 modeMissionBellV2(vec2 cuv) {
    vec2 p = cuv - uMBFocal;
    float idle = uTime * uMBIdleDrift;
    float ca = cos(idle), sa = sin(idle);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uMBCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float pit    = uMBDotPitch * 3.0;
    float halfW  = uMBCoreRadius * 0.6;
    float extent = uMBHaloRadius * 1.4;

    float d0 = mbV2_K0(p, pit, halfW, extent);
    float d1 = mbV2_K1(p, pit, halfW, uMBBurstWedges, uMBBurstDuty, uMBWedgeAngle, extent);
    float d2 = mbV2_K2(p, halfW, uMBWedgeSoftness * 16.0, extent);
    float d3 = mbV2_K3(p, pit, halfW, uMBHaloWidth * 4.0, extent, uMBStippleJitter);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uMBWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  // ============================================================
  // 1 — New Belgium: Swiss/Bauhaus radial chronograph.
  //   K0 open ring + 12 ticks   K1 16 spokes   K2 32-bar histogram   K3 log spiral
  // ============================================================
  float sdPolarBar(vec2 p, float a, float r0, float r1, float halfW) {
    float c = cos(-a), s = sin(-a);
    vec2 q = mat2(c, -s, s, c) * p;
    vec2 b = vec2((r1 - r0) * 0.5, halfW);
    vec2 d = abs(q - vec2((r0 + r1) * 0.5, 0.0)) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }
  float sdRingOpen(vec2 p, float r, float halfThick, float gapHalf) {
    float ringD = abs(length(p) - r) - halfThick;
    float a     = atan(p.y, p.x);
    float gateD = (3.14159265 - abs(a)) - gapHalf;
    return max(ringD, -gateD);
  }
  float sdLogSpiral(vec2 p, float aBase, float b, float halfW, float turns) {
    float r        = max(length(p), 1e-4);
    float theta    = atan(p.y, p.x);
    float idealTh  = log(r / aBase) / max(b, 1e-4);
    float dTheta   = mod(theta - idealTh + 3.14159265, 6.28318531) - 3.14159265;
    float arcDist  = abs(dTheta) * r / sqrt(1.0 + b * b);
    float rMax     = aBase * exp(b * turns * 6.28318531);
    float radClip  = max(aBase - r, r - rMax);
    return max(arcDist - halfW, radClip);
  }
  float nbRingWithTicks(vec2 p, float r, float w, float gapHalf) {
    float dRing  = sdRingOpen(p, r, w, gapHalf);
    float dTicks = 1.0;
    for (int k = 0; k < 12; k++) {
      float a = float(k) * 6.28318531 / 12.0;
      dTicks = min(dTicks, sdPolarBar(p, a, r, r + 0.025, w));
    }
    return min(dRing, dTicks);
  }
  float nbSpokeRing(vec2 p, float r0, float r1, float w, float countF) {
    float d = 1.0;
    int count = int(countF + 0.5);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float a = float(k) * 6.28318531 / countF;
      d = min(d, sdPolarBar(p, a, r0, r1, w));
    }
    return d;
  }
  float nbPolarBars(vec2 p, float r0, float ampMax, float logBase, float w, float countF) {
    float d = 1.0;
    int count = int(countF + 0.5);
    float lb    = max(log(logBase), 1e-3);
    float denom = max(log(8.0) / lb, 1e-3);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float kk  = mod(float(k), 8.0);
      float amp = (log(1.0 + kk) / lb) / denom;
      float r1  = r0 + ampMax * amp;
      float a   = float(k) * 6.28318531 / countF;
      d = min(d, sdPolarBar(p, a, r0, r1, w));
    }
    return d;
  }

  vec3 modeNewBelgium(vec2 cuv) {
    vec2 p = cuv - uNBFocal;
    float idle = uTime * uNBIdleDrift;
    float ca = cos(idle), sa = sin(idle);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uNBCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float d0 = nbRingWithTicks(p, uNBRingRadius, uNBStroke, uNBGapHalfAngle);
    float d1 = nbSpokeRing(p, uNBRingInner, uNBRingRadius, uNBStroke, uNBSpokeCount);
    float d2 = nbPolarBars(p, uNBRingInner, uNBBarAmpMax, uNBLogBase, uNBStroke, uNBBarCount);
    float bNat = log(uNBRingRadius / max(uNBRingInner, 1e-3)) /
                 max(uNBSpiralTurns * 6.28318531, 1e-3);
    float d3 = sdLogSpiral(p, max(uNBRingInner, 1e-3), bNat * uNBSpiralPitch,
                           uNBStroke, uNBSpiralTurns);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uNBWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  // ============================================================
  // 1.A — New Belgium V1: Industrial Caliper (cog wheel, jaws, reticle, sprocket).
  //   K0 cog wheel   K1 caliper jaws   K2 crosshair reticle   K3 sprocket
  // ============================================================
  float nbV1_K0(vec2 p, float r, float w, float countF, float toothH, float duty) {
    float ring = abs(length(p) - r) - w;
    float halfW = (3.14159265 * r / max(countF, 1.0)) * clamp(duty, 0.1, 0.9);
    float teeth = 1.0;
    int count = int(countF + 0.5);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float a = float(k) * 6.28318531 / max(countF, 1.0);
      teeth = min(teeth, sdPolarBar(p, a, r, r + toothH, halfW));
    }
    return min(ring, teeth);
  }
  float nbV1_K1(vec2 p, float rOut, float rIn, float w, float openHalf) {
    float aOut = atan(p.y, p.x) - 1.5707963;
    aOut = mod(aOut + 3.14159265, 6.28318531) - 3.14159265;
    float dRingOut  = abs(length(p) - rOut) - w;
    float gateOut   = (3.14159265 - abs(aOut)) - openHalf;
    float cOut      = max(dRingOut, -gateOut);
    float aIn = atan(p.y, p.x) + 1.5707963;
    aIn = mod(aIn + 3.14159265, 6.28318531) - 3.14159265;
    float dRingIn = abs(length(p) - rIn) - w;
    float gateIn  = (3.14159265 - abs(aIn)) - openHalf;
    float cIn     = max(dRingIn, -gateIn);
    return min(cOut, cIn);
  }
  float nbV1_K2(vec2 p, float rOuter, float rInnerFactor, float w) {
    float frame   = rOuter * 1.05;
    float crossH  = max(abs(p.y) - w, abs(p.x) - frame);
    float crossV  = max(abs(p.x) - w, abs(p.y) - frame);
    float cross   = min(crossH, crossV);
    float ring1   = abs(length(p) - rOuter) - w;
    float ring2   = abs(length(p) - rOuter * clamp(rInnerFactor, 0.2, 0.9)) - w;
    return min(cross, min(ring1, ring2));
  }
  float nbV1_K3(vec2 p, float r0, float toothLen, float w, float countF) {
    float ring = abs(length(p) - r0) - w;
    float halfW = (3.14159265 * r0 / max(countF, 1.0)) * 0.45;
    float teeth = 1.0;
    int count = int(countF + 0.5);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float a = float(k) * 6.28318531 / max(countF, 1.0);
      teeth = min(teeth, sdPolarBar(p, a, r0, r0 + toothLen, halfW));
    }
    return min(ring, teeth);
  }

  vec3 modeNewBelgiumV1(vec2 cuv) {
    vec2 p = cuv - uNBFocal;
    float idle = uTime * uNBIdleDrift;
    float ca = cos(idle), sa = sin(idle);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uNBCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float toothH    = clamp(uNBBarAmpMax * 0.18, 0.015, 0.08);
    float pinionLen = clamp(uNBBarAmpMax * 0.35, 0.03, 0.18);

    float d0 = nbV1_K0(p, uNBRingRadius, uNBStroke, uNBSpokeCount, toothH, uNBLogBase * 0.25);
    float d1 = nbV1_K1(p, uNBRingRadius, max(uNBRingInner + 0.04, 0.06), uNBStroke,
                       clamp(uNBGapHalfAngle * 4.0, 0.2, 1.4));
    float d2 = nbV1_K2(p, uNBRingRadius * 0.9, uNBSpiralPitch * 0.5, uNBStroke);
    float d3 = nbV1_K3(p, max(uNBRingInner + 0.04, 0.06), pinionLen, uNBStroke * 1.1, uNBBarCount);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uNBWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  // ============================================================
  // 1.B — New Belgium V2: Cartographic Atlas (contours, dipole, compass, coastline).
  //   K0 log-spaced contours   K1 dipole isobars   K2 windrose   K3 sinuous coastline
  // ============================================================
  float nbV2_K0(vec2 p, float rOut, float rIn, float w, float countF, float logBase) {
    float r = length(p);
    float dMin = 1.0;
    int count = int(countF + 0.5);
    float ratio = max(rOut / max(rIn, 1e-3), 1.05);
    float gamma = clamp(log(logBase) / log(2.0), 0.4, 1.6);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float t  = float(k) / max(float(count - 1), 1.0);
      float te = pow(t, gamma);
      float rk = rIn * pow(ratio, te);
      dMin = min(dMin, abs(r - rk) - w);
    }
    return dMin;
  }
  float nbV2_K1(vec2 p, vec2 fA, vec2 fB, float rOut, float w, float countF, float strength) {
    float dA = length(p - fA);
    float dB = length(p - fB);
    float warp = strength * (1.0 / (0.18 + dA * dA) - 1.0 / (0.18 + dB * dB));
    float r    = length(p) + warp;
    float dMin = 1.0;
    int count = int(countF + 0.5);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float t  = float(k + 1) / float(count + 1);
      float rk = rOut * t;
      dMin = min(dMin, abs(r - rk) - w);
    }
    return dMin;
  }
  float nbV2_K2(vec2 p, float rShort, float rLong, float w, float countF) {
    float d = 1.0;
    int count = int(countF + 0.5);
    for (int k = 0; k < 64; k++) {
      if (k >= count) break;
      float a   = float(k) * 6.28318531 / max(countF, 1.0);
      float odd = mod(float(k), 2.0);
      float r1  = mix(rShort, rLong, step(0.5, odd));
      d = min(d, sdPolarBar(p, a, 0.015, r1, w));
    }
    float dot = length(p) - rShort * 0.18;
    return min(d, dot);
  }
  float nbV2_K3(vec2 p, float R, float amp, float lobesF, float w) {
    float r  = max(length(p), 1e-4);
    float th = atan(p.y, p.x);
    float perturb = amp * sin(lobesF * th)
                  + amp * 0.35 * sin(lobesF * 2.7 * th + 1.3)
                  + amp * 0.18 * sin(lobesF * 5.1 * th + 0.7);
    float rTarget = R * (1.0 + perturb);
    return abs(r - rTarget) - w;
  }

  vec3 modeNewBelgiumV2(vec2 cuv) {
    vec2 p = cuv - uNBFocal;
    float idle = uTime * uNBIdleDrift;
    float ca = cos(idle), sa = sin(idle);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uNBCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float poleSep = clamp(uNBGapHalfAngle * 2.0, 0.04, 0.5);
    vec2  fA      = vec2(-poleSep, 0.0);
    vec2  fB      = vec2( poleSep, 0.0);

    float d0 = nbV2_K0(p, uNBRingRadius, max(uNBRingInner, 0.04), uNBStroke,
                       uNBSpokeCount, uNBLogBase);
    float d1 = nbV2_K1(p, fA, fB, uNBRingRadius, uNBStroke, uNBSpokeCount,
                       clamp(uNBSpiralTurns * 0.04, 0.04, 0.32));
    float d2 = nbV2_K2(p, max(uNBRingInner + 0.05, 0.08), uNBRingRadius,
                       uNBStroke, uNBSpokeCount);
    float lobes = clamp(uNBSpiralPitch * 5.0, 3.0, 14.0);
    float d3 = nbV2_K3(p, uNBRingRadius * 0.72,
                       clamp(uNBBarAmpMax * 0.4, 0.04, 0.32), lobes, uNBStroke);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uNBWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  // ============================================================
  // 2 — Consume & Create: scalar wave field (Riley / Vasarely / Soto).
  //   K0 plane wave   K1 chirped (axis tilted)   K2 two-source interference   K3 standing-wave Lissajous
  // Threshold sin(field) > 0 for instant 1-bit output.
  // ============================================================
  float ccPlanePhase(vec2 p, vec2 s, float k, float ang, float t) {
    vec2 d   = p - s;
    vec2 dir = vec2(cos(ang), sin(ang));
    return k * dot(d, dir) - t;
  }
  float ccChirpPhase(vec2 p, vec2 s, float k, float ang, float chirp, float t) {
    vec2 d   = p - s;
    vec2 dir = vec2(cos(ang), sin(ang));
    float x  = dot(d, dir);
    return (k + chirp * x) * x - t;
  }
  float ccRadialPhase(vec2 p, vec2 s, float k, float t) {
    return k * length(p - s) - t;
  }

  vec3 modeConsumeCreate(vec2 cuv) {
    float t        = uTime * uCCIdlePhase;
    float phase    = fract(uScroll * uCCCycles);
    float seg      = phase * 4.0;
    float i        = floor(seg);
    float lt       = clamp(seg - i, 0.0, 1.0);

    float k = uCCFreq;
    // Slight wobble on K2 sources so the interference field never sits static.
    vec2 sA = uCCSourceA + 0.005 * vec2(sin(uTime * 0.5), cos(uTime * 0.43));
    vec2 sB = uCCSourceB + 0.005 * vec2(cos(uTime * 0.46), sin(uTime * 0.52));

    float w0 = sin(ccPlanePhase(cuv, sA, k, uCCPropAngle, t));
    float w1 = sin(ccChirpPhase(cuv, sA, k, uCCPropAngle + uCCChirpTilt, uCCChirp, t));
    float w2 = (sin(ccRadialPhase(cuv, sA, k, t)) +
                sin(ccRadialPhase(cuv, sB, k, t))) * 0.5;
    float w3 = (sin(k * (cuv.x - sA.x)) + sin(k * (cuv.y - sB.y))) * 0.5;

    float w  = morphSegment(w0, w1, w2, w3, lt, i, uCCWhooshGain);
    float fw = max(fwidth(w), 1e-4);
    return vec3(smoothstep(-fw, fw, w));
  }

  // ============================================================
  // 3 — CraftedKit: Truchet tessellation (Vera Molnár / Bauhaus modular).
  //   K0 bare grid   K1 uniform diagonal Truchet   K2 mixed Truchet   K3 focal subdivision
  // Per-pixel: figure out which cell we're in, evaluate that cell's primitive.
  // ============================================================
  float sdTruchetArc(vec2 q, float orient, float arcR) {
    vec2 c1 = mix(vec2(-0.5, -0.5), vec2(-0.5,  0.5), orient);
    vec2 c2 = mix(vec2( 0.5,  0.5), vec2( 0.5, -0.5), orient);
    return min(abs(length(q - c1) - arcR), abs(length(q - c2) - arcR));
  }
  // Distance to nearest cell edge in world units. Negative = inside stroke.
  float ckGridLine(vec2 p, float cellSize, float halfW) {
    vec2 q  = fract(p / cellSize) - 0.5;
    vec2 dE = vec2(0.5) - abs(q);
    return min(dE.x, dE.y) * cellSize - halfW;
  }
  // Bare grid only (K0).
  float ckGridOnly(vec2 p, float cellSize, float stroke) {
    return ckGridLine(p, cellSize, stroke);
  }
  // Truchet field with controlled per-cell orientation jitter (K1, K2).
  float ckTruchetField(vec2 p, float cellSize, float arcR,
                       float orientMix, float stroke) {
    vec2 cell = p / cellSize;
    vec2 id   = floor(cell);
    vec2 q    = fract(cell) - 0.5;
    float h   = hash(id);
    float orient = mix(0.0, step(0.5, h), orientMix);
    return sdTruchetArc(q, orient, arcR) * cellSize - stroke;
  }
  // Focal-cell subdivision (K3): the field is the K2 Truchet *everywhere*
  // (so the focal-cell boundary is seamless), but inside the focal cell we
  // additionally union a 2x-finer Truchet at half stroke. The focal cell
  // therefore reads as a denser cell within the larger pattern, not as a
  // mismatched square — both sides of the boundary share the same arcs.
  float ckFocalSubdiv(vec2 p, float cellSize, float arcR,
                      float stroke, vec2 focalCell) {
    vec2 cell = p / cellSize;
    vec2 id   = floor(cell);
    vec2 q    = fract(cell) - 0.5;
    float h   = hash(id);
    float orient = step(0.5, h);
    float dPeriph = sdTruchetArc(q, orient, arcR) * cellSize - stroke;

    float fx  = step(abs(id.x - focalCell.x), 0.5);
    float fy  = step(abs(id.y - focalCell.y), 0.5);
    float inFocal = fx * fy;

    float sub  = cellSize * 0.5;
    vec2 sCell = p / sub;
    vec2 sId   = floor(sCell);
    vec2 sQ    = fract(sCell) - 0.5;
    float sH   = hash(sId + 11.0);
    float sOri = step(0.5, sH);
    float dSub = sdTruchetArc(sQ, sOri, arcR) * sub - stroke * 0.6;

    return mix(dPeriph, min(dPeriph, dSub), inFocal);
  }

  vec3 modeCraftedKit(vec2 cuv) {
    vec2 p = cuv - uCKFocal;
    // Slight grid tilt + idle rotation drift.
    float ti = uTime * uCKIdleDrift + uCKGridTilt;
    float ca = cos(ti), sa = sin(ti);
    p = mat2(ca, -sa, sa, ca) * p;

    float phase = fract(uScroll * uCKCycles);
    float seg   = phase * 4.0;
    float i     = floor(seg);
    float lt    = clamp(seg - i, 0.0, 1.0);

    float d0 = ckGridOnly(p, uCKCellSize, uCKStroke);
    float d1 = ckTruchetField(p, uCKCellSize, uCKArcRadius, 0.0, uCKStroke);
    float d2 = ckTruchetField(p, uCKCellSize, uCKArcRadius, 1.0, uCKStroke);
    float d3 = ckFocalSubdiv(p, uCKCellSize, uCKArcRadius, uCKStroke, uCKFocalCell);

    float d   = morphSegment(d0, d1, d2, d3, lt, i, uCKWhooshGain);
    float fw  = max(fwidth(d), 1e-4);
    float ink = 1.0 - smoothstep(-fw, fw, d);
    return vec3(ink);
  }

  void main() {
    if (uWeight <= 0.001) discard;

    vec2 uv = vUv;
    vec2 cuv = uv - 0.5;
    cuv.x *= uAspect;

    vec3 col;
    if (uIndex == 0) {
      if      (uMBVariant == 1) col = modeMissionBellV1(cuv);
      else if (uMBVariant == 2) col = modeMissionBellV2(cuv);
      else                      col = modeMissionBell(cuv);
    } else if (uIndex == 1) {
      if      (uNBVariant == 1) col = modeNewBelgiumV1(cuv);
      else if (uNBVariant == 2) col = modeNewBelgiumV2(cuv);
      else                      col = modeNewBelgium(cuv);
    } else if (uIndex == 2) {
      col = modeConsumeCreate(cuv);
    } else {
      col = modeCraftedKit(cuv);
    }

    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    gl_FragColor = vec4(col, uWeight);
  }
`;

// Defaults match the Bauhaus Manifesto preset; first-render uniforms before
// useFrame writes anything must already be in the right neighbourhood.
const uniforms = {
  uTime: { value: 0 },
  uScroll: { value: 0 },
  uAspect: { value: 1.78 },
  uIndex: { value: 0 },
  uWeight: { value: 0 },
  uMBVariant: { value: 2 },
  uMBFocal: { value: new Vector2(-0.04, -0.08) },
  uMBDotPitch: { value: 0.08 },
  uMBCoreRadius: { value: 0.05 },
  uMBStippleJitter: { value: 0.04 },
  uMBBurstWedges: { value: 16 },
  uMBBurstDuty: { value: 0.8 },
  uMBWedgeAngle: { value: 0.785 },
  uMBWedgeSoftness: { value: 0.18 },
  uMBHaloRadius: { value: 0.4 },
  uMBHaloWidth: { value: 0.05 },
  uMBCycles: { value: 3.0 },
  uMBIdleDrift: { value: 0.04 },
  uMBWhooshGain: { value: 0.08 },
  uNBVariant: { value: 1 },
  uNBFocal: { value: new Vector2(-0.2, 0.08) },
  uNBStroke: { value: 0.014 },
  uNBRingRadius: { value: 0.46 },
  uNBRingInner: { value: 0.12 },
  uNBGapHalfAngle: { value: 0.08 },
  uNBSpokeCount: { value: 12 },
  uNBBarCount: { value: 24 },
  uNBBarAmpMax: { value: 0.42 },
  uNBLogBase: { value: 1.7 },
  uNBSpiralPitch: { value: 1.4 },
  uNBSpiralTurns: { value: 4.0 },
  uNBCycles: { value: 3.0 },
  uNBIdleDrift: { value: 0.05 },
  uNBWhooshGain: { value: 0.06 },
  uCCSourceA: { value: new Vector2(-0.18, 0.04) },
  uCCSourceB: { value: new Vector2(0.1, -0.04) },
  uCCFreq: { value: 48.0 },
  uCCPropAngle: { value: 0.78 },
  uCCChirp: { value: 44.0 },
  uCCChirpTilt: { value: 0.9 },
  uCCCycles: { value: 3.0 },
  uCCIdlePhase: { value: 0.45 },
  uCCWhooshGain: { value: 0.8 },
  uCKFocal: { value: new Vector2(-0.16, 0.1) },
  uCKStroke: { value: 0.012 },
  uCKCellSize: { value: 0.13 },
  uCKArcRadius: { value: 0.5 },
  uCKGridTilt: { value: 0.22 },
  uCKFocalCell: { value: new Vector2(2, -1) },
  uCKCycles: { value: 3.0 },
  uCKIdleDrift: { value: 0.06 },
  uCKWhooshGain: { value: 0.06 },
};

// Three full presets, one snapshot per shader. All keys match the Leva schemas
// 1:1 and stay inside the existing min/max ranges.
const PRESETS = {
  'Inkwell Editorial': {
    mb: {
      mbFocal: [-0.2, 0.04] as [number, number],
      mbDotPitch: 0.08,
      mbCoreRadius: 0.12,
      mbStippleJitter: 0.08,
      mbBurstWedges: 6,
      mbBurstDuty: 0.3,
      mbWedgeAngle: 0.2,
      mbWedgeSoftness: 0.65,
      mbHaloRadius: 0.22,
      mbHaloWidth: 0.18,
      mbCycles: 1.0,
      mbIdleDrift: 0.01,
      mbWhooshGain: 0.02,
    },
    nb: {
      nbFocal: [-0.18, 0.06] as [number, number],
      nbStroke: 0.0025,
      nbRingRadius: 0.48,
      nbRingInner: 0.06,
      nbGapHalfAngle: 0.2,
      nbSpokeCount: 6,
      nbBarCount: 12,
      nbBarAmpMax: 0.18,
      nbLogBase: 2.0,
      nbSpiralPitch: 0.8,
      nbSpiralTurns: 2.0,
      nbCycles: 1.0,
      nbIdleDrift: 0.015,
      nbWhooshGain: 0.02,
    },
    cc: {
      ccSourceA: [-0.42, 0.08] as [number, number],
      ccSourceB: [0.42, -0.06] as [number, number],
      ccFreq: 12.0,
      ccPropAngle: 0.0,
      ccChirp: 6.0,
      ccChirpTilt: 0.2,
      ccCycles: 1.0,
      ccIdlePhase: 0.15,
      ccWhooshGain: 0.3,
    },
    ck: {
      ckFocal: [-0.18, 0.1] as [number, number],
      ckStroke: 0.003,
      ckCellSize: 0.26,
      ckArcRadius: 0.5,
      ckGridTilt: 0.04,
      ckFocalCell: [1, 0] as [number, number],
      ckCycles: 1.0,
      ckIdleDrift: 0.01,
      ckWhooshGain: 0.02,
    },
  },
  'Bauhaus Manifesto': {
    mb: {
      mbFocal: [-0.16, 0.06] as [number, number],
      mbDotPitch: 0.04,
      mbCoreRadius: 0.05,
      mbStippleJitter: 0.04,
      mbBurstWedges: 16,
      mbBurstDuty: 0.8,
      mbWedgeAngle: 0.785,
      mbWedgeSoftness: 0.18,
      mbHaloRadius: 0.4,
      mbHaloWidth: 0.05,
      mbCycles: 3.0,
      mbIdleDrift: 0.04,
      mbWhooshGain: 0.08,
    },
    nb: {
      nbFocal: [-0.2, 0.08] as [number, number],
      nbStroke: 0.014,
      nbRingRadius: 0.46,
      nbRingInner: 0.12,
      nbGapHalfAngle: 0.08,
      nbSpokeCount: 12,
      nbBarCount: 24,
      nbBarAmpMax: 0.42,
      nbLogBase: 1.7,
      nbSpiralPitch: 1.4,
      nbSpiralTurns: 4.0,
      nbCycles: 3.0,
      nbIdleDrift: 0.05,
      nbWhooshGain: 0.06,
    },
    cc: {
      ccSourceA: [-0.18, 0.04] as [number, number],
      ccSourceB: [0.1, -0.04] as [number, number],
      ccFreq: 48.0,
      ccPropAngle: 0.78,
      ccChirp: 44.0,
      ccChirpTilt: 0.9,
      ccCycles: 3.0,
      ccIdlePhase: 0.45,
      ccWhooshGain: 0.8,
    },
    ck: {
      ckFocal: [-0.16, 0.1] as [number, number],
      ckStroke: 0.012,
      ckCellSize: 0.13,
      ckArcRadius: 0.5,
      ckGridTilt: 0.22,
      ckFocalCell: [2, -1] as [number, number],
      ckCycles: 3.0,
      ckIdleDrift: 0.06,
      ckWhooshGain: 0.06,
    },
  },
  'Op-Art Vertigo': {
    mb: {
      mbFocal: [0.06, -0.04] as [number, number],
      mbDotPitch: 0.018,
      mbCoreRadius: 0.22,
      mbStippleJitter: 0.55,
      mbBurstWedges: 24,
      mbBurstDuty: 0.88,
      mbWedgeAngle: 1.05,
      mbWedgeSoftness: 0.08,
      mbHaloRadius: 0.58,
      mbHaloWidth: 0.28,
      mbCycles: 4.0,
      mbIdleDrift: 0.18,
      mbWhooshGain: 0.18,
    },
    nb: {
      nbFocal: [0.04, -0.02] as [number, number],
      nbStroke: 0.0035,
      nbRingRadius: 0.66,
      nbRingInner: 0.04,
      nbGapHalfAngle: 0.015,
      nbSpokeCount: 32,
      nbBarCount: 64,
      nbBarAmpMax: 0.58,
      nbLogBase: 3.5,
      nbSpiralPitch: 2.0,
      nbSpiralTurns: 6.0,
      nbCycles: 4.0,
      nbIdleDrift: 0.22,
      nbWhooshGain: 0.18,
    },
    cc: {
      ccSourceA: [-0.1, 0.02] as [number, number],
      ccSourceB: [0.08, -0.02] as [number, number],
      ccFreq: 96.0,
      ccPropAngle: 1.2,
      ccChirp: 76.0,
      ccChirpTilt: -1.3,
      ccCycles: 4.0,
      ccIdlePhase: 1.8,
      ccWhooshGain: 1.8,
    },
    ck: {
      ckFocal: [0.04, 0.02] as [number, number],
      ckStroke: 0.004,
      ckCellSize: 0.075,
      ckArcRadius: 0.62,
      ckGridTilt: 0.38,
      ckFocalCell: [3, 2] as [number, number],
      ckCycles: 4.0,
      ckIdleDrift: 0.26,
      ckWhooshGain: 0.18,
    },
  },
} as const;

type PresetName = keyof typeof PRESETS;
type ShaderValues = (typeof PRESETS)[PresetName];

// Mutable bag bridging live Leva values into button-click closures. Leva's
// function-form schema only re-evaluates on dep changes, so handlers freeze
// at first-render closures; the bag is refreshed each render via useEffect
// and read inside click handlers. Module-scoped because CaseStudyHeroLayer
// is a singleton inside the canvas.
type LiveBag = {
  mb: ShaderValues['mb'] | null;
  nb: ShaderValues['nb'] | null;
  cc: ShaderValues['cc'] | null;
  ck: ShaderValues['ck'] | null;
  forceIndex: number;
  mbSet: ((v: Partial<ShaderValues['mb']>) => void) | null;
  nbSet: ((v: Partial<ShaderValues['nb']>) => void) | null;
  ccSet: ((v: Partial<ShaderValues['cc']>) => void) | null;
  ckSet: ((v: Partial<ShaderValues['ck']>) => void) | null;
  sceneSet: ((v: Record<string, unknown>) => void) | null;
};
const liveBag: LiveBag = {
  mb: null,
  nb: null,
  cc: null,
  ck: null,
  forceIndex: -1,
  mbSet: null,
  nbSet: null,
  ccSet: null,
  ckSet: null,
  sceneSet: null,
};

const FORCE_OPTIONS = {
  off: -1,
  'Mission Bell': 0,
  'New Belgium': 1,
  'Consume & Create': 2,
  CraftedKit: 3,
} as const;

export default function CaseStudyHeroLayer() {
  const matRef = useRef<ShaderMaterial>(null);

  const [mb, mbSet] = useControls(
    'Mission Bell hero',
    () => ({
      mbVariant: {
        value: 2,
        options: { halftone: 0, 'concentric op-art': 1, 'constructivist glyphs': 2 },
        label: 'variant',
      },
      mbFocal: { value: [-0.04, -0.08] as [number, number], step: 0.01, label: 'focal xy' },
      mbDotPitch: { value: 0.08, min: 0.015, max: 0.1, step: 0.001, label: 'dot pitch' },
      Stipple: folder(
        {
          mbCoreRadius: { value: 0.05, min: 0.0, max: 0.25, step: 0.005 },
          mbStippleJitter: { value: 0.04, min: 0.0, max: 0.6, step: 0.01, label: 'riso shift' },
        },
        { collapsed: true },
      ),
      Burst: folder(
        {
          mbBurstWedges: { value: 16, min: 4, max: 24, step: 1 },
          mbBurstDuty: { value: 0.8, min: 0.1, max: 0.9, step: 0.01, label: 'wedge fill' },
        },
        { collapsed: true },
      ),
      Wedge: folder(
        {
          mbWedgeAngle: { value: 0.785, min: 0.0, max: 6.28, step: 0.01 },
          mbWedgeSoftness: { value: 0.18, min: 0.05, max: 0.8, step: 0.01 },
        },
        { collapsed: true },
      ),
      Halo: folder(
        {
          mbHaloRadius: { value: 0.4, min: 0.1, max: 0.6, step: 0.005 },
          mbHaloWidth: { value: 0.05, min: 0.02, max: 0.3, step: 0.005 },
        },
        { collapsed: true },
      ),
      Motion: folder(
        {
          mbCycles: { value: 3.0, min: 1.0, max: 4.0, step: 0.5, label: 'cycles/scroll' },
          mbIdleDrift: { value: 0.04, min: 0.0, max: 0.4, step: 0.005 },
          mbWhooshGain: { value: 0.08, min: 0.005, max: 0.2, step: 0.005, label: 'softmin k' },
        },
        { collapsed: true },
      ),
    }),
    { collapsed: true },
  );

  const [nb, nbSet] = useControls(
    'New Belgium hero',
    () => ({
      nbVariant: {
        value: 1,
        options: { chronograph: 0, 'industrial caliper': 1, 'cartographic atlas': 2 },
        label: 'variant',
      },
      nbFocal: { value: [-0.2, 0.08] as [number, number], step: 0.01, label: 'focal xy' },
      nbStroke: { value: 0.014, min: 0.001, max: 0.04, step: 0.0005, label: 'stroke' },
      Geometry: folder(
        {
          nbRingRadius: { value: 0.46, min: 0.1, max: 0.7, step: 0.005 },
          nbRingInner: { value: 0.12, min: 0.0, max: 0.3, step: 0.005 },
          nbGapHalfAngle: { value: 0.08, min: 0.0, max: 0.5, step: 0.005, label: 'ring gap' },
          nbSpokeCount: { value: 12, min: 4, max: 64, step: 1 },
          nbBarCount: { value: 24, min: 8, max: 64, step: 1 },
          nbBarAmpMax: { value: 0.42, min: 0.05, max: 0.6, step: 0.005, label: 'bar amp' },
          nbLogBase: { value: 1.7, min: 1.5, max: 4.0, step: 0.05 },
        },
        { collapsed: true },
      ),
      Spiral: folder(
        {
          nbSpiralPitch: { value: 1.4, min: 0.5, max: 2.5, step: 0.05, label: 'pitch ×' },
          nbSpiralTurns: { value: 4.0, min: 1.0, max: 6.0, step: 0.1 },
        },
        { collapsed: true },
      ),
      Motion: folder(
        {
          nbCycles: { value: 3.0, min: 1.0, max: 4.0, step: 0.5, label: 'cycles/scroll' },
          nbIdleDrift: { value: 0.05, min: 0.0, max: 0.4, step: 0.005 },
          nbWhooshGain: { value: 0.06, min: 0.005, max: 0.2, step: 0.005, label: 'softmin k' },
        },
        { collapsed: true },
      ),
    }),
    { collapsed: true },
  );

  const [cc, ccSet] = useControls(
    'Consume & Create hero',
    () => ({
      ccSourceA: { value: [-0.18, 0.04] as [number, number], step: 0.01, label: 'source A xy' },
      ccSourceB: { value: [0.1, -0.04] as [number, number], step: 0.01, label: 'source B xy' },
      Geometry: folder(
        {
          ccFreq: { value: 48.0, min: 8.0, max: 120.0, step: 0.5, label: 'wave freq' },
          ccPropAngle: { value: 0.78, min: -3.14, max: 3.14, step: 0.01, label: 'prop angle' },
          ccChirp: { value: 44.0, min: 0.0, max: 80.0, step: 0.5, label: 'chirp rate' },
          ccChirpTilt: { value: 0.9, min: -1.5, max: 1.5, step: 0.01, label: 'chirp tilt' },
        },
        { collapsed: true },
      ),
      Motion: folder(
        {
          ccCycles: { value: 3.0, min: 1.0, max: 4.0, step: 0.5, label: 'cycles/scroll' },
          ccIdlePhase: { value: 0.45, min: 0.0, max: 2.0, step: 0.01, label: 'idle phase v' },
          ccWhooshGain: { value: 0.8, min: 0.05, max: 2.0, step: 0.05, label: 'softmin k' },
        },
        { collapsed: true },
      ),
    }),
    { collapsed: true },
  );

  const [ck, ckSet] = useControls(
    'CraftedKit hero',
    () => ({
      ckFocal: { value: [-0.16, 0.1] as [number, number], step: 0.01, label: 'focal xy' },
      ckStroke: { value: 0.012, min: 0.001, max: 0.04, step: 0.0005, label: 'stroke' },
      Geometry: folder(
        {
          ckCellSize: { value: 0.13, min: 0.06, max: 0.3, step: 0.005, label: 'cell size' },
          ckArcRadius: { value: 0.5, min: 0.35, max: 0.65, step: 0.01, label: 'arc r' },
          ckGridTilt: { value: 0.22, min: 0.0, max: 0.4, step: 0.005, label: 'grid tilt' },
          ckFocalCell: { value: [2, -1] as [number, number], step: 1, label: 'focal cell ij' },
        },
        { collapsed: true },
      ),
      Motion: folder(
        {
          ckCycles: { value: 3.0, min: 1.0, max: 4.0, step: 0.5, label: 'cycles/scroll' },
          ckIdleDrift: { value: 0.06, min: 0.0, max: 0.3, step: 0.005 },
          ckWhooshGain: { value: 0.06, min: 0.005, max: 0.2, step: 0.005, label: 'softmin k' },
        },
        { collapsed: true },
      ),
    }),
    { collapsed: true },
  );

  // Time accumulator: pause/scale stay coherent without resetting drift.
  const lastTimeRef = useRef(0);

  const snapKeypoint = (k: number): number => {
    const idx = liveBag.forceIndex >= 0 ? liveBag.forceIndex : useSceneStore.getState().csHeroIndex;
    const cyclesByIdx = [liveBag.mb?.mbCycles, liveBag.nb?.nbCycles, liveBag.cc?.ccCycles, liveBag.ck?.ckCycles];
    const cycles = cyclesByIdx[idx] ?? 2;
    return ((k + 0.5) / (cycles * 4)) % 1;
  };

  const applyPreset = (name: PresetName) => {
    const p = PRESETS[name];
    liveBag.mbSet?.(p.mb);
    liveBag.nbSet?.(p.nb);
    liveBag.ccSet?.(p.cc);
    liveBag.ckSet?.(p.ck);
  };

  const [scene, sceneSet] = useControls(
    'Scene controls',
    () => ({
      forceIndex: { value: -1, options: FORCE_OPTIONS, label: 'force index' },
      forceWeight: { value: 1, min: 0, max: 1, step: 0.01, label: 'force weight' },
      forceScroll: { value: false, label: 'force scroll' },
      scrollValue: { value: 0, min: 0, max: 1, step: 0.001, label: 'scroll v' },
      'snap K0': button(() => liveBag.sceneSet?.({ scrollValue: snapKeypoint(0), forceScroll: true })),
      'snap K1': button(() => liveBag.sceneSet?.({ scrollValue: snapKeypoint(1), forceScroll: true })),
      'snap K2': button(() => liveBag.sceneSet?.({ scrollValue: snapKeypoint(2), forceScroll: true })),
      'snap K3': button(() => liveBag.sceneSet?.({ scrollValue: snapKeypoint(3), forceScroll: true })),
      pauseTime: { value: false, label: 'pause time' },
      timeScale: { value: 1, min: 0, max: 2, step: 0.05, label: 'time ×' },
      copyValues: button(() => {
        const snap = JSON.stringify({ mb: liveBag.mb, nb: liveBag.nb, cc: liveBag.cc, ck: liveBag.ck }, null, 2);
        navigator.clipboard?.writeText(snap).catch(() => {});
      }),
    }),
    { collapsed: false },
  );

  useControls(
    'Presets',
    {
      'Inkwell Editorial': button(() => applyPreset('Inkwell Editorial')),
      'Bauhaus Manifesto': button(() => applyPreset('Bauhaus Manifesto')),
      'Op-Art Vertigo': button(() => applyPreset('Op-Art Vertigo')),
    },
    { collapsed: false },
  );

  useEffect(() => {
    liveBag.mb = mb as ShaderValues['mb'];
    liveBag.nb = nb as ShaderValues['nb'];
    liveBag.cc = cc as ShaderValues['cc'];
    liveBag.ck = ck as ShaderValues['ck'];
    liveBag.forceIndex = scene.forceIndex;
    liveBag.mbSet = mbSet as LiveBag['mbSet'];
    liveBag.nbSet = nbSet as LiveBag['nbSet'];
    liveBag.ccSet = ccSet as LiveBag['ccSet'];
    liveBag.ckSet = ckSet as LiveBag['ckSet'];
    liveBag.sceneSet = sceneSet as LiveBag['sceneSet'];
  });

  useFrame((state, dt) => {
    const s = useSceneStore.getState();

    // Time accumulator: pause freezes drift, scale slows/speeds idle motion.
    if (!scene.pauseTime) lastTimeRef.current += dt * scene.timeScale;
    uniforms.uTime.value = lastTimeRef.current;

    const forced = scene.forceIndex >= 0;
    uniforms.uScroll.value = scene.forceScroll ? scene.scrollValue : s.scrollProgress;
    uniforms.uIndex.value = forced ? scene.forceIndex : s.csHeroIndex;
    uniforms.uWeight.value = forced ? scene.forceWeight : s.csHeroWeight;
    uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);

    uniforms.uMBVariant.value = mb.mbVariant;
    uniforms.uMBFocal.value.set(mb.mbFocal[0], mb.mbFocal[1]);
    uniforms.uMBDotPitch.value = mb.mbDotPitch;
    uniforms.uMBCoreRadius.value = mb.mbCoreRadius;
    uniforms.uMBStippleJitter.value = mb.mbStippleJitter;
    uniforms.uMBBurstWedges.value = mb.mbBurstWedges;
    uniforms.uMBBurstDuty.value = mb.mbBurstDuty;
    uniforms.uMBWedgeAngle.value = mb.mbWedgeAngle;
    uniforms.uMBWedgeSoftness.value = mb.mbWedgeSoftness;
    uniforms.uMBHaloRadius.value = mb.mbHaloRadius;
    uniforms.uMBHaloWidth.value = mb.mbHaloWidth;
    uniforms.uMBCycles.value = mb.mbCycles;
    uniforms.uMBIdleDrift.value = mb.mbIdleDrift;
    uniforms.uMBWhooshGain.value = mb.mbWhooshGain;

    uniforms.uNBVariant.value = nb.nbVariant;
    uniforms.uNBFocal.value.set(nb.nbFocal[0], nb.nbFocal[1]);
    uniforms.uNBStroke.value = nb.nbStroke;
    uniforms.uNBRingRadius.value = nb.nbRingRadius;
    uniforms.uNBRingInner.value = nb.nbRingInner;
    uniforms.uNBGapHalfAngle.value = nb.nbGapHalfAngle;
    uniforms.uNBSpokeCount.value = nb.nbSpokeCount;
    uniforms.uNBBarCount.value = nb.nbBarCount;
    uniforms.uNBBarAmpMax.value = nb.nbBarAmpMax;
    uniforms.uNBLogBase.value = nb.nbLogBase;
    uniforms.uNBSpiralPitch.value = nb.nbSpiralPitch;
    uniforms.uNBSpiralTurns.value = nb.nbSpiralTurns;
    uniforms.uNBCycles.value = nb.nbCycles;
    uniforms.uNBIdleDrift.value = nb.nbIdleDrift;
    uniforms.uNBWhooshGain.value = nb.nbWhooshGain;

    uniforms.uCCSourceA.value.set(cc.ccSourceA[0], cc.ccSourceA[1]);
    uniforms.uCCSourceB.value.set(cc.ccSourceB[0], cc.ccSourceB[1]);
    uniforms.uCCFreq.value = cc.ccFreq;
    uniforms.uCCPropAngle.value = cc.ccPropAngle;
    uniforms.uCCChirp.value = cc.ccChirp;
    uniforms.uCCChirpTilt.value = cc.ccChirpTilt;
    uniforms.uCCCycles.value = cc.ccCycles;
    uniforms.uCCIdlePhase.value = cc.ccIdlePhase;
    uniforms.uCCWhooshGain.value = cc.ccWhooshGain;

    uniforms.uCKFocal.value.set(ck.ckFocal[0], ck.ckFocal[1]);
    uniforms.uCKStroke.value = ck.ckStroke;
    uniforms.uCKCellSize.value = ck.ckCellSize;
    uniforms.uCKArcRadius.value = ck.ckArcRadius;
    uniforms.uCKGridTilt.value = ck.ckGridTilt;
    uniforms.uCKFocalCell.value.set(ck.ckFocalCell[0], ck.ckFocalCell[1]);
    uniforms.uCKCycles.value = ck.ckCycles;
    uniforms.uCKIdleDrift.value = ck.ckIdleDrift;
    uniforms.uCKWhooshGain.value = ck.ckWhooshGain;
  });

  return (
    <ScreenQuad renderOrder={-5}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </ScreenQuad>
  );
}
