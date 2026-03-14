/**
 * Global Module Timeline Contract
 *
 * Single source of truth for module ownership across the homepage scroll.
 * Both HTML/content overlays (HomeClient) and 3D scene groups (UnifiedScene)
 * consume these windows so they never disagree on who owns the screen.
 *
 * Each module has:
 *   ownStart / ownEnd   — full ownership window (dormant outside this range)
 *   enterStart / enterEnd — fade-in sub-window inside ownership
 *   exitStart / exitEnd   — fade-out sub-window inside ownership
 *
 * Rule: module N+1 content must not appear before module N's ownEnd,
 *       unless overlap is explicitly documented here.
 */

export const MODULE_TIMELINE = {
  hero: {
    ownStart: 0.0,
    ownEnd: 0.22,
    enterStart: 0.0,
    enterEnd: 0.06,
    exitStart: 0.14,
    exitEnd: 0.22,
  },
  forest: {
    ownStart: 0.22,
    ownEnd: 0.44,
    enterStart: 0.22,
    enterEnd: 0.28,
    exitStart: 0.38,
    exitEnd: 0.44,
  },
  camp: {
    ownStart: 0.44,
    ownEnd: 0.64,
    enterStart: 0.44,
    enterEnd: 0.50,
    exitStart: 0.58,
    exitEnd: 0.64,
  },
  alpine: {
    ownStart: 0.64,
    ownEnd: 0.84,
    enterStart: 0.64,
    enterEnd: 0.72,
    exitStart: 0.78,
    exitEnd: 0.84,
  },
  summit: {
    ownStart: 0.84,
    ownEnd: 1.0,
    enterStart: 0.84,
    enterEnd: 0.92,
    exitStart: 0.96,
    exitEnd: 1.0,
  },
} as const;

export type ModuleName = keyof typeof MODULE_TIMELINE;
export type ModuleWindow = (typeof MODULE_TIMELINE)[ModuleName];

/* ── Scene visibility helpers ──────────────────────────────────────────────
 * Scene groups need a slightly wider window than content so transitions
 * feel smooth (geometry should be ready before content fades in and linger
 * briefly after content fades out).  The padding adds a small buffer on
 * each side of the ownership window.
 */
const SCENE_PAD = 0.03;

export function sceneVisible(module: ModuleName, progress: number): boolean {
  const w = MODULE_TIMELINE[module];
  return progress > w.ownStart - SCENE_PAD && progress < w.ownEnd + SCENE_PAD;
}

/* ── Content-level helpers ─────────────────────────────────────────────────
 * Build a 4-point range [fadeIn-start, fadeIn-end, fadeOut-start, fadeOut-end]
 * suitable for framer-motion useTransform.
 */

/** Full module enter/exit envelope as a 4-point range */
export function moduleRange(module: ModuleName): readonly [number, number, number, number] {
  const w = MODULE_TIMELINE[module];
  return [w.enterStart, w.enterEnd, w.exitStart, w.exitEnd] as const;
}

/**
 * Subdivide a module's ownership window into N equal child slots.
 * Returns an array of 4-point ranges for staggered child content.
 * Each child fades in over the first ~30% and out over the last ~30% of its slot.
 */
export function childRanges(
  module: ModuleName,
  count: number,
  /** Fraction of own window to use for children (0-1). Default 0.85 to leave enter/exit room. */
  usable = 0.85,
): ReadonlyArray<readonly [number, number, number, number]> {
  const w = MODULE_TIMELINE[module];
  const span = (w.ownEnd - w.ownStart) * usable;
  const offset = w.ownStart + (w.ownEnd - w.ownStart) * ((1 - usable) / 2);
  const slotSize = span / count;

  return Array.from({ length: count }, (_, i) => {
    const s = offset + slotSize * i;
    const e = s + slotSize;
    const fadeLen = slotSize * 0.3;
    return [s, s + fadeLen, e - fadeLen, e] as const;
  });
}
