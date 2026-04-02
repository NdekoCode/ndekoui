import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'logo-clouds-01',
    title: 'Marquee of placeholder marks',
    description:
      'Neutral drawn marks with fictional names that scroll in a continuous loop, pause under the pointer and wrap into a still row when motion is reduced.',
    files: ['index.tsx', 'mark-shape.tsx', 'data.ts'],
    previewHeight: 260,
  },
  {
    name: 'logo-clouds-02',
    title: 'Static row of placeholder marks',
    description:
      'A short line on the left and six drawn marks with fictional names in one row, two columns on phones.',
    files: ['index.tsx', 'mark-shape.tsx', 'data.ts'],
    previewHeight: 300,
  },
];
