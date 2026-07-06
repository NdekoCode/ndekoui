import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'boards-01',
    title: 'Kanban board',
    description:
      'Tinted lanes that scroll on their own, cards with property chips, issue types and worked time, dragged between lanes with the keyboard or the pointer.',
    files: [
      'index.tsx',
      'board-lane.tsx',
      'card-parts.tsx',
      'drag-overlay-card.tsx',
      'board-moves.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'boards-02',
    title: 'Board with hidden columns and filters',
    description:
      'The same board with folded lanes gathered at the end, still taking drops, and filters that float one pill with the hidden count and Clear filters.',
    files: [
      'index.tsx',
      'board-lane.tsx',
      'card-parts.tsx',
      'drag-overlay-card.tsx',
      'board-moves.ts',
      'board-filters.ts',
      'filter-menu.tsx',
      'filter-pill.tsx',
      'hidden-columns.tsx',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'boards-03',
    title: 'Board with limits and swimlanes',
    description:
      'Columns that count against their limits, where a column past its limit tints its header and rolls its count to Over by 1; cards move with the pointer, touch or the keyboard, gather into one lane per person and glide back onto the board, and a quick add at the foot of a column takes Enter and leaves on Escape.',
    files: [
      'index.tsx',
      'board-grid.tsx',
      'task-card.tsx',
      'board-dnd.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
];
