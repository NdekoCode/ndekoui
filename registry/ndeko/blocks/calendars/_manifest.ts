import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'calendars-01',
    title: 'Calendar app',
    description:
      'A sidebar with a month that moves the main calendar and colour toggles that filter it, beside a calendar with day, week, month, year and agenda views',
    files: ['index.tsx', 'calendar-sidebar.tsx', 'data.ts'],
    previewHeight: 760,
  },
];
