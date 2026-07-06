import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  defaultDirectionOf,
  sortSentenceOf,
  type SortDirection,
  type SortKey,
} from './campaign-sort';
import { campaignOf, DEMO_CAMPAIGN, periodOf, type PeriodId } from './data';

export type MarketingState = {
  period: PeriodId;
  sortKey: SortKey;
  sortDirection: SortDirection;
  campaignId: string | null;
  isSidebarOpen: boolean;
  spoken: string;
};

export type MarketingAction =
  | { type: 'periodSet'; period: PeriodId }
  | { type: 'sorted'; key: SortKey }
  | { type: 'campaignSelected'; id: string | null }
  | { type: 'sidebar'; isOpen: boolean };

type Step = SessionStep<MarketingState, MarketingAction>;

export const INITIAL: MarketingState = {
  period: '6m',
  sortKey: 'leads',
  sortDirection: 'desc',
  campaignId: null,
  isSidebarOpen: false,
  spoken: '',
};

function flippedOf(direction: SortDirection): SortDirection {
  if (direction === 'asc') {
    return 'desc';
  }
  return 'asc';
}

/** Pressing the column a table is sorted by turns it round; any other column starts with its own natural order. */
function directionAfter(state: MarketingState, key: SortKey): SortDirection {
  if (key === state.sortKey) {
    return flippedOf(state.sortDirection);
  }
  return defaultDirectionOf(key);
}

function sorted(state: MarketingState, key: SortKey): MarketingState {
  const sortDirection = directionAfter(state, key);
  const spoken = sortSentenceOf(key, sortDirection);
  return { ...state, sortKey: key, sortDirection, spoken };
}

function spokenSelectionOf(id: string | null) {
  if (id === null) {
    return 'Selection cleared';
  }
  const campaign = campaignOf(id);
  return `${campaign.name} selected`;
}

export function reducer(
  state: MarketingState,
  action: MarketingAction
): MarketingState {
  switch (action.type) {
    case 'periodSet': {
      const { months } = periodOf(action.period);
      const spoken = `Showing the last ${months} months`;
      return { ...state, period: action.period, spoken };
    }
    case 'sorted':
      return sorted(state, action.key);
    case 'campaignSelected': {
      const spoken = spokenSelectionOf(action.id);
      return { ...state, campaignId: action.id, spoken };
    }
    case 'sidebar':
      return { ...state, isSidebarOpen: action.isOpen };
  }
}

const PERIOD_GAP_MS = 3400;

function periodStep(after: number, period: PeriodId): Step {
  return { after, by: 'demo', action: { type: 'periodSet', period } };
}

function sortStep(after: number, key: SortKey): Step {
  return {
    after,
    by: 'demo',
    press: `sort-${key}`,
    action: { type: 'sorted', key },
  };
}

export const SCRIPT: Step[] = [
  periodStep(2400, '12m'),
  periodStep(PERIOD_GAP_MS, '3m'),
  periodStep(PERIOD_GAP_MS, '6m'),
  sortStep(2800, 'spend'),
  sortStep(2400, 'cost'),
  sortStep(2400, 'leads'),
  {
    after: 2200,
    by: 'demo',
    press: `campaign-${DEMO_CAMPAIGN}`,
    action: { type: 'campaignSelected', id: DEMO_CAMPAIGN },
  },
];

const FINISHED = restingOf(INITIAL, SCRIPT, reducer);

/** Under reduced motion the page rests on six months, sorted by leads, with one campaign found in the table. */
export const RESTING: MarketingState = { ...FINISHED, spoken: '' };

export const LOOP_AFTER_MS = 3500;
