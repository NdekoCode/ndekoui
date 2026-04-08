import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'pricing-01',
    title: 'Two plans with a billing switch',
    description:
      'A monthly and yearly segmented switch whose thumb travels while both prices change in place, over two plans with example prices.',
    files: ['index.tsx', 'plan-price.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'pricing-02',
    title: 'One plan with a feature table',
    description:
      'A per-seat plan whose seat count and monthly total slide when changed, beside a grouped table of everything it includes.',
    files: ['index.tsx', 'sliding-figure.tsx', 'feature-table.tsx', 'data.ts'],
    previewHeight: 860,
  },
];
