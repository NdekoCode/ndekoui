import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'notifications-01',
    title: 'Inbox from a bell',
    description:
      'A bell with a dot while something is unread, opening an inbox where each row leads with the task, then the event, with read and archive actions in the place of the age.',
    files: ['index.tsx', 'inbox-row.tsx', 'inbox-glyphs.tsx', 'data.ts'],
    previewHeight: 600,
  },
  {
    name: 'notifications-02',
    title: 'Toasts in context',
    description:
      'Four small forms that each raise a toast through the Toaster of sonner.tsx: a success out of view, a failure with its reason and Retry, a loading toast that becomes its result, and an archive with Undo.',
    files: ['index.tsx', 'toast-tiles.tsx', 'motion-parts.tsx', 'data.ts'],
    previewHeight: 560,
  },
  {
    name: 'notifications-03',
    title: 'In-page notices',
    description:
      'Notices in the flow of a page, each with a status orb, one line, an action that resolves it in place and a quiet link to the source it is about.',
    files: ['index.tsx', 'notice.tsx', 'motion-parts.tsx', 'data.ts'],
    previewHeight: 640,
  },
  {
    name: 'notifications-04',
    title: 'Inbox with a reading pane',
    description:
      'Notifications grouped by day beside the one selected: read, archive with Undo, filter by unread or mentions, and reply in place.',
    files: [
      'index.tsx',
      'inbox-list.tsx',
      'notification-detail.tsx',
      'glyphs.tsx',
      'motion-parts.tsx',
      'data.ts',
    ],
    previewHeight: 680,
  },
];
