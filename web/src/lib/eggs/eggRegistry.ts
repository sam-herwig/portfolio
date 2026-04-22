export type EggId = 'grove';

export type EggZone = 'forest';

export interface EggDescriptor {
  id: EggId;
  label: string;
  zone: EggZone;
  selector: string;
}

export const EGG_REGISTRY: readonly EggDescriptor[] = [
  { id: 'grove', label: 'The Grove', zone: 'forest', selector: '[data-egg="grove"]' },
];

export const EGG_RANGE_PX = 300;
