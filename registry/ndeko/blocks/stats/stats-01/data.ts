export type PeriodId = '90d' | '12m';

export type Period = {
  id: PeriodId;
  label: string;
  spoken: string;
  trendPointName: string;
};

export const PERIODS: Period[] = [
  {
    id: '90d',
    label: 'Last 90 days',
    spoken: 'the last 90 days',
    trendPointName: 'Week',
  },
  {
    id: '12m',
    label: 'Last 12 months',
    spoken: 'the last 12 months',
    trendPointName: 'Month',
  },
];

export type Reading = {
  value: number;
  context: string;
};

export type FigureId = 'reply' | 'handoff' | 'drafts';

export type Figure = {
  id: FigureId;
  label: string;
  detail: string;
  suffix: string;
  fractionDigits: number;
  readings: Record<PeriodId, Reading>;
};

export const SECTION = {
  label: 'In numbers',
  title: 'What changes when every reply arrives drafted',
  lead: 'Three figures from support teams on Tidewell, each with what sits behind it.',
  source:
    'Source: replace with the report these figures come from and its dates. Every figure here is illustrative.',
};

/** Invented figures. Each headline value agrees with the proof drawn under it. */
export const REPLY: Figure = {
  id: 'reply',
  label: 'Median first reply',
  detail:
    'From the moment a ticket arrives to the first answer the customer reads',
  suffix: ' min',
  fractionDigits: 1,
  readings: {
    '90d': { value: 3.8, context: 'Down from 5.0 min in the 90 days before' },
    '12m': {
      value: 5.6,
      context: 'Down from 11.6 min in the 12 months before',
    },
  },
};

export const HANDOFF: Figure = {
  id: 'handoff',
  label: 'Resolved without a handoff',
  detail: 'Tickets closed by the first person who opened them',
  suffix: '%',
  fractionDigits: 0,
  readings: {
    '90d': { value: 68, context: 'Up from 61% in the 90 days before' },
    '12m': { value: 59, context: 'Up from 44% in the 12 months before' },
  },
};

export const DRAFTS: Figure = {
  id: 'drafts',
  label: 'Drafts sent as written',
  detail: 'Replies sent without a word changed, out of every reply drafted',
  suffix: '%',
  fractionDigits: 0,
  readings: {
    '90d': { value: 81, context: 'Up from 70% in the 90 days before' },
    '12m': { value: 74, context: 'Up from 52% in the first month' },
  },
};

export const FIGURES: Figure[] = [REPLY, HANDOFF, DRAFTS];

/** Median first reply in minutes: one point a week over 90 days, one a month over 12 months. */
export const REPLY_TREND: Record<PeriodId, number[]> = {
  '90d': [4.6, 4.4, 4.3, 4.1, 4.0, 3.9, 3.8, 3.8, 3.7, 3.6, 3.5, 3.4],
  '12m': [8.9, 8.1, 7.2, 6.5, 6.0, 5.7, 5.4, 5.0, 4.6, 4.3, 4.0, 3.8],
};

export const REPLY_TREND_MAX = 10;

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Share of tickets resolved without a handoff, by day of the week. Their mean is the headline. */
export const HANDOFF_BY_WEEKDAY: Record<PeriodId, number[]> = {
  '90d': [67, 71, 72, 70, 69, 65, 62],
  '12m': [58, 61, 62, 60, 59, 56, 57],
};

export const EDIT_BUCKETS = [
  'No change',
  '1 to 5 words',
  '6 to 20 words',
  'Rewritten',
];

/** How much people change a draft before sending it. The first bucket is the headline. */
export const EDIT_SHARES: Record<PeriodId, number[]> = {
  '90d': [81, 12, 5, 2],
  '12m': [74, 15, 7, 4],
};
