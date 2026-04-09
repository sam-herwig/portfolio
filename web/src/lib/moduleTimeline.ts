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
    ownEnd: 0.16,
    enterStart: 0.0,
    enterEnd: 0.04,
    exitStart: 0.1,
    exitEnd: 0.16,
  },
  forest: {
    ownStart: 0.16,
    ownEnd: 0.42,
    enterStart: 0.16,
    enterEnd: 0.22,
    exitStart: 0.36,
    exitEnd: 0.42,
  },
  camp: {
    ownStart: 0.42,
    ownEnd: 0.58,
    enterStart: 0.42,
    enterEnd: 0.47,
    exitStart: 0.53,
    exitEnd: 0.58,
  },
  alpine: {
    ownStart: 0.58,
    ownEnd: 0.86,
    enterStart: 0.58,
    enterEnd: 0.64,
    exitStart: 0.8,
    exitEnd: 0.86,
  },
  summit: {
    ownStart: 0.86,
    ownEnd: 1.0,
    enterStart: 0.86,
    enterEnd: 0.92,
    exitStart: 0.96,
    exitEnd: 1.0,
  },
} as const;

export type ModuleName = keyof typeof MODULE_TIMELINE;
export type ModuleWindow = (typeof MODULE_TIMELINE)[ModuleName];

/* ── Scene envelope helpers ─────────────────────────────────────────────
 * Scene groups crossfade using the enter/exit windows already defined in
 * the contract.  XFADE adds a tiny margin so the 3D geometry is ready
 * just before content fades in and lingers just after content fades out.
 *
 * sceneOpacity() returns 0→1 during enter, 1 during hold, 1→0 during exit.
 * sceneVisible()  returns true when opacity > 0 (for unmounting).
 */
const XFADE = 0; // no overlap — outgoing scene must reach 0 before incoming starts

export function sceneOpacity(module: ModuleName, progress: number): number {
  const w = MODULE_TIMELINE[module];
  const fadeInStart = w.enterStart - XFADE;
  const fadeInEnd = w.enterEnd;
  const fadeOutStart = w.exitStart;
  const fadeOutEnd = w.exitEnd + XFADE;

  if (progress <= fadeInStart || progress >= fadeOutEnd) return 0;
  if (progress < fadeInEnd) return Math.max(0, Math.min(1, (progress - fadeInStart) / (fadeInEnd - fadeInStart)));
  if (progress > fadeOutStart) return Math.max(0, Math.min(1, (fadeOutEnd - progress) / (fadeOutEnd - fadeOutStart)));
  return 1;
}

export function sceneVisible(module: ModuleName, progress: number): boolean {
  return sceneOpacity(module, progress) > 0;
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
 * Subdivide a module's hold+exit window (enterEnd → exitEnd) into N child slots.
 * Cards only appear after the 3D scene reaches full opacity, staying visible
 * through the exit phase as the scene fades out.
 */
export function sceneChildRanges(
  module: ModuleName,
  count: number,
): ReadonlyArray<readonly [number, number, number, number]> {
  const w = MODULE_TIMELINE[module];
  // Use the full module window — cards fade in with the scene and fade out with it.
  const start = w.enterStart;
  const end = w.exitEnd;
  const slotSize = (end - start) / count;
  const fadeLen = slotSize * 0.2;

  return Array.from({ length: count }, (_, i) => {
    const s = start + slotSize * i;
    const e = s + slotSize;
    return [s, s + fadeLen, e - fadeLen, e] as const;
  });
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
