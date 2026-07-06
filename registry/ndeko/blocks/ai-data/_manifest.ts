import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'ai-data-01',
    title: 'Table you can ask',
    description:
      'A customer table you ask in plain words: the question lands as chips you take off one by one while the count rolls, with saved views, sorting, pages, a bulk bar that picks an owner in place and a summary that unfolds under its row word by word.',
    files: [
      'index.tsx',
      'ask-bar.tsx',
      'accounts-table.tsx',
      'bulk-bar.tsx',
      'ask.ts',
      'csv.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 900,
  },
  {
    name: 'ai-data-02',
    title: 'Calendar with an assistant',
    description:
      'A week of three calendars that finds the time: ask for 45 minutes with two people, the busy time of everyone is shaded, three numbered dashed slots land in the gaps with their reason, and Book turns the one you pick solid while the others leave, with five seconds to undo.',
    files: [
      'index.tsx',
      'week-calendar.tsx',
      'suggestion-panel.tsx',
      'ask.ts',
      'find.ts',
      'layout.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'ai-data-03',
    title: 'Sorted support inbox',
    description:
      'An inbox an agent has already been through: conversations sorted by topic with the reason for each, a drafted reply with its sources that you send, edit or rewrite, and on Send a check draws itself on the row, which dims where it stands and never moves.',
    files: [
      'index.tsx',
      'inbox-list.tsx',
      'reading-pane.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 880,
  },
];
