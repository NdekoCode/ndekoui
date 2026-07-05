import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'agent-review-01',
    title: 'Task to merge',
    description:
      'A task laid out like an issue: the status chip rolls from Planned to Merged while the activity grows, one approval starts the work, a failed check is re-run and Merge becomes Merging, then Merged.',
    files: ['index.tsx', 'timeline.tsx', 'checks.tsx', 'session.ts', 'data.ts'],
    previewHeight: 860,
  },
  {
    name: 'agent-review-02',
    title: 'Code review with agent replies',
    description:
      'A file diff where a comment on a line gets a reply with a suggested change: Apply suggestion becomes Applied in a commit, the new lines light up in the file and the thread folds once resolved.',
    files: ['index.tsx', 'thread.tsx', 'session.ts', 'data.ts'],
    previewHeight: 860,
  },
  {
    name: 'agent-review-03',
    title: 'Document extract',
    description:
      'A purchase order beside the typed fields read from it: values stream in with a confidence, a thread draws from a value to its box on the page, doubtful values wait for a confirm or an edit and Accept all becomes Saved.',
    files: ['index.tsx', 'document.tsx', 'fields.tsx', 'session.ts', 'data.ts'],
    previewHeight: 780,
  },
  {
    name: 'agent-review-04',
    title: 'Computer use session',
    description:
      'An agent working in a browser drawn on the page: its named pointer glides from one control to the next, every action is a frame you can scrub back to, you can pause or take over, and the payment waits for your yes.',
    files: ['index.tsx', 'browser.tsx', 'session.ts', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'agent-review-05',
    title: 'Agents in a document',
    description:
      'Two agents edit a brief like teammates: a named pointer glides to a paragraph and its suggestion types itself in as a tracked change, a margin comment arrives after a typing mark, and a table lists every change.',
    files: ['index.tsx', 'doc-parts.tsx', 'session.ts', 'data.ts'],
    previewHeight: 760,
  },
];
