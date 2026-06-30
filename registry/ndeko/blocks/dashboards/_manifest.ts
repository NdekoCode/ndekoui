import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'dashboards-01',
    title: 'Overview with a figures band',
    description:
      'Four figures that pick what one line chart draws, a period switch whose figures roll to their new value, and a CSV export built in the browser.',
    files: [
      'index.tsx',
      'metric-strip.tsx',
      'trend-chart.tsx',
      'chart-kit.tsx',
      'report-frame.tsx',
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
      'duration-figure.tsx',
      'chart-kit.tsx',
      'report-frame.tsx',
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
      'figures.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'dashboards-04',
    title: 'Retention cohorts',
    description:
      'Weekly sign-up cohorts as a grid shaded by how many still subscribe, weeks to come as empty slots, a selection ring that travels with the arrow keys and a panel whose figure rolls to the picked week.',
    files: [
      'index.tsx',
      'cohort-table.tsx',
      'cohort-panel.tsx',
      'cohort-model.ts',
      'data.ts',
    ],
    previewHeight: 640,
  },
];
