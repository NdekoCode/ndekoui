import { BRANDS } from '@/registry/ndeko/lib/brand-logos';

export type ToolId =
  | 'gmail'
  | 'notion'
  | 'linear'
  | 'github'
  | 'figma'
  | 'stripe'
  | 'zoom'
  | 'googledrive'
  | 'jira'
  | 'sentry'
  | 'loom'
  | 'dropbox';

export type Tool = {
  id: ToolId;
  name: string;
  kind: string;
  summary: string;
};

export const SECTION = {
  title: 'Bring your stack in one tool at a time',
  description:
    'Press a tool to see what Harbourline does with it, then connect it. Connected tools keep their colour, so the rows fill in as your stack comes together.',
};

type ToolSeed = {
  id: ToolId;
  kind: string;
  summary: string;
};

const SEEDS: ToolSeed[] = [
  {
    id: 'gmail',
    kind: 'Mail',
    summary:
      'Threads from your inbox become tasks, with the sender and the files attached.',
  },
  {
    id: 'notion',
    kind: 'Docs',
    summary:
      'Pages you link show their title and status on the task they belong to.',
  },
  {
    id: 'linear',
    kind: 'Issues',
    summary: 'Issues stay in step with Harbourline tasks, in both directions.',
  },
  {
    id: 'github',
    kind: 'Code',
    summary:
      'Pull requests attach to the task and close it when they are merged.',
  },
  {
    id: 'figma',
    kind: 'Design',
    summary:
      'Frames appear on the task as a live preview, never as a stale export.',
  },
  {
    id: 'stripe',
    kind: 'Payments',
    summary: 'Paid invoices mark their task as billed, with no copy and paste.',
  },
  {
    id: 'zoom',
    kind: 'Calls',
    summary: 'Meetings you start from a task keep their notes on that task.',
  },
  {
    id: 'googledrive',
    kind: 'Files',
    summary: 'Files you pick open from the task and stay in your own Drive.',
  },
  {
    id: 'jira',
    kind: 'Issues',
    summary:
      'Tickets sync their status to the card, so nobody updates two boards.',
  },
  {
    id: 'sentry',
    kind: 'Errors',
    summary: 'A new error opens a task with its stack trace already in it.',
  },
  {
    id: 'loom',
    kind: 'Video',
    summary:
      'Recordings play on the task, next to the comment that asked for them.',
  },
  {
    id: 'dropbox',
    kind: 'Files',
    summary: 'Shared folders show their latest files on the task.',
  },
];

export const TOOLS: Tool[] = SEEDS.map((seed) => ({
  ...seed,
  name: BRANDS[seed.id].title,
}));

export function toolOf(id: ToolId) {
  return TOOLS.find((tool) => tool.id === id);
}
