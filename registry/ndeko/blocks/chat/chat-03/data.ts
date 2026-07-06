export type RunStep = 0 | 1 | 2 | 3 | 4 | 5;

export const finishedStep: RunStep = 5;

export type ScheduledStep = {
  step: RunStep;
  atMs: number;
};

export const runSchedule: ScheduledStep[] = [
  { step: 1, atMs: 500 },
  { step: 2, atMs: 1700 },
  { step: 3, atMs: 2000 },
  { step: 4, atMs: 3400 },
  { step: 5, atMs: 4000 },
];

export type ToolCall = {
  id: string;
  type: string;
  toolCallId: string;
  appearsAt: RunStep;
  doneAt: RunStep;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type CitedSource = {
  href: string;
  title: string;
  description: string;
};

export const asker = {
  name: 'Jonas Weber',
};

export const question =
  'Check the API reference against the changelog and tell me what changed in 2.4';

export const reasoning =
  'The API reference was last edited on 12 March, before 2.4 shipped, so it is probably behind. I will find the 2.4 entry in the changelog first, then read the parts of the API reference it touches: pagination, rate limits and the comment endpoints.';

export const thoughtLabel = 'Thought for 4 seconds';

export const answer = [
  'Three changes from 2.4 are missing from the API reference:',
  '',
  '1. **Pagination** on `/documents` moved from `page` to `cursor`.',
  '2. Workspace tokens now get 120 requests a minute instead of 60.',
  '3. `DELETE /comments/{id}` is new and not listed yet.',
  '',
  'The reference also still documents `archived=true` on `/spaces`, which 2.4 removed. I can draft the edits as suggestions on the page.',
].join('\n');

export const toolCalls: ToolCall[] = [
  {
    id: 'search',
    type: 'search_pages',
    toolCallId: 'call_7hq2',
    appearsAt: 1,
    doneAt: 2,
    input: { query: 'changelog 2.4', space: 'Engineering' },
    output: {
      matches: 3,
      best: 'Changelog / 2.4',
      updated: '2026-10-21',
    },
  },
  {
    id: 'read',
    type: 'read_page',
    toolCallId: 'call_9kd4',
    appearsAt: 3,
    doneAt: 4,
    input: { page: 'API reference', sections: ['Pagination', 'Rate limits'] },
    output: {
      words: 1240,
      lastEdited: '2026-03-12',
      endpoints: ['/documents', '/spaces', '/comments'],
    },
  },
];

export const sources: CitedSource[] = [
  {
    href: 'https://docs.quillstone.example/engineering/changelog#2-4',
    title: 'Changelog, 2.4',
    description:
      'Cursor pagination, higher limits for workspace tokens and comment deletion.',
  },
  {
    href: 'https://docs.quillstone.example/engineering/api-reference',
    title: 'API reference',
    description:
      'Endpoints, parameters and errors of the public API, last edited in March.',
  },
  {
    href: 'https://docs.quillstone.example/engineering/rate-limits',
    title: 'Rate limits',
    description:
      'How requests are counted per token and what happens past the limit.',
  },
];

export const reasoningWordMs = 55;
