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
export const TIMELINE_HEIGHT_SVH = 900;

// Hero is opacity 1 from scroll=0 (no DOM enter — the in-mesh per-glyph
// reveal animation handles its visual entry). Each subsequent scene
// overlaps with the previous via shared enter/exit windows for crossfade.
export const MODULE_WINDOWS: Record<Module, ModuleWindow> = {
  hero: { enterStart: 0.0, enterEnd: 0.0, exitStart: 0.16, exitEnd: 0.32 },
  about: { enterStart: 0.16, enterEnd: 0.32, exitStart: 0.4, exitEnd: 0.56 },
  work: { enterStart: 0.4, enterEnd: 0.56, exitStart: 0.64, exitEnd: 0.8 },
  contact: { enterStart: 0.64, enterEnd: 0.8, exitStart: 1.0, exitEnd: 1.0 },
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

// Per-scene canvas side. Content sits on the opposite half. The canvas slides
// between sides during the outgoing scene's exit window so the slide is
// choreographed with the existing mode crossfade.
export const MODULE_CANVAS_SIDE: Record<Module, 'left' | 'right'> = {
  hero: 'right',
  about: 'left',
  work: 'right',
  contact: 'left',
};

// Mobile equivalent: canvas occupies top or bottom 50%. Pattern A
// (top/bottom/top/bottom) is the mirror of the desktop right/left/right/left
// rhythm, transposed to the vertical axis.
export const MODULE_CANVAS_SLOT_MOBILE: Record<Module, 'top' | 'bottom'> = {
  hero: 'top',
  about: 'bottom',
  work: 'top',
  contact: 'bottom',
};

// Signed "lean" envelope for the canvas during transitions: in [-1, 1].
// Magnitude follows a smoothstep tent (0 → 1 → 0) across each exit window;
// sign = direction of horizontal travel (+1 = sliding right, -1 = sliding
// left). Drives the parallelogram clip-path decoration on the canvas wrapper
// so the canvas appears to lean toward the direction of travel mid-slide.
export function canvasLeanFactor(progress: number): number {
  const order: Module[] = ['hero', 'about', 'work', 'contact'];
  const sidePct = (m: Module) => (MODULE_CANVAS_SIDE[m] === 'right' ? 50 : 0);
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    const w = MODULE_WINDOWS[from];
    if (progress < w.exitStart) return 0;
    if (progress < w.exitEnd) {
      const u = (progress - w.exitStart) / (w.exitEnd - w.exitStart);
      const tent = u < 0.5 ? u * 2 : (1 - u) * 2;
      const eased = tent * tent * (3 - 2 * tent);
      const dir = Math.sign(sidePct(to) - sidePct(from));
      return eased * dir;
    }
  }
  return 0;
}

// Canvas left edge in % of viewport (0 = left, 50 = right). Slides via
// smoothstep across each transition's exit window.
export function canvasLeftPct(progress: number): number {
  const order: Module[] = ['hero', 'about', 'work', 'contact'];
  const sidePct = (m: Module) => (MODULE_CANVAS_SIDE[m] === 'right' ? 50 : 0);
  let current = sidePct('hero');
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    const w = MODULE_WINDOWS[from];
    if (progress < w.exitStart) return current;
    if (progress < w.exitEnd) {
      const u = (progress - w.exitStart) / (w.exitEnd - w.exitStart);
      const eased = u * u * (3 - 2 * u);
      return sidePct(from) + (sidePct(to) - sidePct(from)) * eased;
    }
    current = sidePct(to);
  }
  return current;
}

// Mobile analog: canvas top edge in % of viewport (0 = top half, 50 = bottom
// half). Same smoothstep slide as canvasLeftPct, transposed to the y axis.
export function canvasTopPct(progress: number): number {
  const order: Module[] = ['hero', 'about', 'work', 'contact'];
  const slotPct = (m: Module) => (MODULE_CANVAS_SLOT_MOBILE[m] === 'bottom' ? 50 : 0);
  let current = slotPct('hero');
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    const w = MODULE_WINDOWS[from];
    if (progress < w.exitStart) return current;
    if (progress < w.exitEnd) {
      const u = (progress - w.exitStart) / (w.exitEnd - w.exitStart);
      const eased = u * u * (3 - 2 * u);
      return slotPct(from) + (slotPct(to) - slotPct(from)) * eased;
    }
    current = slotPct(to);
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
