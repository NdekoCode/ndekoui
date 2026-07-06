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
  {
    name: 'ai-product-02',
    title: 'Home for an AI app',
    description:
      'The start page of a signed-in AI product: counts roll in once, a question box answers its suggestions, quick actions sit in tiles, and the agents that need you arrive row by row, each with one action that checks itself off, beside cards for spend and finished tasks.',
    files: [
      'index.tsx',
      'figures.tsx',
      'ask-bar.tsx',
      'quick-actions.tsx',
      'needs-you.tsx',
      'trend-cards.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 1040,
  },
  {
    name: 'ai-product-03',
    title: 'Leads an agent enriches',
    description:
      'A leads table with sorting, search, status and owner filters, selection and pages, while an agent works down it: a row lights, a cell shimmers as its value is fetched, then the value settles into place and the count of enriched leads rolls.',
    files: [
      'index.tsx',
      'leads-table.tsx',
      'toolbar.tsx',
      'cell-states.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 780,
  },
  {
    name: 'ai-product-04',
    title: 'Launch perks',
    description:
      'Three perks of a launch offer under a live countdown: as people join, each claimed count rolls while its bar fills, and a claim turns its button into a drawn check.',
    files: [
      'index.tsx',
      'perk-card.tsx',
      'perk-marks.tsx',
      'countdown.tsx',
      'data.ts',
    ],
    previewHeight: 700,
  },
];
