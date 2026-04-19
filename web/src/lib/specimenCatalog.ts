/**
 * Specimen catalog — the 24 original case-study sprite assets reborn as
 * editorial specimens, landmarks, and ornaments for the Field Journal layout.
 *
 * Each entry declares the sprite's new role in the case study flow:
 * - `specimen`: floats in the marginalia rail next to text blocks with Fig. N + Latin label
 * - `weather`: drifts horizontally at station footers as ambient motion
 * - `terrain`: watermark behind long text blocks
 * - `station-marker`: waypoint icon on TrailSpine + running counter glyph
 * - `landmark`: per-project signature washed behind Station III header
 * - `ink-wash`: transition ornament between stations
 * - `border-mask`: CSS mask for media/spotlight frames
 */

export type SpecimenRole =
  | 'specimen'
  | 'weather'
  | 'terrain'
  | 'station-marker'
  | 'landmark'
  | 'ink-wash'
  | 'border-mask';

export interface SpecimenEntry {
  src: string;
  role: SpecimenRole;
  figLabel: string;
  latinLabel: string;
  /** If tied to a specific project slug */
  slug?: string;
}

const BASE = '/assets/graphics/case-study';

export const SPECIMEN_CATALOG: SpecimenEntry[] = [
  /* ── Shared nature specimens ─────────────────────────────── */
  { src: `${BASE}/pine-tree-dense.webp`, role: 'specimen', figLabel: 'Fig. 01', latinLabel: 'Pinus ponderosa' },
  {
    src: `${BASE}/dead-tree-snag.webp`,
    role: 'specimen',
    figLabel: 'Fig. 02',
    latinLabel: 'Populus tremuloides, snag',
  },
  {
    src: `${BASE}/rock-boulder-cluster.webp`,
    role: 'specimen',
    figLabel: 'Fig. 03',
    latinLabel: 'Granite boulder cluster',
  },
  {
    src: `${BASE}/rock-jagged-outcrop.webp`,
    role: 'specimen',
    figLabel: 'Fig. 04',
    latinLabel: 'Schist outcrop, weathered',
  },
  {
    src: `${BASE}/wildflower-meadow-strip.webp`,
    role: 'specimen',
    figLabel: 'Fig. 05',
    latinLabel: 'Alpine meadow, mid-bloom',
  },

  /* ── Weather ─────────────────────────────────────────────── */
  { src: `${BASE}/cloud-cumulus-cluster.webp`, role: 'weather', figLabel: 'Weather', latinLabel: 'Cumulus humilis' },
  { src: `${BASE}/cloud-wispy-stratus.webp`, role: 'weather', figLabel: 'Weather', latinLabel: 'Cirrostratus veil' },

  /* ── Terrain backdrops ───────────────────────────────────── */
  { src: `${BASE}/ridgeline-distant.webp`, role: 'terrain', figLabel: 'Ridge', latinLabel: 'Distant horizon line' },
  { src: `${BASE}/ridgeline-close.webp`, role: 'terrain', figLabel: 'Ridge', latinLabel: 'Near ridge study' },
  { src: `${BASE}/terrain-rocky-trail.webp`, role: 'terrain', figLabel: 'Terrain', latinLabel: 'Rocky trail surface' },
  {
    src: `${BASE}/terrain-rolling-hillside.webp`,
    role: 'terrain',
    figLabel: 'Terrain',
    latinLabel: 'Rolling hillside',
  },

  /* ── Station marker ──────────────────────────────────────── */
  { src: `${BASE}/trail-marker-signpost.webp`, role: 'station-marker', figLabel: 'Waymark', latinLabel: 'Trail post' },

  /* ── Per-project landmarks + secondary specimens ─────────── */
  {
    src: `${BASE}/nb-rustic-cabin.webp`,
    role: 'landmark',
    figLabel: 'Landmark',
    latinLabel: 'Homestead cabin',
    slug: 'new-belgium',
  },
  {
    src: `${BASE}/nb-hop-vine.webp`,
    role: 'specimen',
    figLabel: 'Fig. 06',
    latinLabel: 'Humulus lupulus, cultivated',
    slug: 'new-belgium',
  },

  {
    src: `${BASE}/ck-crystalline-formation.webp`,
    role: 'landmark',
    figLabel: 'Landmark',
    latinLabel: 'Quartz formation',
    slug: 'craftedkit',
  },
  {
    src: `${BASE}/ck-circuit-fern.webp`,
    role: 'specimen',
    figLabel: 'Fig. 06',
    latinLabel: 'Polystichum acrostichoides, detail',
    slug: 'craftedkit',
  },

  {
    src: `${BASE}/mb-mission-bell-tower.webp`,
    role: 'landmark',
    figLabel: 'Landmark',
    latinLabel: 'Mission belltower',
    slug: 'mission-bell',
  },
  {
    src: `${BASE}/mb-desert-mesa.webp`,
    role: 'specimen',
    figLabel: 'Fig. 06',
    latinLabel: 'Sandstone mesa profile',
    slug: 'mission-bell',
  },

  {
    src: `${BASE}/cc-lighthouse.webp`,
    role: 'landmark',
    figLabel: 'Landmark',
    latinLabel: 'Cape lighthouse',
    slug: 'consume-and-create',
  },
  {
    src: `${BASE}/cc-coastal-cliff.webp`,
    role: 'specimen',
    figLabel: 'Fig. 06',
    latinLabel: 'Basalt sea cliff',
    slug: 'consume-and-create',
  },

  /* ── Transition + border textures ────────────────────────── */
  { src: `${BASE}/ink-wash-horizontal.webp`, role: 'ink-wash', figLabel: '—', latinLabel: 'Horizontal ink wash' },
  { src: `${BASE}/ink-wash-vertical.webp`, role: 'ink-wash', figLabel: '—', latinLabel: 'Vertical ink wash' },
  { src: `${BASE}/border-organic-edge.webp`, role: 'border-mask', figLabel: '—', latinLabel: 'Organic edge mask' },
  { src: `${BASE}/border-torn-edge.webp`, role: 'border-mask', figLabel: '—', latinLabel: 'Torn edge mask' },
];

/** Canonical paths exported as constants for callers that need specific sprites */
export const STATION_MARKER_SRC = `${BASE}/trail-marker-signpost.webp`;
export const INK_WASH_HORIZONTAL_SRC = `${BASE}/ink-wash-horizontal.webp`;
export const BORDER_TORN_SRC = `${BASE}/border-torn-edge.webp`;

/** Get the signature landmark sprite for a project slug */
export function getLandmarkForSlug(slug: string): string | undefined {
  return SPECIMEN_CATALOG.find((s) => s.role === 'landmark' && s.slug === slug)?.src;
}
