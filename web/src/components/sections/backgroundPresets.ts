// Per-scene shader presets. Selected via Leva dropdowns in BackgroundField.
// Values map to the Leva control names defined in BackgroundField.tsx.
//
// Hero presets feed the SDF shape morph (circle → triangle → square → hexagon)
// across the hero scroll window. About presets feed a tessellated plus-grid
// SDF morph (Plus → X → Diamond → Circle) with radial spatial stagger across
// the about scroll window.

export type HeroPreset = {
  heroRingThickness: number;
  heroShapeRadius: number;
  heroDisturbanceLength: number;
  heroWarpSpeed: number;
  heroWarpBase: number;
  heroWarpPeak: number;
  heroRotRate: number;
};

export const HERO_PRESETS: Record<string, HeroPreset> = {
  Switchback: {
    heroRingThickness: 0.01,
    heroShapeRadius: 0.3,
    heroDisturbanceLength: 4.5,
    heroWarpSpeed: 0.12,
    heroWarpBase: 0.015,
    heroWarpPeak: 0.1,
    heroRotRate: 0.5,
  },
  Ferrofluid: {
    heroRingThickness: 0.075,
    heroShapeRadius: 0.4,
    heroDisturbanceLength: 1.4,
    heroWarpSpeed: 0.09,
    heroWarpBase: 0.04,
    heroWarpPeak: 0.28,
    heroRotRate: 0.8,
  },
  Static: {
    heroRingThickness: 0.025,
    heroShapeRadius: 0.45,
    heroDisturbanceLength: 0.6,
    heroWarpSpeed: 0.85,
    heroWarpBase: 0.06,
    heroWarpPeak: 0.16,
    heroRotRate: 0.3,
  },
  Dilation: {
    heroRingThickness: 0.045,
    heroShapeRadius: 0.5,
    heroDisturbanceLength: 6.0,
    heroWarpSpeed: 0.05,
    heroWarpBase: 0.005,
    heroWarpPeak: 0.04,
    heroRotRate: 1.5,
  },
  Bloom: {
    heroRingThickness: 0.055,
    heroShapeRadius: 0.45,
    heroDisturbanceLength: 2.2,
    heroWarpSpeed: 0.22,
    heroWarpBase: 0.01,
    heroWarpPeak: 0.34,
    heroRotRate: 1.2,
  },
};

export type AboutPreset = {
  aboutGridScale: number;
  aboutStrokeWidth: number;
  aboutRadialCenter: [number, number];
  aboutStaggerStrength: number;
  aboutWaveAmp: number;
  aboutRotRate: number;
};

export const ABOUT_PRESETS: Record<string, AboutPreset> = {
  Ridgeline: {
    aboutGridScale: 14,
    aboutStrokeWidth: 0.07,
    aboutRadialCenter: [-0.35, 0],
    aboutStaggerStrength: 0.3,
    aboutWaveAmp: 0.05,
    aboutRotRate: 0.1,
  },
  Bench: {
    aboutGridScale: 8,
    aboutStrokeWidth: 0.1,
    aboutRadialCenter: [-0.35, 0],
    aboutStaggerStrength: 0.45,
    aboutWaveAmp: 0.06,
    aboutRotRate: 0.1,
  },
};

// Work — three procedural modes (no imagery). Each preset selects a workMode
// (0 = Spread, 1 = Stack, 2 = Index) and tunes that mode's knob set. Leva only
// touches the keys present in the preset, so unrelated mode knobs are left
// alone when switching presets — matches existing Hero/About behavior.
//
// Spread  — contact-sheet ledger of indexed card-frames (siblings About).
// Stack   — horizontal ridgeline of bar-spines, FBM breath (siblings Hero).
// Index   — one large card SDF morphing landscape→portrait→square→grid (siblings Hero).
type SpreadPreset = {
  workMode: 0;
  workGridCols: number;
  workGridRows: number;
  workCardPadding: number;
  workStrokeWidth: number;
  workRadialCenter: [number, number];
  workStaggerStrength: number;
  workRotRate: number;
  workDotSize: number;
};

type StackPreset = {
  workMode: 1;
  workBarCount: number;
  workBarGap: number;
  workBaseHeight: number;
  workVarianceIdle: number;
  workVariancePeak: number;
  workVarianceExit: number;
  workBreathSpeed: number;
};

