// Per-scene shader presets. Selected via Leva dropdowns in BackgroundField.
// Values map to the Leva control names defined in BackgroundField.tsx.
//
// Preset library (5 per scene = 20 total) tuned to span tonal diversity:
// quiet/loud, fast/slow, dense/sparse, organic/mechanical.

export type HeroPreset = {
  heroRingThickness: number;
  heroDisturbanceLength: number;
  heroWarpSpeed: number;
  heroWarpIdle: number;
  heroWarpPeak: number;
  heroWarpExit: number;
  heroRadiusIdle: number;
  heroRadiusPeak: number;
  heroRadiusExit: number;
};

export const HERO_PRESETS: Record<string, HeroPreset> = {
  Halo: {
    heroRingThickness: 0.018,
    heroDisturbanceLength: 4.5,
    heroWarpSpeed: 0.12,
    heroWarpIdle: 0.015,
    heroWarpPeak: 0.1,
    heroWarpExit: 0.03,
    heroRadiusIdle: 0.4,
    heroRadiusPeak: 0.45,
    heroRadiusExit: 0.85,
  },
  Ferrofluid: {
    heroRingThickness: 0.075,
    heroDisturbanceLength: 1.4,
    heroWarpSpeed: 0.09,
    heroWarpIdle: 0.04,
    heroWarpPeak: 0.28,
    heroWarpExit: 0.06,
    heroRadiusIdle: 0.38,
    heroRadiusPeak: 0.5,
    heroRadiusExit: 0.7,
  },
  Static: {
    heroRingThickness: 0.025,
    heroDisturbanceLength: 0.6,
    heroWarpSpeed: 0.85,
    heroWarpIdle: 0.06,
    heroWarpPeak: 0.16,
    heroWarpExit: 0.1,
    heroRadiusIdle: 0.45,
    heroRadiusPeak: 0.5,
    heroRadiusExit: 0.75,
  },
  Dilation: {
    heroRingThickness: 0.045,
    heroDisturbanceLength: 6.0,
    heroWarpSpeed: 0.05,
    heroWarpIdle: 0.005,
    heroWarpPeak: 0.04,
    heroWarpExit: 0.02,
    heroRadiusIdle: 0.18,
    heroRadiusPeak: 0.35,
    heroRadiusExit: 1.2,
  },
  Bloom: {
    heroRingThickness: 0.055,
    heroDisturbanceLength: 2.2,
    heroWarpSpeed: 0.22,
    heroWarpIdle: 0.01,
    heroWarpPeak: 0.34,
    heroWarpExit: 0.02,
    heroRadiusIdle: 0.3,
    heroRadiusPeak: 0.55,
    heroRadiusExit: 0.95,
  },
};

export type AboutPreset = {
  aboutPattern: number;
  aboutLineWidth: number;
  aboutWaveFreq: number;
  aboutWaveSpeed: number;
  aboutGridIdle: number;
  aboutGridPeak: number;
  aboutGridExit: number;
  aboutWaveIdle: number;
  aboutWavePeak: number;
  aboutWaveExit: number;
};

// aboutPattern: 0=Plus, 1=X, 2=Asterisk, 3=Triangle
export const ABOUT_PRESETS: Record<string, AboutPreset> = {
  Linen: {
    aboutPattern: 0,
    aboutLineWidth: 0.018,
    aboutWaveFreq: 0.2,
    aboutWaveSpeed: 0.08,
    aboutGridIdle: 10,
    aboutGridPeak: 16,
    aboutGridExit: 22,
    aboutWaveIdle: 0.02,
    aboutWavePeak: 0.1,
    aboutWaveExit: 0.18,
  },
  Swarm: {
    aboutPattern: 2,
    aboutLineWidth: 0.025,
    aboutWaveFreq: 0.65,
    aboutWaveSpeed: 0.55,
    aboutGridIdle: 20,
    aboutGridPeak: 30,
    aboutGridExit: 14,
    aboutWaveIdle: 0.3,
    aboutWavePeak: 0.65,
    aboutWaveExit: 0.5,
  },
  Origami: {
    aboutPattern: 3,
    aboutLineWidth: 0.085,
    aboutWaveFreq: 0.45,
    aboutWaveSpeed: 0.12,
    aboutGridIdle: 5,
    aboutGridPeak: 7,
    aboutGridExit: 9,
    aboutWaveIdle: 0.1,
    aboutWavePeak: 0.55,
    aboutWaveExit: 0.85,
  },
  Sonar: {
    aboutPattern: 1,
    aboutLineWidth: 0.014,
    aboutWaveFreq: 0.18,
    aboutWaveSpeed: 0.2,
    aboutGridIdle: 6,
    aboutGridPeak: 11,
    aboutGridExit: 24,
    aboutWaveIdle: 0.4,
    aboutWavePeak: 0.85,
    aboutWaveExit: 0.45,
  },
  Halftone: {
    aboutPattern: 0,
    aboutLineWidth: 0.012,
    aboutWaveFreq: 0.1,
    aboutWaveSpeed: 0.05,
    aboutGridIdle: 28,
    aboutGridPeak: 36,
    aboutGridExit: 44,
    aboutWaveIdle: 0.0,
    aboutWavePeak: 0.04,
    aboutWaveExit: 0.1,
  },
};

export type WorkPreset = {
  workDitherBias: number;
  workContrast: number;
  workDitherIdle: number;
  workDitherPeak: number;
  workDitherExit: number;
};

export const WORK_PRESETS: Record<string, WorkPreset> = {
  Newsprint: {
    workDitherBias: 0.0,
    workContrast: 1.2,
    workDitherIdle: 9,
    workDitherPeak: 3,
    workDitherExit: 11,
  },
  Macro: {
    workDitherBias: 0.0,
    workContrast: 1.5,
    workDitherIdle: 14,
    workDitherPeak: 8,
    workDitherExit: 16,
  },
  Ghost: {
    workDitherBias: -0.18,
    workContrast: 0.9,
    workDitherIdle: 6,
    workDitherPeak: 2,
    workDitherExit: 7,
  },
  Bleach: {
    workDitherBias: 0.18,
    workContrast: 1.7,
    workDitherIdle: 5,
    workDitherPeak: 2,
    workDitherExit: 6,
  },
  Reveal: {
    workDitherBias: 0.0,
    workContrast: 1.6,
    workDitherIdle: 18,
    workDitherPeak: 1.5,
    workDitherExit: 18,
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
  'Quiet Crossing': {
    contactStripeScale: 30,
    contactLineWidth: 0.08,
    contactRotSpeed: 0.015,
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
  Recommended: { hero: 'Halo', about: 'Linen', work: 'Newsprint', contact: 'Quiet Crossing' },
  Loud: { hero: 'Ferrofluid', about: 'Swarm', work: 'Reveal', contact: 'Spirograph' },
  Editorial: { hero: 'Dilation', about: 'Halftone', work: 'Ghost', contact: 'Pinpoint' },
  Print: { hero: 'Bloom', about: 'Origami', work: 'Bleach', contact: 'Awning' },
};

export const HERO_PRESET_NAMES = Object.keys(HERO_PRESETS);
export const ABOUT_PRESET_NAMES = Object.keys(ABOUT_PRESETS);
export const WORK_PRESET_NAMES = Object.keys(WORK_PRESETS);
export const CONTACT_PRESET_NAMES = Object.keys(CONTACT_PRESETS);
export const COMBO_PRESET_NAMES = Object.keys(COMBO_PRESETS);
