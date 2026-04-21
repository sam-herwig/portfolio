export type EggId = 'trailhead' | 'owl' | 'ember' | 'pennant' | 'station-stamp' | 'margin-note' | 'cairn' | 'notebook';

export type EggZone = 'hero' | 'forest' | 'camp' | 'alpine' | 'summit' | 'case-study' | 'hidden';

export interface EggDescriptor {
  id: EggId;
  label: string;
  zone: EggZone;
  selector: string;
}

export const EGG_REGISTRY: readonly EggDescriptor[] = [
  { id: 'trailhead', label: 'Trailhead Stamp', zone: 'hero', selector: '[data-egg="trailhead"]' },
  { id: 'owl', label: 'Forest Owl', zone: 'forest', selector: '[data-egg="owl"]' },
  { id: 'ember', label: 'Camp Ember', zone: 'camp', selector: '[data-egg="ember"]' },
  { id: 'pennant', label: 'Summit Pennant', zone: 'summit', selector: '[data-egg="pennant"]' },
  {
    id: 'station-stamp',
    label: 'Trail Station Stamp',
    zone: 'case-study',
    selector: '[data-egg="station-stamp"]',
  },
  { id: 'margin-note', label: 'Margin Note', zone: 'case-study', selector: '[data-egg="margin-note"]' },
  { id: 'cairn', label: 'Cairn', zone: 'alpine', selector: '[data-egg="cairn"]' },
  { id: 'notebook', label: "Ranger's Notebook", zone: 'hidden', selector: '[data-egg="notebook"]' },
];

export const EGG_RANGE_PX = 300;
