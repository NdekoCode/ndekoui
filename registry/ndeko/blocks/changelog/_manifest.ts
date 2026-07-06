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
  {
    name: 'changelog-02',
    title: 'Changelog by month',
    description:
      'Entries grouped under sticky month headers inside their own scroll frame, a month jump that follows the scroll, type filters with counts, details that open in place and a link to copy for every entry.',
    files: [
      'index.tsx',
      'entry-row.tsx',
      'filters.tsx',
      'month-nav.tsx',
      'use-month-spy.ts',
      'groups.ts',
      'hash.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
