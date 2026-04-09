/**
 * Per-project hero biome configurations.
 * Each case study gets a unique landscape composition
 * assembled from shared + project-specific woodcut illustrations.
 *
 * Scale values = fraction of visible viewport width at the element's depth.
 * e.g. 0.2 = 20% of screen width, 1.0 = full screen width.
 */

const BASE = '/assets/graphics/case-study';

export type HeroLayer = 'bg' | 'mid' | 'fg';

export interface HeroElement {
  /** Path to the transparent WebP asset */
  src: string;
  /** Parallax depth layer */
  layer: HeroLayer;
  /**
   * Base position in normalized coordinates:
   * x: -1 (left edge) → 1 (right edge)
   * y: -1 (bottom) → 1 (top)
   */
  basePosition: [number, number];
  /** Fraction of visible viewport width at this depth (0.2 = 20% screen width) */
  scale: number;
  /** How much timestamp-seeded random can offset x position (0–1) */
  xVariance: number;
}

export interface HeroBiome {
  elements: HeroElement[];
}

/** Parallax speed per layer — fraction of total scroll travel */
export const LAYER_SPEED: Record<HeroLayer, number> = {
  bg: 0.3,
  mid: 0.6,
  fg: 1.0,
};

/** Z depth per layer in R3F world units */
export const LAYER_Z: Record<HeroLayer, number> = {
  bg: -8,
  mid: -5,
  fg: -2,
};

/** Camera Z position — must match Canvas camera prop */
export const CAMERA_Z = 5;

/** Ink opacity per layer — distant elements are fainter */
export const LAYER_OPACITY: Record<HeroLayer, number> = {
  bg: 0.2,
  mid: 0.3,
  fg: 0.4,
};

/** Paper visibility per layer — keeps paper subtle so atmosphere shows through */
export const LAYER_PAPER_OPACITY: Record<HeroLayer, number> = {
  bg: 0.08,
  mid: 0.12,
  fg: 0.15,
};

/* ── Biome definitions ──────────────────────────────────── */

