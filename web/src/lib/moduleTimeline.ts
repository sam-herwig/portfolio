import type { Object3D } from 'three';

export type Module = 'hero' | 'about' | 'work' | 'contact';

export interface ModuleWindow {
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
}

// Total scroll length for the unified timeline. The single sticky-pinned
// container is this tall; scrollYProgress maps 0..1 across this range.
// Module holds: hero=256, about=192, work=192, contact=320svh. Inter-
// module letter-field transitions: 160svh each. New total:
// 256+160+192+160+192+160+320 = 1440svh. The transition windows grew
// from 128→160svh by adding +32svh ENTIRELY into the full-width HOLD
// beat — rect-expand/contract and overlay fades keep their previous
// absolute svh duration via the shifted beat constants below.
export const TIMELINE_HEIGHT_SVH = 1440;

// Hero is opacity 1 from scroll=0 (no DOM enter — the in-mesh per-glyph
// reveal animation handles its visual entry). Each subsequent scene
// overlaps with the previous via shared enter/exit windows for crossfade.
// Boundaries are computed from absolute svh: 256/192/192/320 module holds
// and 160svh transitions, divided by 1440 total. Adjacent modules share
// boundaries by contract (about.enterStart === hero.exitStart, etc.).
export const MODULE_WINDOWS: Record<Module, ModuleWindow> = {
  hero: { enterStart: 0.0, enterEnd: 0.0, exitStart: 0.1778, exitEnd: 0.2889 },
  about: { enterStart: 0.1778, enterEnd: 0.2889, exitStart: 0.4222, exitEnd: 0.5333 },
  work: { enterStart: 0.4222, enterEnd: 0.5333, exitStart: 0.6667, exitEnd: 0.7778 },
  contact: { enterStart: 0.6667, enterEnd: 0.7778, exitStart: 1.0, exitEnd: 1.0 },
};

export function sceneOpacity(progress: number, w: ModuleWindow): number {
  if (progress <= w.enterStart) return w.enterStart === w.enterEnd ? 1 : 0;
  if (progress < w.enterEnd) return (progress - w.enterStart) / (w.enterEnd - w.enterStart);
  if (progress <= w.exitStart) return 1;
  if (progress < w.exitEnd) return 1 - (progress - w.exitStart) / (w.exitEnd - w.exitStart);
  return 0;
}

// Local progress within the module's full window (enterStart..exitEnd) as 0..1.
// Drives in-scene effects (per-glyph reveal, scroll warp, drift) so each
// scene's animation timeline is local to its own window, not the global scroll.
export function moduleProgress(progress: number, w: ModuleWindow): number {
  const start = w.enterStart;
  const end = w.exitEnd;
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}

// Per-module canvas slot rectangles, in viewport %. Drives the geometry of
// where the shader physically renders — not just where it slides to. The
// shader steps forward at module transitions by EXPANDING into more of the
// viewport (Hero=half, About=upper letterbox, Work=full, Contact=half).
export interface CanvasSlot {
  top: number;
  left: number;
  w: number;
  h: number;
}

export const MODULE_CANVAS_SLOT_DESKTOP: Record<Module, CanvasSlot> = {
  hero: { top: 0, left: 50, w: 50, h: 100 },
  about: { top: 0, left: 0, w: 100, h: 58 },
  work: { top: 0, left: 0, w: 100, h: 100 },
  contact: { top: 0, left: 0, w: 50, h: 100 },
};

export const MODULE_CANVAS_SLOT_MOBILE: Record<Module, CanvasSlot> = {
  hero: { top: 0, left: 0, w: 100, h: 50 },
  about: { top: 50, left: 0, w: 100, h: 50 },
  work: { top: 0, left: 0, w: 100, h: 50 },
  contact: { top: 50, left: 0, w: 100, h: 50 },
};

const FULLSCREEN_SLOT: CanvasSlot = { top: 0, left: 0, w: 100, h: 100 };

// Six-phase sequential beats inside each transition window (u ∈ [0,1]).
// Each beat has its own focal motion so the eye has somewhere to land
// instead of three things morphing in lockstep. ~3% kiss overlaps soften
// hand-offs without slop. The rect/overlay constants below feed canvasSlot
// and overlayOpacity; per-preset letter timing lives in TRANSITION_PRESETS.
//
// Beat-anchor svh map (in a 160svh transition window):
//   [0,    15.4]   from-overlay fades out
//   [12.8, 35.8]   rect expands from-slot → fullscreen
//   [32.0, 48.6]   letters dissolve in    (per-preset, see TRANSITION_PRESETS)
//   [48.6, 111.4]  HOLD — letters at full, all-black bg (~63svh, the
//                  full-width dwell — bumped from 30.7→62.7svh)
//   [111.4, 128.0] letters dissolve out   (per-preset)
//   [124.2, 147.2] rect contracts fullscreen → to-slot
//   [144.6, 160.0] to-overlay fades in
export const OVERLAY_OUT_END = 0.096;
export const RECT_EXPAND_START = 0.08;
export const RECT_EXPAND_END = 0.224;
export const RECT_CONTRACT_START = 0.776;
export const RECT_CONTRACT_END = 0.92;
export const OVERLAY_IN_START = 0.904;

