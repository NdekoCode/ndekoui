import {
  BASE_CURVE,
  COHORTS,
  WEEK_COUNT,
  type CohortSeed,
  type DisplayMode,
} from './data';

export type CohortCell = {
  week: number;
  retained: number;
  rate: number;
};

export type Cohort = CohortSeed & { cells: CohortCell[] };

export type WeekAverage = {
  week: number;
  rate: number;
  customers: number;
};

export type Selection = {
  cohortIndex: number;
  week: number;
};

const COUNT_FORMAT = new Intl.NumberFormat('en-US');

const SHADE_FLOOR = 6;

const SHADE_RANGE = 64;

export const WEEKS = Array.from({ length: WEEK_COUNT }, (_, week) => week);

/** Later cohorts keep a little more, and each week wobbles a point or two, so the grid reads like real data. */
function driftOf(cohortIndex: number, week: number) {
  const lift = cohortIndex * 0.012;
  const seed = (cohortIndex * 7 + week * 13) % 9;
  const wobble = (seed - 4) / 250;
  return lift + wobble;
}

function clampRate(rate: number) {
  const atMost = Math.min(rate, 1);
  return Math.max(atMost, 0);
}

function rateOf(cohortIndex: number, week: number) {
  if (week === 0) {
    return 1;
  }
  const drift = driftOf(cohortIndex, week);
  const drifted = BASE_CURVE[week] + drift;
  return clampRate(drifted);
}

export function weeksAvailableOf(cohortIndex: number) {
  return WEEK_COUNT - cohortIndex;
}

function cellsOf(seed: CohortSeed, cohortIndex: number) {
  const available = weeksAvailableOf(cohortIndex);
  const weeks = WEEKS.slice(0, available);
  return weeks.map((week) => {
    const rate = rateOf(cohortIndex, week);
    const retained = Math.round(seed.size * rate);
    const cell: CohortCell = { week, retained, rate: retained / seed.size };
    return cell;
  });
}

export const COHORT_ROWS: Cohort[] = COHORTS.map((seed, cohortIndex) => ({
  ...seed,
  cells: cellsOf(seed, cohortIndex),
}));

function averageOf(week: number): WeekAverage {
  let retained = 0;
  let size = 0;
  let cohortCount = 0;
  for (const cohort of COHORT_ROWS) {
    const cell = cohort.cells[week];
    if (cell) {
      retained += cell.retained;
      size += cohort.size;
      cohortCount += 1;
    }
  }
  return {
    week,
    rate: retained / size,
    customers: Math.round(retained / cohortCount),
  };
}

export const WEEK_AVERAGES: WeekAverage[] = WEEKS.map(averageOf);

export function formatCount(value: number) {
  return COUNT_FORMAT.format(value);
}

export function percentOf(rate: number) {
  return Math.round(rate * 100);
}

export function cellTextOf(mode: DisplayMode, rate: number, customers: number) {
  if (mode === 'customers') {
    return formatCount(customers);
  }
  return `${percentOf(rate)}%`;
}

/** One hue, deeper as more of the cohort stays. Capped so the label keeps its contrast in both themes. */
export function shadeOf(rate: number) {
  const mix = SHADE_FLOOR + rate * SHADE_RANGE;
  const rounded = Math.round(mix);
  return `color-mix(in oklab, var(--primary) ${rounded}%, transparent)`;
}

export function weekLabelOf(week: number) {
  if (week === 0) {
    return 'Sign-up week';
  }
  return `Week ${week}`;
}

export function cellOf(selection: Selection) {
  const cohort = COHORT_ROWS[selection.cohortIndex];
  const cell = cohort.cells[selection.week];
  return { cohort, cell };
}

function clampWeek(cohortIndex: number, week: number) {
  const lastWeek = weeksAvailableOf(cohortIndex) - 1;
  const atMost = Math.min(week, lastWeek);
  return Math.max(atMost, 0);
}

function clampCohort(cohortIndex: number) {
  const lastCohort = COHORT_ROWS.length - 1;
  const atMost = Math.min(cohortIndex, lastCohort);
  return Math.max(atMost, 0);
}

function rawTargetOf(selection: Selection, key: string): Selection | null {
  const { cohortIndex, week } = selection;
  if (key === 'ArrowRight') {
    return { cohortIndex, week: week + 1 };
  }
  if (key === 'ArrowLeft') {
    return { cohortIndex, week: week - 1 };
  }
  if (key === 'Home') {
    return { cohortIndex, week: 0 };
  }
  if (key === 'End') {
    return { cohortIndex, week: WEEK_COUNT };
  }
  if (key === 'ArrowDown') {
    return { cohortIndex: cohortIndex + 1, week };
  }
  if (key === 'ArrowUp') {
    return { cohortIndex: cohortIndex - 1, week };
  }
  return null;
}

/** Moves the selection the way the key points, staying on weeks that already happened. */
export function movedSelection(selection: Selection, key: string) {
  const target = rawTargetOf(selection, key);
  if (!target) {
    return null;
  }
  const cohortIndex = clampCohort(target.cohortIndex);
  const week = clampWeek(cohortIndex, target.week);
  const moved: Selection = { cohortIndex, week };
  return moved;
}

export function sameSelection(first: Selection, second: Selection) {
  const sameCohort = first.cohortIndex === second.cohortIndex;
  const sameWeek = first.week === second.week;
  return sameCohort && sameWeek;
}

export function cellKeyOf(selection: Selection) {
  return `${selection.cohortIndex}-${selection.week}`;
}
