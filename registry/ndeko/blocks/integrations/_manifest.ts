import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'integrations-01',
    title: 'Integrations directory',
    description:
      'Real tools with their marks, by category and with a search, where Connect becomes Connecting then Connected in the same pill, an approval error folds in under its card, and the grid closes ranks as cards leave a view.',
    files: ['index.tsx', 'integration-card.tsx', 'data.ts'],
    previewHeight: 1000,
  },
  {
    name: 'integrations-02',
    title: 'Integrations marquee',
    description:
      'Three rows of tool marks drifting at their own pace, the middle one the other way, under the product mark, with a heading, a line and one action.',
    files: ['index.tsx', 'fernhollow-mark.tsx', 'data.ts'],
    previewHeight: 680,
  },
  {
    name: 'integrations-03',
    title: 'Integration areas',
    description:
      'One card per area of tools with a short line, a tool count, a link and a cluster of round marks that float gently.',
    files: ['index.tsx', 'constellation.tsx', 'data.ts'],
    previewHeight: 720,
  },
];
