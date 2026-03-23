export type PeriodId = 'days' | 'weeks' | 'months';

export type MetricId = 'tracked' | 'closed' | 'billable' | 'review';

export type PeriodPoint = {
  axisLabel: string;
  label: string;
};

export type Period = {
  id: PeriodId;
  switchLabel: string;
  label: string;
  unitPlural: string;
  perUnit: string;
  fileSlug: string;
  points: PeriodPoint[];
};

export type MetricDefinition = {
  id: MetricId;
  label: string;
  chartTitle: string;
  csvHeading: string;
  aggregate: 'sum' | 'average';
  change: 'percent' | 'points' | 'hours-lower-is-better';
  suffix: string;
};

export type MetricSeries = {
  values: number[];
  previousTotal: number;
};

export const WORKSPACE = {
  name: 'Tidewell Studio',
  peopleCount: 14,
};

export const PERIODS: Period[] = [
  {
    id: 'days',
    switchLabel: 'Days',
    label: 'Last 12 working days',
    unitPlural: 'working days',
    perUnit: 'per working day',
    fileSlug: 'last-12-working-days',
    points: [
      { axisLabel: '20 Oct', label: 'Tuesday 20 October' },
      { axisLabel: '21 Oct', label: 'Wednesday 21 October' },
      { axisLabel: '22 Oct', label: 'Thursday 22 October' },
      { axisLabel: '23 Oct', label: 'Friday 23 October' },
      { axisLabel: '26 Oct', label: 'Monday 26 October' },
      { axisLabel: '27 Oct', label: 'Tuesday 27 October' },
      { axisLabel: '28 Oct', label: 'Wednesday 28 October' },
      { axisLabel: '29 Oct', label: 'Thursday 29 October' },
      { axisLabel: '30 Oct', label: 'Friday 30 October' },
      { axisLabel: '2 Nov', label: 'Monday 2 November' },
      { axisLabel: '3 Nov', label: 'Tuesday 3 November' },
      { axisLabel: '4 Nov', label: 'Wednesday 4 November' },
    ],
  },
  {
    id: 'weeks',
    switchLabel: 'Weeks',
    label: 'Last 12 weeks',
    unitPlural: 'weeks',
    perUnit: 'per week',
    fileSlug: 'last-12-weeks',
    points: [
      { axisLabel: 'W33', label: 'Week 33, 10 to 16 August' },
      { axisLabel: 'W34', label: 'Week 34, 17 to 23 August' },
      { axisLabel: 'W35', label: 'Week 35, 24 to 30 August' },
      { axisLabel: 'W36', label: 'Week 36, 31 August to 6 September' },
      { axisLabel: 'W37', label: 'Week 37, 7 to 13 September' },
      { axisLabel: 'W38', label: 'Week 38, 14 to 20 September' },
      { axisLabel: 'W39', label: 'Week 39, 21 to 27 September' },
      { axisLabel: 'W40', label: 'Week 40, 28 September to 4 October' },
      { axisLabel: 'W41', label: 'Week 41, 5 to 11 October' },
      { axisLabel: 'W42', label: 'Week 42, 12 to 18 October' },
      { axisLabel: 'W43', label: 'Week 43, 19 to 25 October' },
      { axisLabel: 'W44', label: 'Week 44, 26 October to 1 November' },
    ],
  },
  {
    id: 'months',
    switchLabel: 'Months',
    label: 'Last 12 months',
    unitPlural: 'months',
    perUnit: 'per month',
    fileSlug: 'last-12-months',
    points: [
      { axisLabel: 'Nov', label: 'November 2025' },
      { axisLabel: 'Dec', label: 'December 2025' },
      { axisLabel: 'Jan', label: 'January 2026' },
      { axisLabel: 'Feb', label: 'February 2026' },
      { axisLabel: 'Mar', label: 'March 2026' },
      { axisLabel: 'Apr', label: 'April 2026' },
      { axisLabel: 'May', label: 'May 2026' },
      { axisLabel: 'Jun', label: 'June 2026' },
      { axisLabel: 'Jul', label: 'July 2026' },
      { axisLabel: 'Aug', label: 'August 2026' },
      { axisLabel: 'Sep', label: 'September 2026' },
      { axisLabel: 'Oct', label: 'October 2026' },
    ],
  },
];

export const METRICS: MetricDefinition[] = [
  {
    id: 'tracked',
    label: 'Tracked time',
    chartTitle: 'Hours tracked',
    csvHeading: 'Tracked time (hours)',
    aggregate: 'sum',
    change: 'percent',
    suffix: 'h',
  },
  {
    id: 'closed',
    label: 'Tasks closed',
    chartTitle: 'Tasks closed',
    csvHeading: 'Tasks closed',
    aggregate: 'sum',
    change: 'percent',
    suffix: '',
  },
  {
    id: 'billable',
    label: 'Billable share',
    chartTitle: 'Billable share of tracked time',
    csvHeading: 'Billable share (%)',
    aggregate: 'average',
    change: 'points',
    suffix: '%',
  },
  {
    id: 'review',
    label: 'Time in review',
    chartTitle: 'Average time in review',
    csvHeading: 'Time in review (hours)',
    aggregate: 'average',
    change: 'hours-lower-is-better',
    suffix: 'h',
  },
];

export const SERIES: Record<PeriodId, Record<MetricId, MetricSeries>> = {
  days: {
    tracked: {
      values: [78, 84, 81, 69, 88, 91, 86, 72, 80, 93, 89, 85],
      previousTotal: 948,
    },
    closed: {
      values: [14, 17, 12, 9, 19, 21, 16, 11, 15, 22, 18, 17],
      previousTotal: 176,
    },
    billable: {
      values: [66, 71, 69, 64, 72, 74, 70, 65, 68, 75, 73, 71],
      previousTotal: 67,
    },
    review: {
      values: [9, 7, 11, 14, 8, 6, 9, 12, 10, 7, 8, 9],
      previousTotal: 11,
    },
  },
  weeks: {
    tracked: {
      values: [402, 418, 436, 391, 447, 452, 438, 429, 461, 455, 470, 444],
      previousTotal: 5120,
    },
    closed: {
      values: [71, 78, 84, 66, 90, 88, 79, 83, 95, 87, 102, 91],
      previousTotal: 1046,
    },
    billable: {
      values: [63, 65, 68, 61, 70, 69, 67, 66, 71, 70, 72, 69],
      previousTotal: 66,
    },
    review: {
      values: [16, 14, 13, 18, 12, 11, 13, 12, 10, 11, 9, 10],
      previousTotal: 15,
    },
  },
  months: {
    tracked: {
      values: [
        1710, 1520, 1880, 1840, 1795, 1905, 1870, 1610, 1490, 1930, 1985, 2010,
      ],
      previousTotal: 20180,
    },
    closed: {
      values: [312, 268, 344, 351, 330, 372, 365, 290, 274, 381, 398, 412],
      previousTotal: 3720,
    },
    billable: {
      values: [61, 58, 64, 63, 62, 66, 65, 59, 57, 67, 68, 69],
      previousTotal: 61,
    },
    review: {
      values: [22, 25, 19, 18, 17, 16, 15, 19, 21, 14, 12, 11],
      previousTotal: 21,
    },
  },
};
