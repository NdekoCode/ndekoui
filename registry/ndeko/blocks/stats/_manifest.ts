import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'stats-01',
    title: 'Figures band',
    description:
      'Three illustrative figures with their labels, a detail line, a proof drawn under each and a source footnote: switch the period and every figure rolls to its new value while the trend line glides and the bars rise or fall, and hover or focus brings up what each figure is compared to.',
    files: [
      'index.tsx',
      'figure-cell.tsx',
      'proofs.tsx',
      'period-switch.tsx',
      'data.ts',
    ],
    previewHeight: 740,
  },
];
