import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import {
  FEED_EVENTS,
  FEED_START_CENTS,
  FEED_VISIBLE,
  YOUR_SHARE,
  type FeedEvent,
} from './data';

export type FeedState = {
  arrived: number;
  openId: string | null;
};

export type FeedAction = { type: 'arrived' } | { type: 'toggled'; id: string };

type Step = SessionStep<FeedState, FeedAction>;

export const INITIAL: FeedState = { arrived: 2, openId: null };

export const RESTING: FeedState = { arrived: 4, openId: null };

export function reducer(state: FeedState, action: FeedAction): FeedState {
  switch (action.type) {
    case 'arrived':
      return {
        ...state,
        arrived: Math.min(state.arrived + 1, FEED_EVENTS.length),
      };
    case 'toggled':
      if (state.openId === action.id) {
        return { ...state, openId: null };
      }
      return { ...state, openId: action.id };
  }
}

export function shownEventsOf(state: FeedState): FeedEvent[] {
  const arrived = FEED_EVENTS.slice(0, state.arrived);
  const latest = arrived.slice(-FEED_VISIBLE);
  return latest.reverse();
}

export function spentCentsOf(state: FeedState) {
  const arrived = FEED_EVENTS.slice(0, state.arrived);
  let total = FEED_START_CENTS;
  for (const event of arrived) {
    total += event.amountCents;
  }
  return total;
}

export function yourShareCentsOf(state: FeedState) {
  return Math.round(spentCentsOf(state) * YOUR_SHARE);
}

const ARRIVAL_MS = 2300;

function arrivalSteps() {
  const remaining = FEED_EVENTS.length - INITIAL.arrived;
  const steps: Step[] = [];
  for (let index = 0; index < remaining; index += 1) {
    steps.push({ after: ARRIVAL_MS, by: 'demo', action: { type: 'arrived' } });
  }
  return steps;
}

export const SESSION: SessionConfig<FeedState, FeedAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: arrivalSteps(),
  loopAfter: 3200,
};
