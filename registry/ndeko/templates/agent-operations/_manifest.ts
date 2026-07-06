import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'application-07',
    title: 'Agent operations',
    description:
      'A Sundermere operations page on one run: a header that condenses into a slim bar as the page scrolls, a live graph where an edge draws itself and a dot travels out and back for each call, a monitor with the command that waits for Allow or Deny, a budget bar that passes its 80% mark, a fleet that makes every panel follow the agent you pick, a trace waterfall and a board whose cards travel between lanes, in three columns that fold to one by container width. Plug your backend into onApprove and onDeny.',
    files: [
      'index.tsx',
      'agent-parts.tsx',
      'approval-block.tsx',
      'board.tsx',
      'budget.tsx',
      'data.ts',
      'fleet.tsx',
      'graph.tsx',
      'model.ts',
      'monitor.tsx',
      'page-header.tsx',
      'panel.tsx',
      'session.ts',
      'waterfall.tsx',
    ],
    previewHeight: 900,
  },
];