function lerpSlot(a: CanvasSlot, b: CanvasSlot, t: number): CanvasSlot {
  return {
    top: a.top + (b.top - a.top) * t,
    left: a.left + (b.left - a.left) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  };
}

export function canvasSlot(progress: number, isMobile: boolean): CanvasSlot {
  const slots = isMobile ? MODULE_CANVAS_SLOT_MOBILE : MODULE_CANVAS_SLOT_DESKTOP;
  const order: Module[] = ['hero', 'about', 'work', 'contact'];
  let current = slots.hero;
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    const w = MODULE_WINDOWS[from];
    if (progress < w.exitStart) return current;
    if (progress < w.exitEnd) {
      const u = (progress - w.exitStart) / (w.exitEnd - w.exitStart);
      const fromSlot = slots[from];
      const toSlot = slots[to];
      if (u < RECT_EXPAND_START) return fromSlot;
      if (u < RECT_EXPAND_END) {
        const v = (u - RECT_EXPAND_START) / (RECT_EXPAND_END - RECT_EXPAND_START);
        const eased = v * v * (3 - 2 * v);
        return lerpSlot(fromSlot, FULLSCREEN_SLOT, eased);
      }
      if (u < RECT_CONTRACT_START) {
        return FULLSCREEN_SLOT;
      }
      if (u < RECT_CONTRACT_END) {
        const v = (u - RECT_CONTRACT_START) / (RECT_CONTRACT_END - RECT_CONTRACT_START);
        const eased = v * v * (3 - 2 * v);
        return lerpSlot(FULLSCREEN_SLOT, toSlot, eased);
      }
      return toSlot;
    }
    current = slots[to];
  }
  return current;
}

export type Transition = 'hero-about' | 'about-work' | 'work-contact' | null;

export interface TransitionState {
  active: Transition;
  progress: number;
  from: Module | null;
  to: Module | null;
}

const TRANSITIONS: { key: Exclude<Transition, null>; from: Module; to: Module }[] = [
  { key: 'hero-about', from: 'hero', to: 'about' },
  { key: 'about-work', from: 'about', to: 'work' },
  { key: 'work-contact', from: 'work', to: 'contact' },
];

// Resolve which inter-scene transition is active at a given scroll value, with
// 0..1 progress inside that window. Both scenes share the window via the
// MODULE_WINDOWS contract, so we read the outgoing scene's exit window.
export function getTransitionState(progress: number): TransitionState {
  for (const t of TRANSITIONS) {
    const w = MODULE_WINDOWS[t.from];
    if (progress >= w.exitStart && progress <= w.exitEnd && w.exitEnd > w.exitStart) {
      const p = (progress - w.exitStart) / (w.exitEnd - w.exitStart);
      return { active: t.key, progress: p, from: t.from, to: t.to };
    }
  }
  return { active: null, progress: 0, from: null, to: null };
}

function smoothstep01(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

// HTML overlay opacity, staggered to leave room for rect-expand and
// letter-emerge beats on either side. The from-overlay collapses its 1→0
// fade into the first OVERLAY_OUT_END portion of its exit window so it's
// gone before letters start emerging; the to-overlay holds at 0 until
// OVERLAY_IN_START of its enter window then fades in over the tail. Outside
// active transitions the standard sceneOpacity (rest=1) carries.
export function overlayOpacity(progress: number, w: ModuleWindow): number {
  if (progress > w.exitStart && progress < w.exitEnd && w.exitEnd > w.exitStart) {
    const u = (progress - w.exitStart) / (w.exitEnd - w.exitStart);
    if (u < OVERLAY_OUT_END) return 1 - smoothstep01(u / OVERLAY_OUT_END);
    return 0;
  }
  if (progress > w.enterStart && progress < w.enterEnd && w.enterEnd > w.enterStart) {
    const u = (progress - w.enterStart) / (w.enterEnd - w.enterStart);
    if (u > OVERLAY_IN_START) {
      return smoothstep01((u - OVERLAY_IN_START) / (1 - OVERLAY_IN_START));
    }
    return 0;
  }
  return sceneOpacity(progress, w);
}

interface MaybeMaterial {
  opacity?: number;
  transparent?: boolean;
}

export function applyGroupOpacity(group: Object3D, opacity: number) {
  group.traverse((obj) => {
    const mesh = obj as Object3D & { material?: MaybeMaterial | MaybeMaterial[] };
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      m.opacity = opacity;
      m.transparent = true;
    });
  });
}
