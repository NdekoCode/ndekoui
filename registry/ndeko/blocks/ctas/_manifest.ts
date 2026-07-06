import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'ctas-01',
    title: 'Call to action band',
    description:
      'One lifted band with a title, a short line and a single primary action, stacked on phones.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 320,
  },
  {
    name: 'ctas-02',
    title: 'Install command card',
    description:
      'A card with a package manager switch, the matching install command and a copy button whose icon swaps to a check.',
    files: ['index.tsx', 'command-row.tsx', 'data.ts'],
    previewHeight: 460,
  },
  {
    name: 'ctas-03',
    title: 'Call to action with a queue',
    description:
      'A closing band with an email field that checks, sends and confirms, beside a queue of conversations whose marks swap into drawn checks and whose rows dim into Done while the block is on screen.',
    files: [
      'index.tsx',
      'email-form.tsx',
      'queue-card.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 560,
  },
];
