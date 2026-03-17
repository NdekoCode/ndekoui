import type { BlockManifest } from '@/registry/ndeko/blocks/types';

const SHARED_FILES = [
  'column-labels.tsx',
  'draft-row.tsx',
  'empty-list.tsx',
  'filter-menu.tsx',
  'motion-parts.tsx',
  'property-menus.tsx',
  'scope-switch.tsx',
  'search-field.tsx',
  'task-glyphs.tsx',
  'task-grid.ts',
  'task-group.tsx',
  'task-model.ts',
  'task-row.tsx',
  'use-delayed-placement.ts',
  'data.ts',
];

export const manifest: BlockManifest = [
  {
    name: 'task-lists-01',
    title: 'Grouped task list',
    description:
      'Tasks grouped by status under sticky bands, on one grid shared with the column labels, with a scope switch, a search field on the slash key and a filter menu.',
    files: ['index.tsx', ...SHARED_FILES],
    previewHeight: 680,
  },
  {
    name: 'task-lists-02',
    title: 'Task list with bulk edits',
    description:
      'The grouped task list with row selection, shift-click ranges and a floating bar that changes the status, priority or assignees of every selected task.',
    files: ['index.tsx', 'selection-bar.tsx', ...SHARED_FILES],
    previewHeight: 680,
  },
];
