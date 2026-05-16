/**
 * Case-study page scroll constants.
 *
 * The **Hero band** is the ~200svh pinned scroll region at the top of each
 * /work/[slug] page that hosts the bespoke per-project hero shader. The shader
 * runs `cycles = 1` across this band — one K0→K3 traversal — then the canvas
 * fades and the body reflows into the centered Body column.
 *
 * See `web/docs/adr/0003-case-study-hero-band-replaces-omnipresent-backdrop.md`
 * and `web/CONTEXT.md` for the design context.
 */

/** Hero band height in svh. Sized for ~50svh dwell per saved keypoint
 *  (4 keypoints × 50svh = 200svh of cycle scroll). */
export const HERO_BAND_SVH = 200;

/** Fade window expressed as fractions of band progress. The canvas holds at
 *  full opacity for the first FADE_START of the band (most of the Hero slot),
 *  then fades linearly to 0 by FADE_END (start of the Brief slot). After that
 *  the Brief slot reads clean — no shader presence behind the text. */
export const HERO_BAND_FADE_START = 0.4;
export const HERO_BAND_FADE_END = 0.5;

/** Compute Hero band progress from a pixel scroll offset.
 *  - 0 at the top of the page
 *  - 1 at the end of the Hero band's scroll runway
 *  - keeps growing past 1 as the user scrolls deeper into the body */
export function heroBandProgress(scrollYPx: number, viewportHeightPx: number): number {
  const bandPx = (HERO_BAND_SVH / 100) * viewportHeightPx;
  if (bandPx <= 0) return 0;
  return scrollYPx / bandPx;
}

/** Canvas wrapper opacity across the Hero band. Holds at 1 for the Hero slot,
 *  fades 1→0 across the Hero→Brief slot boundary, stays 0 through the Brief
 *  slot and beyond. */
export function heroBandVisibility(progress: number): number {
  if (progress <= HERO_BAND_FADE_START) return 1;
  if (progress >= HERO_BAND_FADE_END) return 0;
  const t = (progress - HERO_BAND_FADE_START) / (HERO_BAND_FADE_END - HERO_BAND_FADE_START);
  return 1 - t;
}
