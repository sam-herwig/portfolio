export type EggId = 'grove' | 'creek';

export type EggZone = 'forest' | 'trailFork';

export interface EggDescriptor {
  id: EggId;
  label: string;
  zone: EggZone;
  selector: string;
}

export const EGG_REGISTRY: readonly EggDescriptor[] = [
  { id: 'grove', label: 'The Grove', zone: 'forest', selector: '[data-egg="grove"]' },
  { id: 'creek', label: 'The Creek', zone: 'trailFork', selector: '[data-egg="creek"]' },
];

export const EGG_RANGE_PX = 300;
