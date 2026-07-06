import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'features-01',
    title: 'Alternating feature rows',
    description:
      'Three rows that swap sides on wide screens, each pairing a short text with an invoice, a reminder list or a payment list drawn from primitives.',
    files: ['index.tsx', 'feature-media.tsx', 'data.ts'],
    previewHeight: 1500,
  },
  {
    name: 'features-02',
    title: 'Six small features',
    description:
      'A split heading above six short items, each led by a key cap icon tile, two of them with their shortcut.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 640,
  },
  {
    name: 'features-03',
    title: 'Feature list with a live preview',
    description:
      'Four views in a list whose indicator travels to the picked one, beside a preview that resizes and crossfades to show it.',
    files: ['index.tsx', 'feature-previews.tsx', 'data.ts'],
    previewHeight: 700,
  },
  {
    name: 'features-04',
    title: 'Live features',
    description:
      'Five tiles of one agent run, each the working control: a prompt with a status tray, a plan that ticks, an approval that waits for you, a context ring that fills and a cost that rolls.',
    files: [
      'index.tsx',
      'approval-tile.tsx',
      'context-tile.tsx',
      'cost-tile.tsx',
      'plan-tile.tsx',
      'prompt-tile.tsx',
      'tile.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 1040,
  },
];
