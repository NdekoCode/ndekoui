import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'search-01',
    title: 'Search results',
    description:
      'Search over a local index with the count and the real time it took, type facets, pages of results with their breadcrumbs and matches marked, and a correction when nothing matches: each letter you type narrows the results while every facet count rolls, and the arrows walk a highlight through them for Enter to open.',
    files: ['index.tsx', 'results.tsx', 'search.ts', 'session.ts', 'data.ts'],
    previewHeight: 860,
  },
];
