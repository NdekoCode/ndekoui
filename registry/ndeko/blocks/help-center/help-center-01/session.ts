import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import { matchesOf } from './match';

export type HelpState = {
  query: string;
  isOpen: boolean;
  /** The suggestion Enter opens. Nothing is highlighted before the arrows are used. */
  activeIndex: number;
};

export type HelpAction =
  | { type: 'typed'; value: string }
  | { type: 'focused' }
  | { type: 'moved'; by: 1 | -1 }
  | { type: 'escaped' }
  | { type: 'closed' };

type Step = SessionStep<HelpState, HelpAction>;

export const SUGGESTION_LIMIT = 5;

const NOTHING_HIGHLIGHTED = -1;

export const INITIAL: HelpState = {
  query: '',
  isOpen: false,
  activeIndex: NOTHING_HIGHLIGHTED,
};

export function suggestionsIn(state: HelpState) {
  const matches = matchesOf(state.query);
  return matches.slice(0, SUGGESTION_LIMIT);
}

/** The first arrow lands on the first or the last row, then the highlight wraps around the list. */
function nextIndexOf(current: number, by: 1 | -1, count: number) {
  if (current === NOTHING_HIGHLIGHTED) {
    if (by === 1) {
      return 0;
    }
    return count - 1;
  }
  const moved = current + by + count;
  return moved % count;
}

function moved(state: HelpState, by: 1 | -1): HelpState {
  const count = suggestionsIn(state).length;
  if (count === 0) {
    return state;
  }
  if (!state.isOpen) {
    const firstIndex = nextIndexOf(NOTHING_HIGHLIGHTED, by, count);
    return { ...state, isOpen: true, activeIndex: firstIndex };
  }
  const activeIndex = nextIndexOf(state.activeIndex, by, count);
  return { ...state, activeIndex };
}

/** Escape closes the suggestions first, and clears the field when they are already closed. */
function escaped(state: HelpState): HelpState {
  if (state.isOpen) {
    return { ...state, isOpen: false, activeIndex: NOTHING_HIGHLIGHTED };
  }
  return INITIAL;
}

export function reducer(state: HelpState, action: HelpAction): HelpState {
  switch (action.type) {
    case 'typed':
      return {
        query: action.value,
        isOpen: true,
        activeIndex: NOTHING_HIGHLIGHTED,
      };
    case 'focused':
      return { ...state, isOpen: true };
    case 'moved':
      return moved(state, action.by);
    case 'escaped':
      return escaped(state);
    case 'closed':
      return { ...state, isOpen: false, activeIndex: NOTHING_HIGHLIGHTED };
  }
}

const QUERY = 'payslip';

const KEY_MS = 110;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value },
  }));
}

function arrow(after: number, by: 1 | -1): Step {
  let press = 'key-down';
  if (by === -1) {
    press = 'key-up';
  }
  return { after, by: 'demo', press, action: { type: 'moved', by } };
}

/**
 * Someone types a word slowly enough for the counts below to follow each letter, walks the
 * suggestions, and leaves with Escape twice: the round ends on the empty field it started from.
 */
export const SCRIPT: Step[] = [
  ...typing(QUERY, 1500),
  arrow(1400, 1),
  arrow(700, 1),
  {
    after: 2000,
    by: 'demo',
    press: 'key-escape',
    action: { type: 'escaped' },
  },
  { after: 900, by: 'demo', action: { type: 'escaped' } },
];

/** Under reduced motion the word is typed, the counts show the matches and the best one is highlighted. */
export const RESTING: HelpState = {
  query: QUERY,
  isOpen: true,
  activeIndex: 0,
};

export const LOOP_AFTER_MS = 2600;
