import { create } from 'zustand';

export type QualityTier = 'ultra' | 'high' | 'medium';

interface QualityState {
  tier: QualityTier;
  setTier: (tier: QualityTier) => void;
}

function defaultTier(): QualityTier {
  if (typeof window === 'undefined') return 'ultra';
  const mobile = window.matchMedia('(max-width: 767px)').matches || window.navigator.maxTouchPoints > 0;
  return mobile ? 'high' : 'ultra';
}

export const useQualityStore = create<QualityState>((set) => ({
  tier: defaultTier(),
  setTier: (tier) => set({ tier }),
}));

export const qualityPresets = {
  ultra: {
    particleMultiplier: 1.0,
    enableDepthOfField: true,
    enableChromaticAberration: true,
    enableNoise: true,
    multisampling: 4,
  },
  high: {
    particleMultiplier: 1.0,
    enableDepthOfField: false,
    enableChromaticAberration: false,
    enableNoise: true,
    multisampling: 0,
  },
  medium: {
    particleMultiplier: 0.5,
    enableDepthOfField: false,
    enableChromaticAberration: false,
    enableNoise: false,
    multisampling: 0,
  },
} as const;
