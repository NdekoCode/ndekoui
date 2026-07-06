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

export type FigureId = 'close' | 'matched' | 'posted';

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
  title: 'What changes when agents do the matching',
  lead: 'Three figures from finance teams on Tallyhand, each with what sits behind it.',
  source:
    'Source: replace with the report these figures come from and its dates. Every figure here is illustrative.',
};

/** Invented figures. Each headline value agrees with the proof drawn under it. */
export const CLOSE: Figure = {
  id: 'close',
  label: 'Days to close the books',
  detail: 'From the last day of the month to the day the books are signed off',
  suffix: ' days',
  fractionDigits: 1,
  readings: {
    '90d': { value: 2.8, context: 'Down from 6.1 days in the 90 days before' },
    '12m': {
      value: 5.3,
      context: 'Down from 9.4 days in the 12 months before',
    },
  },
};

export const MATCHED: Figure = {
  id: 'matched',
  label: 'Bank lines matched without a person',
  detail: 'Lines paired with an invoice or a payout before anyone looked',
  suffix: '%',
  fractionDigits: 0,
  readings: {
    '90d': { value: 94, context: 'Up from 83% in the 90 days before' },
    '12m': { value: 91, context: 'Up from 62% in the 12 months before' },
  },
};

export const POSTED: Figure = {
  id: 'posted',
  label: 'Entries posted as drafted',
  detail: 'Journal entries approved without a single field changed',
  suffix: '%',
  fractionDigits: 0,
  readings: {
    '90d': { value: 92, context: 'Up from 81% in the 90 days before' },
    '12m': { value: 88, context: 'Up from 64% in the first month' },
  },
};

export const FIGURES: Figure[] = [CLOSE, MATCHED, POSTED];

/** Days to close: one point a week over 90 days, one a month over 12 months. */
export const CLOSE_TREND: Record<PeriodId, number[]> = {
  '90d': [3.5, 3.4, 3.3, 3.1, 3.0, 2.9, 2.8, 2.6, 2.5, 2.4, 2.3, 2.3],
  '12m': [8.6, 7.8, 7.1, 6.4, 5.8, 5.2, 4.7, 4.3, 3.9, 3.6, 3.3, 3.0],
};

export const CLOSE_TREND_MAX = 10;

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Share of bank lines matched without a person, by day of the week. Their mean is the headline. */
export const MATCHED_BY_WEEKDAY: Record<PeriodId, number[]> = {
  '90d': [94, 96, 96, 95, 94, 92, 91],
  '12m': [91, 93, 93, 92, 91, 89, 88],
};

export const EDIT_BUCKETS = [
  'No field changed',
  '1 field edited',
  'Several edited',
  'Rewritten',
];

/** How much people change a drafted entry before posting it. The first bucket is the headline. */
export const EDIT_SHARES: Record<PeriodId, number[]> = {
  '90d': [92, 5, 2, 1],
  '12m': [88, 7, 3, 2],
};
