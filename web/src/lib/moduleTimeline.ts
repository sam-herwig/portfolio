import useIsMobileViewport from '@/lib/useIsMobileViewport';

export type Module = 'hero' | 'about' | 'work' | 'contact';

export interface ModuleWindow {
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
}

// Total scroll length for the unified timeline. The single sticky-pinned
// container is this tall; scrollYProgress maps 0..1 across this range.
// Desktop module-svh breakdown: hero 160, about 128, work 100, contact 232;
// transitions 144 each (HOLD = chemical reaction).
// Baseline 160+144+128+144+100+144+232 = 1052svh; global pace scaled
// +10% (1052 → 1157) to slow the whole page evenly. Module proportions
// in MODULE_WINDOWS are unchanged — every beat stretches uniformly.
export const TIMELINE_HEIGHT_SVH = 1157;

// Mobile fork — the Work module hosts the Work reel (one card revealed at
// a time, ~60svh per card + ~10svh crossfade between cards = ~340svh).
// Same +10% global pace as desktop: 1292 → 1421. See
// `docs/adr/0007-work-reel-replaces-work-stack-on-mobile.md`.
export const TIMELINE_HEIGHT_SVH_MOBILE = 1421;

// Hero is opacity 1 from scroll=0 (no DOM enter — the in-mesh per-glyph
// reveal animation handles its visual entry). Each subsequent scene
// overlaps with the previous via shared enter/exit windows for crossfade.
// Boundaries are computed from absolute svh: 160/128/100/232 module holds
// and 144svh transitions, divided by 1052 total. Adjacent modules share
// boundaries by contract (about.enterStart === hero.exitStart, etc.).
export const MODULE_WINDOWS: Record<Module, ModuleWindow> = {
  hero: { enterStart: 0.0, enterEnd: 0.0, exitStart: 0.1521, exitEnd: 0.289 },
  about: { enterStart: 0.1521, enterEnd: 0.289, exitStart: 0.4106, exitEnd: 0.5475 },
  work: { enterStart: 0.4106, enterEnd: 0.5475, exitStart: 0.6426, exitEnd: 0.7795 },
  contact: { enterStart: 0.6426, enterEnd: 0.7795, exitStart: 1.0, exitEnd: 1.0 },
};

// Mobile module windows — same module-svh breakdown except Work IDLE grows
// from 100→340 svh to host the Work reel. Boundaries divided by 1292 total.
// Hero 160 / tx 144 / About 128 / tx 144 / Work 340 / tx 144 / Contact 232.
export const MODULE_WINDOWS_MOBILE: Record<Module, ModuleWindow> = {
  hero: { enterStart: 0.0, enterEnd: 0.0, exitStart: 0.1238, exitEnd: 0.2353 },
  about: { enterStart: 0.1238, enterEnd: 0.2353, exitStart: 0.3344, exitEnd: 0.4458 },
  work: { enterStart: 0.3344, enterEnd: 0.4458, exitStart: 0.709, exitEnd: 0.8204 },
  contact: { enterStart: 0.709, enterEnd: 0.8204, exitStart: 1.0, exitEnd: 1.0 },
};

// Viewport-aware hook — every consumer that needs scroll-progress-to-module
// math should read from this rather than importing MODULE_WINDOWS directly.
// SSR returns desktop values; mobile reconciles on first client effect.
export function useTimeline(): {
  modules: Record<Module, ModuleWindow>;
  totalHeight: number;
  isMobile: boolean;
} {
  const isMobile = useIsMobileViewport();
  return {
    modules: isMobile ? MODULE_WINDOWS_MOBILE : MODULE_WINDOWS,
    totalHeight: isMobile ? TIMELINE_HEIGHT_SVH_MOBILE : TIMELINE_HEIGHT_SVH,
    isMobile,
  };
}

function sceneOpacity(progress: number, w: ModuleWindow): number {
  if (progress <= w.enterStart) return w.enterStart === w.enterEnd ? 1 : 0;
  if (progress < w.enterEnd) return (progress - w.enterStart) / (w.enterEnd - w.enterStart);
  if (progress <= w.exitStart) return 1;
  if (progress < w.exitEnd) return 1 - (progress - w.exitStart) / (w.exitEnd - w.exitStart);
  return 0;
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

const MODULE_CANVAS_SLOT_DESKTOP: Record<Module, CanvasSlot> = {
  hero: { top: 0, left: 50, w: 50, h: 100 },
  about: { top: 0, left: 0, w: 100, h: 58 },
  work: { top: 0, left: 0, w: 100, h: 100 },
  contact: { top: 0, left: 0, w: 50, h: 100 },
};

const MODULE_CANVAS_SLOT_MOBILE: Record<Module, CanvasSlot> = {
  hero: { top: 0, left: 0, w: 100, h: 50 },
  about: { top: 50, left: 0, w: 100, h: 50 },
  work: { top: 0, left: 0, w: 100, h: 50 },
  contact: { top: 50, left: 0, w: 100, h: 50 },
};

const FULLSCREEN_SLOT: CanvasSlot = { top: 0, left: 0, w: 100, h: 100 };

// Five sequential beats inside each transition window (u ∈ [0,1]). Letter
// emerge/dissipate beats were dropped when the letter moment was retired;
// the HOLD beat now hosts the chemical reaction directly inside
// BackgroundField. Small kiss overlaps soften hand-offs without slop.
//
// Beat-anchor svh map (in a 144svh transition window):
//   [0,    17.0]   from-overlay fades out
//   [14.4, 39.4]   rect expands from-slot → fullscreen
//   [39.4, 99.4]   HOLD — fullscreen, chemical reaction visible (~60svh)
//   [99.4, 124.4]  rect contracts fullscreen → to-slot
//   [127.0, 144.0] to-overlay fades in
const OVERLAY_OUT_END = 0.118;
const RECT_EXPAND_START = 0.1;
const RECT_EXPAND_END = 0.274;
const RECT_CONTRACT_START = 0.69;
const RECT_CONTRACT_END = 0.864;
const OVERLAY_IN_START = 0.882;

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
  const windows = isMobile ? MODULE_WINDOWS_MOBILE : MODULE_WINDOWS;
  const order: Module[] = ['hero', 'about', 'work', 'contact'];
  let current = slots.hero;
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    const w = windows[from];
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

function smoothstep01(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

// True when scroll progress sits inside any module's exit window — i.e.
// during the rect-expand / HOLD / rect-contract span of a transition.
// Used to gate transition-only perf knobs (e.g., `BackgroundField`'s
// FBM-octave drop from 4 → 2 across the heavy window).
export function isInTransition(progress: number, windows: Record<Module, ModuleWindow> = MODULE_WINDOWS): boolean {
  const heroW = windows.hero;
  const aboutW = windows.about;
  const workW = windows.work;
  return (
    (progress > heroW.exitStart && progress < heroW.exitEnd) ||
    (progress > aboutW.exitStart && progress < aboutW.exitEnd) ||
    (progress > workW.exitStart && progress < workW.exitEnd)
  );
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
