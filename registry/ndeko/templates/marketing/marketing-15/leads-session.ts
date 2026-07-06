import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import type { StageFilter } from './data';
import { sortedBy, type LeadsView, type SortKey } from './leads';

export type LeadsAction =
  { type: 'filtered'; stage: StageFilter } | { type: 'sorted'; key: SortKey };

type Step = SessionStep<LeadsView, LeadsAction>;

export const INITIAL: LeadsView = {
  stage: 'all',
  sortKey: null,
  direction: 'desc',
};

export const RESTING: LeadsView = {
  stage: 'all',
  sortKey: 'value',
  direction: 'desc',
};

export function reducer(view: LeadsView, action: LeadsAction): LeadsView {
  switch (action.type) {
    case 'filtered':
      return { ...view, stage: action.stage };
    case 'sorted':
      return sortedBy(view, action.key);
  }
}

export function sortPressKeyOf(key: SortKey) {
  return `sort-${key}`;
}

function sortStep(after: number, key: SortKey): Step {
  return {
    after,
    by: 'demo',
    press: sortPressKeyOf(key),
    action: { type: 'sorted', key },
  };
}

function filterStep(after: number, stage: StageFilter): Step {
  return { after, by: 'demo', action: { type: 'filtered', stage } };
}

const SCRIPT: Step[] = [
  sortStep(1600, 'value'),
  filterStep(1500, 'qualified'),
  filterStep(1700, 'all'),
  sortStep(1500, 'touch'),
  filterStep(1600, 'proposal'),
  filterStep(1700, 'all'),
];

export const SESSION: SessionConfig<LeadsView, LeadsAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 2400,
};
