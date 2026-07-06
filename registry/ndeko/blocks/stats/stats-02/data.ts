export const SECTION = {
  label: 'Results',
  mission:
    'We write the first draft of every reply, so people spend their week on the judgment calls.',
  note: 'Every figure here is illustrative',
};

export type ResultId = 'handoff' | 'reply' | 'hours';

export type Result = {
  id: ResultId;
  value: number;
  fractionDigits: number;
  suffix: string;
  label: string;
  /** What the figure is measured against. A result without it would be a number floating in space. */
  compare: string;
};

export const RESULTS: Result[] = [
  {
    id: 'handoff',
    value: 62,
    fractionDigits: 0,
    suffix: '%',
    label: 'Fewer tickets handed over',
    compare: 'Compared with the quarter before the agents',
  },
  {
    id: 'reply',
    value: 3.4,
    fractionDigits: 1,
    suffix: '×',
    label: 'Faster first reply',
    compare: 'Compared with a queue answered only by people',
  },
  {
    id: 'hours',
    value: 38,
    fractionDigits: 0,
    suffix: ' h',
    label: 'Saved every week',
    compare: 'Compared with the hours spent drafting by hand',
  },
];

export const SCORE = {
  value: 87,
  title: 'Draft quality',
  period: 'Last 30 days',
  caption: 'Drafts sent as written, weighted by how much was edited',
};
