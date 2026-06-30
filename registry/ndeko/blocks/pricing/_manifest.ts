import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'pricing-01',
    title: 'Two plans with a billing switch',
    description:
      'A monthly and yearly segmented switch whose thumb travels while the digits of both prices roll to their new value, over two plans with example prices.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'pricing-02',
    title: 'One plan with a feature table',
    description:
      'A per-seat plan whose seat count and monthly total roll to their new value when changed, beside a grouped table of everything it includes.',
    files: ['index.tsx', 'feature-table.tsx', 'data.ts'],
    previewHeight: 860,
  },
];
