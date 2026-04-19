/**
 * Case study hero scenes — one unified woodcut illustration per project,
 * rendered through WoodcutShaderMaterial (matches the homepage hero pattern).
 */

const BASE = '/assets/graphics/case-study-heroes';

export const HERO_SCENES: Record<string, string> = {
  'new-belgium': `${BASE}/new-belgium.webp`,
  craftedkit: `${BASE}/craftedkit.webp`,
  'mission-bell': `${BASE}/mission-bell.webp`,
  'consume-and-create': `${BASE}/consume-and-create.webp`,
};

export const HERO_SCENES_MOBILE: Record<string, string> = {
  'new-belgium': `${BASE}/new-belgium-mobile.webp`,
  craftedkit: `${BASE}/craftedkit-mobile.webp`,
  'mission-bell': `${BASE}/mission-bell-mobile.webp`,
  'consume-and-create': `${BASE}/consume-and-create-mobile.webp`,
};

export const DEFAULT_HERO = HERO_SCENES['new-belgium'];
export const DEFAULT_HERO_MOBILE = HERO_SCENES_MOBILE['new-belgium'];
