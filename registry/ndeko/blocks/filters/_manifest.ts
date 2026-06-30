import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'filters-01',
    title: 'Amount filter over a histogram',
    description:
      'A popover that draws how the invoices spread by amount, lights the bars inside the range as the handles move, glides them to a common range and counts the matches before the list applies them.',
    files: [
      'index.tsx',
      'amount-filter.tsx',
      'invoice-model.ts',
      'motion-parts.tsx',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
