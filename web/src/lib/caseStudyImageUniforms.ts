import { Color } from 'three';

export interface CaseStudyImageUniformValues {
  tint: Color;
  paper: Color;
  dotDensity: number;
  ditherStrength: number;
  velocityGain: number;
  channelOffset: number;
}

const PAPER_DEFAULT = new Color('#0a0a0a');

const RAW: Record<string, Omit<CaseStudyImageUniformValues, 'tint' | 'paper'> & { tint: string; paper?: string }> = {
  'new-belgium': {
    tint: '#c8842a',
    dotDensity: 32,
    ditherStrength: 0.55,
    velocityGain: 0.6,
    channelOffset: 1.5,
  },
  'mission-bell': {
    tint: '#6b4a8c',
    dotDensity: 48,
    ditherStrength: 0.7,
    velocityGain: 0.4,
    channelOffset: 1.0,
  },
  'consume-and-create': {
    tint: '#e8e4da',
    dotDensity: 24,
    ditherStrength: 0.85,
    velocityGain: 0.9,
    channelOffset: 3.0,
  },
  craftedkit: {
    tint: '#ff6b35',
    dotDensity: 40,
    ditherStrength: 0.45,
    velocityGain: 0.7,
    channelOffset: 2.0,
  },
};

const TABLE: Record<string, CaseStudyImageUniformValues> = Object.fromEntries(
  Object.entries(RAW).map(([slug, v]) => [
    slug,
    {
      tint: new Color(v.tint),
      paper: v.paper ? new Color(v.paper) : PAPER_DEFAULT,
      dotDensity: v.dotDensity,
      ditherStrength: v.ditherStrength,
      velocityGain: v.velocityGain,
      channelOffset: v.channelOffset,
    },
  ]),
);

const FALLBACK: CaseStudyImageUniformValues = TABLE['new-belgium'];

export function getImageUniforms(slug: string): CaseStudyImageUniformValues {
  return TABLE[slug] ?? FALLBACK;
}
