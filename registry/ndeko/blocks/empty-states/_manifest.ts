import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'empty-states-01',
    title: 'Empty list with one action',
    description:
      'A project list with nothing in it yet: one sentence on what is missing and the action that adds the first project, which then takes the place of the empty slot.',
    files: ['index.tsx', 'project-rows.tsx', 'motion-parts.tsx'],
    previewHeight: 460,
  },
  {
    name: 'empty-states-02',
    title: 'Search with no results',
    description:
      'A people list whose search and role filter match nobody, saying what is applied and how to get everyone back with Clear filters.',
    files: ['index.tsx', 'motion-parts.tsx', 'data.ts'],
    previewHeight: 520,
  },
  {
    name: 'empty-states-03',
    title: 'Block that failed to load',
    description:
      'A page of cards where one block failed (simulated) and shows a notice with Retry, while the other cards keep working.',
    files: [
      'index.tsx',
      'activity-card.tsx',
      'working-cards.tsx',
      'dashboard-card.tsx',
      'people.ts',
      'motion-parts.tsx',
      'data.ts',
    ],
    previewHeight: 640,
  },
];
