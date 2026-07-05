import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'agent-ops-01',
    title: 'Agents overview',
    description:
      'A day of agents at a glance: totals that roll between Today and 7 days, requests approved in place, a fleet whose rows unfold their sub-agents, and when the last request leaves a check draws itself where the list was.',
    files: [
      'index.tsx',
      'totals.tsx',
      'needs-you.tsx',
      'fleet.tsx',
      'spend.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 900,
  },
  {
    name: 'agent-ops-02',
    title: 'Evals before shipping',
    description:
      'A candidate prompt against the one in production: Run evals fills the grid cell by cell while the pass rate rolls, a regression opens both replies side by side with the failing part marked, and Ship waits until each one is decided.',
    files: [
      'index.tsx',
      'versions.tsx',
      'case-grid.tsx',
      'case-detail.tsx',
      'cells.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 920,
  },
  {
    name: 'agent-ops-03',
    title: 'AI service status',
    description:
      'A status page for an AI product: one uptime bar per service read day by day, p50 and p95 lines that glide to the service you pick, and an incident that writes its updates until the orb turns green again.',
    files: [
      'index.tsx',
      'services.tsx',
      'latency-chart.tsx',
      'incidents.tsx',
      'subscribe.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 940,
  },
  {
    name: 'agent-ops-04',
    title: 'MCP servers',
    description:
      'The servers an agent can reach, each unfolding its tools with Enabled and Ask first switches: Reconnect becomes a spinner then Connected, and the Add server dialog resizes from Testing to Failed with the reason, then to Connected with its tools.',
    files: [
      'index.tsx',
      'server-row.tsx',
      'add-server-dialog.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 820,
  },
  {
    name: 'agent-ops-05',
    title: 'MCP install',
    description:
      'Pick an editor and its exact config crossfades in, Remote or Local and the project switch light the lines they change, and after Copy the edge of the card takes the colour of that editor and waits for its first connection.',
    files: [
      'index.tsx',
      'choices.tsx',
      'config-block.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 620,
  },
  {
    name: 'agent-ops-06',
    title: 'Webhooks',
    description:
      'Endpoints beside the detail of the one you pick: a failed delivery opens its response, payload and headers, Retry turns into a spinner then Delivered while the delivery rate rolls back up, and a new endpoint shows its signing secret once.',
    files: [
      'index.tsx',
      'endpoint-list.tsx',
      'endpoint-detail.tsx',
      'inspector.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 900,
  },
  {
    name: 'agent-ops-07',
    title: 'Agent builder',
    description:
      'One agent on a card, with its model, instructions, tools and knowledge files that upload, and a Test tab that answers: Publish opens what changed and three sample prompts that run, fails once, then Retry draws the check of the new live version.',
    files: [
      'index.tsx',
      'configure.tsx',
      'test-chat.tsx',
      'review-panel.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 860,
  },
  {
    name: 'agent-ops-08',
    title: 'Agent board',
    description:
      'A run as three lanes: when an agent hands in its work the card travels to Needs review, Approve sends it on to Done, Request changes sends it back with a note, and cards also move by drag or from their menu.',
    files: ['index.tsx', 'lane.tsx', 'task-card.tsx', 'session.ts', 'data.ts'],
    previewHeight: 720,
  },
  {
    name: 'agent-ops-09',
    title: 'Run pivot',
    description:
      'A pivot table over agent runs: a field chip flies from the list into Rows, Columns, Values or Filters and the shaded table regroups while it is still held, with subtotals, folding groups, Swap, a CSV export and a question box that fills the wells.',
    files: [
      'index.tsx',
      'wells.tsx',
      'field-chip.tsx',
      'pivot-table.tsx',
      'pivot.ts',
      'ask.ts',
      'csv.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 880,
  },
];