export const heroBiomes: Record<string, HeroBiome> = {
  'new-belgium': {
    elements: [
      // Background — ridgeline spans full width, clouds are small accents
      { src: `${BASE}/ridgeline-distant.webp`, layer: 'bg', basePosition: [0, -0.1], scale: 1.1, xVariance: 0.03 },
      { src: `${BASE}/cloud-wispy-stratus.webp`, layer: 'bg', basePosition: [0.4, 0.5], scale: 0.28, xVariance: 0.2 },
      {
        src: `${BASE}/cloud-cumulus-cluster.webp`,
        layer: 'bg',
        basePosition: [-0.35, 0.65],
        scale: 0.22,
        xVariance: 0.15,
      },
      // Midground — landmark + trees + trail marker
      { src: `${BASE}/nb-rustic-cabin.webp`, layer: 'mid', basePosition: [0.3, -0.15], scale: 0.18, xVariance: 0.1 },
      { src: `${BASE}/pine-tree-dense.webp`, layer: 'mid', basePosition: [-0.35, -0.1], scale: 0.2, xVariance: 0.08 },
      {
        src: `${BASE}/trail-marker-signpost.webp`,
        layer: 'mid',
        basePosition: [0.0, -0.2],
        scale: 0.1,
        xVariance: 0.15,
      },
      // Foreground — rocks, wildflowers, accent element
      {
        src: `${BASE}/rock-boulder-cluster.webp`,
        layer: 'fg',
        basePosition: [-0.55, -0.55],
        scale: 0.14,
        xVariance: 0.1,
      },
      {
        src: `${BASE}/wildflower-meadow-strip.webp`,
        layer: 'fg',
        basePosition: [0.05, -0.7],
        scale: 0.45,
        xVariance: 0.08,
      },
      { src: `${BASE}/nb-hop-vine.webp`, layer: 'fg', basePosition: [0.5, -0.45], scale: 0.14, xVariance: 0.08 },
    ],
  },

  'crafted-kit': {
    elements: [
      // Background
      { src: `${BASE}/ridgeline-distant.webp`, layer: 'bg', basePosition: [0, -0.1], scale: 1.1, xVariance: 0.03 },
      {
        src: `${BASE}/cloud-cumulus-cluster.webp`,
        layer: 'bg',
        basePosition: [0.3, 0.55],
        scale: 0.24,
        xVariance: 0.2,
      },
      { src: `${BASE}/cloud-wispy-stratus.webp`, layer: 'bg', basePosition: [-0.4, 0.7], scale: 0.26, xVariance: 0.15 },
      // Midground
      {
        src: `${BASE}/ck-crystalline-formation.webp`,
        layer: 'mid',
        basePosition: [0.3, -0.1],
        scale: 0.18,
        xVariance: 0.1,
      },
      { src: `${BASE}/pine-tree-dense.webp`, layer: 'mid', basePosition: [-0.4, -0.1], scale: 0.2, xVariance: 0.08 },
      {
        src: `${BASE}/trail-marker-signpost.webp`,
        layer: 'mid',
        basePosition: [-0.05, -0.2],
        scale: 0.1,
        xVariance: 0.15,
      },
      // Foreground
      {
        src: `${BASE}/rock-jagged-outcrop.webp`,
        layer: 'fg',
        basePosition: [-0.55, -0.55],
        scale: 0.14,
        xVariance: 0.1,
      },
      {
        src: `${BASE}/wildflower-meadow-strip.webp`,
        layer: 'fg',
        basePosition: [0.05, -0.7],
        scale: 0.45,
        xVariance: 0.08,
      },
      { src: `${BASE}/ck-circuit-fern.webp`, layer: 'fg', basePosition: [0.5, -0.45], scale: 0.14, xVariance: 0.08 },
    ],
  },

  'mission-bell': {
    elements: [
      // Background
      { src: `${BASE}/ridgeline-close.webp`, layer: 'bg', basePosition: [0, -0.15], scale: 1.1, xVariance: 0.03 },
      { src: `${BASE}/cloud-wispy-stratus.webp`, layer: 'bg', basePosition: [0.35, 0.5], scale: 0.28, xVariance: 0.2 },
      {
        src: `${BASE}/cloud-cumulus-cluster.webp`,
        layer: 'bg',
        basePosition: [-0.3, 0.65],
        scale: 0.2,
        xVariance: 0.15,
      },
      // Midground
      {
        src: `${BASE}/mb-mission-bell-tower.webp`,
        layer: 'mid',
        basePosition: [0.3, -0.05],
        scale: 0.18,
        xVariance: 0.08,
      },
      { src: `${BASE}/dead-tree-snag.webp`, layer: 'mid', basePosition: [-0.4, -0.15], scale: 0.16, xVariance: 0.1 },
      {
        src: `${BASE}/trail-marker-signpost.webp`,
        layer: 'mid',
        basePosition: [0.0, -0.25],
        scale: 0.1,
        xVariance: 0.15,
      },
      // Foreground
      {
        src: `${BASE}/rock-boulder-cluster.webp`,
        layer: 'fg',
        basePosition: [-0.5, -0.55],
        scale: 0.14,
        xVariance: 0.1,
      },
      { src: `${BASE}/terrain-rocky-trail.webp`, layer: 'fg', basePosition: [0.0, -0.72], scale: 0.5, xVariance: 0.06 },
      { src: `${BASE}/mb-desert-mesa.webp`, layer: 'fg', basePosition: [0.5, -0.4], scale: 0.18, xVariance: 0.08 },
    ],
  },

  'corners-and-coasts': {
    elements: [
      // Background
      { src: `${BASE}/ridgeline-distant.webp`, layer: 'bg', basePosition: [0, -0.1], scale: 1.1, xVariance: 0.03 },
      {
        src: `${BASE}/cloud-cumulus-cluster.webp`,
        layer: 'bg',
        basePosition: [0.35, 0.6],
        scale: 0.24,
        xVariance: 0.2,
      },
      {
        src: `${BASE}/cloud-wispy-stratus.webp`,
        layer: 'bg',
        basePosition: [-0.35, 0.7],
        scale: 0.26,
        xVariance: 0.15,
      },
      // Midground
      { src: `${BASE}/cc-lighthouse.webp`, layer: 'mid', basePosition: [0.3, -0.05], scale: 0.18, xVariance: 0.1 },
      { src: `${BASE}/pine-tree-dense.webp`, layer: 'mid', basePosition: [-0.4, -0.1], scale: 0.2, xVariance: 0.08 },
      {
        src: `${BASE}/trail-marker-signpost.webp`,
        layer: 'mid',
        basePosition: [-0.05, -0.2],
        scale: 0.1,
        xVariance: 0.15,
      },
      // Foreground
      {
        src: `${BASE}/rock-jagged-outcrop.webp`,
        layer: 'fg',
        basePosition: [-0.5, -0.55],
        scale: 0.14,
        xVariance: 0.1,
      },
      {
        src: `${BASE}/wildflower-meadow-strip.webp`,
        layer: 'fg',
        basePosition: [0.1, -0.7],
        scale: 0.45,
        xVariance: 0.08,
      },
      { src: `${BASE}/cc-coastal-cliff.webp`, layer: 'fg', basePosition: [0.5, -0.4], scale: 0.18, xVariance: 0.08 },
    ],
  },
};

/* ── Seeded random ──────────────────────────────────────── */

export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Day-level seed so layout changes each visit but stays stable within a session */
export function getDaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
