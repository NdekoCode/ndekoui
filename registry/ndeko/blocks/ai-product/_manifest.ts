import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'ai-product-01',
    title: 'Usage and limits',
    description:
      'Where a workspace stands against its plan: switch the period and the stacked bar by model empties and refills to the limit mark while the daily bars grow from the baseline, with a meter for each other limit and an upgrade line that unfolds near the limit.',
    files: [
      'index.tsx',
      'usage-bar.tsx',
      'day-chart.tsx',
      'limit-rows.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 820,
  },
];
