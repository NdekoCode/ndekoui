import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type AgentId = 'writer' | 'reviewer';

export type DocAgent = {
  id: AgentId;
  name: string;
  series: SeriesSlot;
};

export const AGENTS: Record<AgentId, DocAgent> = {
  writer: { id: 'writer', name: 'Writer', series: 3 },
  reviewer: { id: 'reviewer', name: 'Reviewer', series: 4 },
};

export const AGENT_ORDER: AgentId[] = ['writer', 'reviewer'];

export const DOC_TITLE = 'Invoice export: product brief';

export type ChangeId = 'c1' | 'c2';

export type TrackedChange = {
  id: ChangeId;
  author: AgentId;
  /** What the suggestion strikes out; empty for a pure insertion. */
  removed: string;
  inserted: string;
  /** A short name for the table. */
  summary: string;
};

export const CHANGES: Record<ChangeId, TrackedChange> = {
  c1: {
    id: 'c1',
    author: 'writer',
    removed: 'a button',
    inserted: 'an Export button in the invoices table',
    summary: 'Names where the button lives',
  },
  c2: {
    id: 'c2',
    author: 'writer',
    removed: '',
    inserted: ' within the first month',
    summary: 'Adds a deadline to the measure',
  },
};

export const CHANGE_ORDER: ChangeId[] = ['c1', 'c2'];

export type ParagraphId = 'problem' | 'proposal' | 'measure';

export type Segment = { text: string } | { change: ChangeId };

export type Paragraph = {
  id: ParagraphId;
  heading: string;
  segments: Segment[];
};

export const PARAGRAPHS: Paragraph[] = [
  {
    id: 'problem',
    heading: 'Problem',
    segments: [
      {
        text: 'Finance teams copy invoices into a spreadsheet by hand at the end of every month. It takes hours and the totals drift from what the app shows.',
      },
    ],
  },
  {
    id: 'proposal',
    heading: 'Proposal',
    segments: [
      { text: 'Add ' },
      { change: 'c1' },
      {
        text: ' that downloads what the current filters show, with dates in ISO format and amounts in the invoice currency.',
      },
    ],
  },
  {
    id: 'measure',
    heading: 'Success measure',
    segments: [
      { text: 'Half of the accounts with a finance seat use the export' },
      { change: 'c2' },
      { text: '.' },
    ],
  },
];

export const COMMENT = {
  author: 'reviewer' as AgentId,
  paragraph: 'problem' as ParagraphId,
  text: 'Which finance teams did we ask? A number here would make the case.',
  summary: 'Asks for a source on the problem',
};
