import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'dashboards-01',
    title: 'Overview with a figures band',
    description:
      'Four figures that pick what one line chart draws, a period switch whose figures slide to their new value, and a CSV export built in the browser.',
    files: [
      'index.tsx',
      'metric-strip.tsx',
      'trend-chart.tsx',
      'chart-kit.tsx',
      'report-frame.tsx',
      'sliding-figure.tsx',
      'figures.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'dashboards-02',
    title: 'Weekly report',
    description:
      'Hours by day as rounded bars that move to the new week, days ahead as empty slots, and the projects ranked by share with rows that travel to their new place.',
    files: [
      'index.tsx',
      'day-bars.tsx',
      'project-ranking.tsx',
      'chart-kit.tsx',
      'report-frame.tsx',
      'sliding-figure.tsx',
      'figures.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'dashboards-03',
    title: 'Project health',
    description:
      'A sprint goal measured against where the team should be by today, and a short table of workstreams with their health and a filter for the ones that need attention.',
    files: [
      'index.tsx',
      'goal-card.tsx',
      'workstream-table.tsx',
      'report-frame.tsx',
      'sliding-figure.tsx',
      'figures.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
