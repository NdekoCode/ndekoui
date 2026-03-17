import type { BlockManifest } from '@/registry/ndeko/blocks/types';

const SHARED_FILES = [
  'property-rows.tsx',
  'description-block.tsx',
  'child-issues.tsx',
  'task-feed.tsx',
  'comment-composer.tsx',
  'task-glyphs.tsx',
  'motion-parts.tsx',
  'use-copied.ts',
  'task-edits.ts',
  'detail-model.ts',
  'data.ts',
];

export const manifest: BlockManifest = [
  {
    name: 'task-detail-01',
    title: 'Task drawer',
    description:
      'A task opened in a sheet docked beside the page, with arrows that walk the list, properties to pick in place, child issues, a filtered feed and a comment field pinned at the foot.',
    files: ['index.tsx', 'drawer-bar.tsx', 'task-band.tsx', ...SHARED_FILES],
    previewHeight: 720,
  },
  {
    name: 'task-detail-02',
    title: 'Task page with a property rail',
    description:
      'The same task as a page: a reading column beside a rail of folding sections for properties, time and details, which joins the column on narrow screens.',
    files: [
      'index.tsx',
      'page-band.tsx',
      'rail-section.tsx',
      'time-summary.tsx',
      ...SHARED_FILES,
    ],
    previewHeight: 760,
  },
];
