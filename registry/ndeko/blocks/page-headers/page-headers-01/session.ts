import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import type { TabId } from './data';

export type HeaderState = {
  tab: TabId;
  /** Where the demonstration asks the frame to scroll. A person scrolls the frame directly. */
  scrollTop: number;
  /** Counts the requests, so asking twice for the same place still scrolls. */
  scrollRequest: number;
};

export type HeaderAction =
  { type: 'tabPicked'; tab: TabId } | { type: 'scrolledTo'; top: number };

type Step = SessionStep<HeaderState, HeaderAction>;

export const INITIAL: HeaderState = {
  tab: 'overview',
  scrollTop: 0,
  scrollRequest: 0,
};

export function reducer(state: HeaderState, action: HeaderAction): HeaderState {
  switch (action.type) {
    case 'tabPicked':
      return { ...state, tab: action.tab };
    case 'scrolledTo':
      return {
        ...state,
        scrollTop: action.top,
        scrollRequest: state.scrollRequest + 1,
      };
  }
}

/** Far enough for the title to pass under the bar, short enough to stay inside the shortest tab. */
const READ_DOWN_TO = 320;

/**
 * A person reads down the overview until the header folds into its bar, comes back up, glances at
 * the tasks and returns to the overview: the round ends where it began.
 */
export const SCRIPT: Step[] = [
  {
    after: 1600,
    by: 'demo',
    action: { type: 'scrolledTo', top: READ_DOWN_TO },
  },
  { after: 2800, by: 'demo', action: { type: 'scrolledTo', top: 0 } },
  {
    after: 1500,
    by: 'demo',
    press: 'tab-tasks',
    action: { type: 'tabPicked', tab: 'tasks' },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'tab-overview',
    action: { type: 'tabPicked', tab: 'overview' },
  },
];

export const RESTING: HeaderState = INITIAL;

export const LOOP_AFTER_MS = 2200;
