export type DisplayMode = 'percent' | 'customers';

export type CohortSeed = {
  id: string;
  /** The Monday the cohort signed up. */
  label: string;
  size: number;
};

export const REPORT = {
  title: 'Retention',
  workspace: 'Tidepool Coffee subscriptions',
};

export const WEEK_COUNT = 8;

export const DISPLAY_MODES: { id: DisplayMode; label: string }[] = [
  { id: 'percent', label: 'Percent' },
  { id: 'customers', label: 'Customers' },
];

/** Share of a cohort still subscribed after each week, before each cohort's own drift. */
export const BASE_CURVE = [1, 0.64, 0.53, 0.47, 0.43, 0.4, 0.38, 0.37];

export const COHORTS: CohortSeed[] = [
  { id: 'sep-01', label: 'Sep 1', size: 1180 },
  { id: 'sep-08', label: 'Sep 8', size: 1242 },
  { id: 'sep-15', label: 'Sep 15', size: 1096 },
  { id: 'sep-22', label: 'Sep 22', size: 1320 },
  { id: 'sep-29', label: 'Sep 29', size: 1275 },
  { id: 'oct-06', label: 'Oct 6', size: 1408 },
  { id: 'oct-13', label: 'Oct 13', size: 1361 },
  { id: 'oct-20', label: 'Oct 20', size: 1452 },
];

export const INITIAL_SELECTION = { cohortIndex: 2, week: 3 };
