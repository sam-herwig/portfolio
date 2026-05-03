import { Vector2 } from 'three';

export type DrawMode = 0 | 1 | 2; // 0 = sweep, 1 = soak, 2 = pool

export interface HeroParams {
  drawMode: DrawMode;
  drawDirection: Vector2;
  seedPoint0: Vector2;
  seedPoint1: Vector2;
  frontWidth: number;
  frontPoolStrength: number;
  frontFeather: number;
  drawNoiseScale: number;
  drawNoiseStrength: number;
  noiseStretch: number;
  // Soak-only
  soakContrast: number;
  soakBias: number;
  soakDetailScale: number;
  soakDetailStrength: number;
  sweepWeight: number;
  // Activation: 0 = directional sweep (linear top-down feel),
  // 1 = cluster noise (regions clear in random spots across the canvas).
  activationNoise: number;
  activationScale: number;
  // Choreography: progress at which the draw-in completes (smoothstep end).
  // 0.7 = ~3s at typical scroll speed.
  drawEnd: number;
}

// Defaults: Splatter is the active preset for mission-bell — random clusters
// pop in across the silhouette instead of a single top-down wipe.
const DEFAULTS: HeroParams = {
  drawMode: 1,
  drawDirection: new Vector2(0.0, -1.0),
  seedPoint0: new Vector2(0.5, 0.5),
  seedPoint1: new Vector2(0.5, 0.5),
  frontWidth: 0.06,
  frontPoolStrength: 0.45,
  frontFeather: 0.012,
  drawNoiseScale: 3.0,
  drawNoiseStrength: 0.2,
  noiseStretch: 0.3,
  soakContrast: 1.0,
  soakBias: 0.0,
  soakDetailScale: 12.0,
  soakDetailStrength: 0.0,
  sweepWeight: 0.85,
  activationNoise: 0.0,
  activationScale: 4.0,
  drawEnd: 0.7,
};

// Named presets — each one is a complete "drawing rhythm." The Leva preset
// dropdown in HeroLandscape applies one of these wholesale; the user can
// then dial individual sliders on top.
export type PresetName =
  | 'Splatter'
  | 'Pop-Around'
  | 'Pure Soak'
  | 'Top Down'
  | 'Bottom Up'
  | 'Diagonal Brush'
  | 'Two Corners'
  | 'Edges First'
  | 'Voronoi Bloom'
  | 'Scatter Bristle';