type IndexPreset = {
  workMode: 2;
  workCardSize: number;
  workRingThickness: number;
  workWarpScale: number;
  workWarpSpeed: number;
  workWarpBase: number;
  workWarpPeak: number;
  workSubGridDensity: number;
};

export type WorkPreset = SpreadPreset | StackPreset | IndexPreset;

export const WORK_PRESETS: Record<string, WorkPreset> = {
  Spread: {
    workMode: 0,
    workGridCols: 11,
    workGridRows: 8,
    workCardPadding: 0.12,
    workStrokeWidth: 0.04,
    workRadialCenter: [-0.5, 0.5],
    workStaggerStrength: 0.61,
    workRotRate: 0.53,
    workDotSize: 2.0,
  },
  Stack: {
    workMode: 1,
    workBarCount: 40,
    workBarGap: 0.07,
    workBaseHeight: 0.47,
    workVarianceIdle: 0.31,
    workVariancePeak: 0.6,
    workVarianceExit: 0.45,
    workBreathSpeed: 0.46,
  },
  Index: {
    workMode: 2,
    workCardSize: 0.34,
    workRingThickness: 0.008,
    workWarpScale: 1.4,
    workWarpSpeed: 0.18,
    workWarpBase: 0.005,
    workWarpPeak: 0.06,
    workSubGridDensity: 9.0,
  },
};

export type ContactPreset = {
  contactStripeScale: number;
  contactLineWidth: number;
  contactRotSpeed: number;
  contactOffsetIdle: number;
  contactOffsetPeak: number;
  contactOffsetExit: number;
};

export const CONTACT_PRESETS: Record<string, ContactPreset> = {
  Pinpoint: {
    contactStripeScale: 36,
    contactLineWidth: 0.06,
    contactRotSpeed: 0.04,
    contactOffsetIdle: 0.3,
    contactOffsetPeak: 0.0,
    contactOffsetExit: 0.05,
  },
  Awning: {
    contactStripeScale: 8,
    contactLineWidth: 0.32,
    contactRotSpeed: 0.05,
    contactOffsetIdle: 0.12,
    contactOffsetPeak: 0.04,
    contactOffsetExit: 0.08,
  },
  Spirograph: {
    contactStripeScale: 22,
    contactLineWidth: 0.14,
    contactRotSpeed: 0.32,
    contactOffsetIdle: 0.45,
    contactOffsetPeak: 0.0,
    contactOffsetExit: -0.4,
  },
  Crossing: {
    contactStripeScale: 19,
    contactLineWidth: 0.08,
    contactRotSpeed: 0.01,
    contactOffsetIdle: 0.18,
    contactOffsetPeak: 0.0,
    contactOffsetExit: 0.0,
  },
  Argyle: {
    contactStripeScale: 14,
    contactLineWidth: 0.22,
    contactRotSpeed: 0.1,
    contactOffsetIdle: 0.25,
    contactOffsetPeak: 0.2,
    contactOffsetExit: 0.18,
  },
};

// Curated multi-scene combos. Each combo names one preset per scene.
export const COMBO_PRESETS: Record<string, { hero: string; about: string; work: string; contact: string }> = {
  Recommended: { hero: 'Switchback', about: 'Ridgeline', work: 'Spread', contact: 'Crossing' },
  Loud: { hero: 'Ferrofluid', about: 'Bench', work: 'Stack', contact: 'Spirograph' },
  Editorial: { hero: 'Dilation', about: 'Ridgeline', work: 'Index', contact: 'Pinpoint' },
  Print: { hero: 'Bloom', about: 'Bench', work: 'Spread', contact: 'Awning' },
  // Spread + slow Dilation hero + editorial Pinpoint contact — quiet catalog read.
  Ledger: { hero: 'Dilation', about: 'Ridgeline', work: 'Spread', contact: 'Pinpoint' },
  // Stack + Bench about + Awning contact — horizon-emphasizing shelved-work read.
  Archive: { hero: 'Switchback', about: 'Bench', work: 'Stack', contact: 'Awning' },
};

export const HERO_PRESET_NAMES = Object.keys(HERO_PRESETS);
export const ABOUT_PRESET_NAMES = Object.keys(ABOUT_PRESETS);
export const WORK_PRESET_NAMES = Object.keys(WORK_PRESETS);
export const CONTACT_PRESET_NAMES = Object.keys(CONTACT_PRESETS);
export const COMBO_PRESET_NAMES = Object.keys(COMBO_PRESETS);
