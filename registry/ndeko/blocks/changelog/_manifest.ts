import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'changelog-01',
    title: 'Release list with Load more',
    description:
      'Dated releases with their kind of change as chips, a summary and a short list, and a Load more that adds the next releases while it is still needed.',
    files: ['index.tsx', 'release-entry.tsx', 'data.ts'],
    previewHeight: 1100,
  },
];
