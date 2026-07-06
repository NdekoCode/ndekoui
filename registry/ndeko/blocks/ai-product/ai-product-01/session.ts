import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  periodOf,
  shareOf,
  USAGE,
  usedOf,
  percentOf,
  type PeriodId,
} from './data';

export type UsageState = {
  period: PeriodId;
  /** False until the first change: the bars are drawn full when the page loads and refill only after a change. */
  hasChanged: boolean;
  spoken: string;
};

export type UsageAction = { type: 'periodPicked'; period: PeriodId };

type Step = SessionStep<UsageState, UsageAction>;

export const INITIAL: UsageState = {
  period: 'month',
  hasChanged: false,
  spoken: '',
};

function spokenPeriodOf(id: PeriodId) {
  const usage = USAGE[id];
  const used = usedOf(usage);
  const share = shareOf(used, usage.limit);
  const percent = percentOf(share);
  const name = periodOf(id).spoken;
  return `Showing ${name}: ${used} of ${usage.limit} credits used, ${percent}%`;
}

function periodPicked(state: UsageState, period: PeriodId): UsageState {
  if (state.period === period) {
    return state;
  }
  return { period, hasChanged: true, spoken: spokenPeriodOf(period) };
}

export function reducer(state: UsageState, action: UsageAction): UsageState {
  switch (action.type) {
    case 'periodPicked':
      return periodPicked(state, action.period);
  }
}

function picks(after: number, period: PeriodId): Step {
  return {
    after,
    by: 'demo',
    press: `period-${period}`,
    action: { type: 'periodPicked', period },
  };
}

/** The month is where the block rests, so a round ends on it and the next one starts from it. */
export const SCRIPT: Step[] = [
  picks(2800, 'today'),
  picks(3000, 'week'),
  picks(3000, 'month'),
];

export const RESTING: UsageState = INITIAL;

export const LOOP_AFTER_MS = 3200;
