import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'maps-01',
    title: 'Agent activity globe',
    description:
      'A dotted globe beside the live runs, tokens and spend of four regions: each hand-off turns the globe to show both regions and draws its arc between them while the counts roll in the list, and picking a region turns the globe back to it.',
    files: [
      'index.tsx',
      'globe-stage.tsx',
      'region-list.tsx',
      'geo.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 640,
  },
  {
    name: 'maps-02',
    title: 'Map of live runs',
    description:
      'A dotted world map of six regions joined by routes: each run handed off travels its route as a light in the colour of its agent and lands with a ring while the count rolls, and every region is a button whose bubble says how many runs it holds now.',
    files: [
      'index.tsx',
      'map-stage.tsx',
      'projection.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 600,
  },
];
