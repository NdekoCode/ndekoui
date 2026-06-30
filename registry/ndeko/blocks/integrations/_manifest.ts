import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'integrations-01',
    title: 'Integrations directory',
    description:
      'Tools by category with a search, where Connect becomes Connecting then Connected in the same pill, an approval error folds in under its card, and the grid closes ranks as cards leave a view.',
    files: ['index.tsx', 'integration-card.tsx', 'data.ts'],
    previewHeight: 820,
  },
];