export const PRESETS: Record<PresetName, Partial<HeroParams>> = {
  // Random clusters appear in scattered spots across the canvas, each bleeding
  // outward from the skeleton inside its cluster. Reads as ink "finding" the form.
  Splatter: {
    sweepWeight: 0.4,
    activationNoise: 0.9,
    activationScale: 5.0,
    frontFeather: 0.02,
    drawNoiseStrength: 0.25,
    frontPoolStrength: 0.55,
    drawEnd: 0.7,
  },
  // Larger fewer pop-points across the canvas — fewer but more distinct
  // "places the artist's hand jumps to."
  'Pop-Around': {
    sweepWeight: 0.35,
    activationNoise: 0.95,
    activationScale: 3.5,
    frontFeather: 0.022,
    drawNoiseStrength: 0.3,
    frontPoolStrength: 0.6,
    drawEnd: 0.75,
  },
  // No directional or noise activation — pure radial bleed from each region's
  // centerline. The original soak feel.
  'Pure Soak': {
    sweepWeight: 0.0,
    activationNoise: 0.0,
    drawNoiseStrength: 0.15,
    soakContrast: 1.4,
    soakDetailStrength: 0.15,
    soakDetailScale: 12.0,
    frontFeather: 0.025,
    frontPoolStrength: 0.3,
    drawEnd: 0.7,
  },
  // Strong directional sweep, top-to-bottom. Clean deliberate drawing pass.
  'Top Down': {
    sweepWeight: 0.95,
    drawDirection: new Vector2(0.0, -1.0),
    activationNoise: 0.0,
    frontFeather: 0.008,
    noiseStretch: 0.25,
    drawNoiseStrength: 0.15,
    frontPoolStrength: 0.5,
    drawEnd: 0.7,
  },
  // Reverse — ink wicks up from the base of the silhouette like wet paper drawing fluid.
  'Bottom Up': {
    sweepWeight: 0.9,
    drawDirection: new Vector2(0.0, 1.0),
    activationNoise: 0.1,
    frontFeather: 0.012,
    noiseStretch: 0.4,
    drawNoiseStrength: 0.22,
    frontPoolStrength: 0.5,
    drawEnd: 0.7,
  },
  // Brush sweeps diagonally with stretched bristle-streak noise.
  'Diagonal Brush': {
    sweepWeight: 0.9,
    drawDirection: new Vector2(0.7, -0.7),
    activationNoise: 0.0,
    noiseStretch: 0.15,
    drawNoiseStrength: 0.3,
    frontFeather: 0.015,
    frontPoolStrength: 0.55,
    drawEnd: 0.7,
  },
  // Two ink seeds at opposite corners spread inward and meet at the silhouette.
  'Two Corners': {
    drawMode: 2,
    seedPoint0: new Vector2(0.15, 0.85),
    seedPoint1: new Vector2(0.85, 0.15),
    sweepWeight: 0.0,
    activationNoise: 0.3,
    activationScale: 4.0,
    frontFeather: 0.025,
    drawNoiseStrength: 0.25,
    frontPoolStrength: 0.4,
    drawEnd: 0.75,
  },
  // Outline of each ink region traces first, interiors fill last — line-drawing first.
  'Edges First': {
    sweepWeight: 0.2,
    soakContrast: 0.4,
    soakBias: -0.15,
    activationNoise: 0.15,
    drawNoiseStrength: 0.2,
    frontFeather: 0.02,
    frontPoolStrength: 0.4,
    soakDetailStrength: 0.2,
    drawEnd: 0.7,
  },
  // Many small noise cells pop on like tiles lighting up — denser than splatter.
  'Voronoi Bloom': {
    sweepWeight: 0.25,
    activationNoise: 0.85,
    activationScale: 8.0,
    drawNoiseStrength: 0.35,
    drawNoiseScale: 4.5,
    frontFeather: 0.03,
    frontPoolStrength: 0.6,
    soakDetailStrength: 0.25,
    drawEnd: 0.7,
  },
  // Loose scattering of clusters with strong bristle anisotropy in the noise —
  // reads as a hand "feeling out" the form.
  'Scatter Bristle': {
    sweepWeight: 0.55,
    activationNoise: 0.7,
    activationScale: 7.0,
    noiseStretch: 0.18,
    drawNoiseStrength: 0.32,
    drawNoiseScale: 4.0,
    frontFeather: 0.016,
    frontPoolStrength: 0.5,
    soakDetailStrength: 0.15,
    drawEnd: 0.72,
  },
};

export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];

const PER_SLUG: Record<string, { preset?: PresetName; override?: Partial<HeroParams> }> = {
  // Each case study gets its own drawing rhythm tuned to the silhouette.
  // Mission-bell: vertical bell tower → diagonal sweep cuts across the form.
  'mission-bell': { preset: 'Diagonal Brush' },
  // CraftedKit: distributed scene (raven, crystals, workbench, ferns, archway)
  // → random clusters across the canvas suits many discrete elements.
  craftedkit: { preset: 'Pop-Around' },
  // New Belgium: mountain landscape → clean top-down read for sky/peaks/foreground.
  'new-belgium': { preset: 'Top Down' },
  // Consume & Create: lighthouse on cliff with sea → two seeds pulling toward the
  // lighthouse anchor reads as light-and-water converging on land.
  'consume-and-create': {
    preset: 'Two Corners',
    override: {
      // Lighthouse is on the right; bias seeds so the meeting point lands near it.
      seedPoint0: new Vector2(0.1, 0.2),
      seedPoint1: new Vector2(0.85, 0.65),
    },
  },
};

export function getHeroParams(slug: string): HeroParams {
  const entry = PER_SLUG[slug];
  const presetParams = entry?.preset ? PRESETS[entry.preset] : {};
  const override = entry?.override ?? {};
  return { ...DEFAULTS, ...presetParams, ...override };
}

export function getPresetParams(name: PresetName): HeroParams {
  return { ...DEFAULTS, ...PRESETS[name] };
}

export function getDefaultPreset(slug: string): PresetName {
  return PER_SLUG[slug]?.preset ?? 'Splatter';
}
