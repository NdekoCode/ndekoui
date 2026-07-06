import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import { matchesOf, ofType, type TypeFilter } from './search';

export type SearchState = {
  query: string;
  type: TypeFilter;
  /** The page of results, counted from 1. */
  page: number;
  /** The result Enter opens, on the current page. Nothing is highlighted before the arrows are used. */
  activeIndex: number;
  searchMs: number;
};

export type SearchAction =
  | { type: 'typed'; value: string }
  | { type: 'typePicked'; filter: TypeFilter }
  | { type: 'moved'; by: 1 | -1 }
  | { type: 'paged'; page: number }
  | { type: 'cleared' };

type Step = SessionStep<SearchState, SearchAction>;

export const PAGE_SIZE = 5;

const NOTHING_HIGHLIGHTED = -1;

export const INITIAL: SearchState = {
  query: '',
  type: 'all',
  page: 1,
  activeIndex: NOTHING_HIGHLIGHTED,
  searchMs: 0,
};

export function resultsIn(state: SearchState) {
  const matches = matchesOf(state.query);
  return ofType(matches, state.type);
}

export function pageCountOf(resultCount: number) {
  const pages = Math.ceil(resultCount / PAGE_SIZE);
  return Math.max(1, pages);
}

export function pageOfResults(state: SearchState) {
  const results = resultsIn(state);
  const start = (state.page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return results.slice(start, end);
}

/** The search itself is timed where it runs, so the figure on the page is the real one. */
function searched(state: SearchState, query: string): SearchState {
  const startedAt = performance.now();
  matchesOf(query);
  const searchMs = performance.now() - startedAt;
  return {
    ...state,
    query,
    page: 1,
    activeIndex: NOTHING_HIGHLIGHTED,
    searchMs,
  };
}

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

function moved(state: SearchState, by: 1 | -1): SearchState {
  const count = pageOfResults(state).length;
  if (count === 0) {
    return state;
  }
  const activeIndex = nextIndexOf(state.activeIndex, by, count);
  return { ...state, activeIndex };
}

function paged(state: SearchState, page: number): SearchState {
  const resultCount = resultsIn(state).length;
  const pageCount = pageCountOf(resultCount);
  const isInRange = page >= 1 && page <= pageCount;
  if (!isInRange) {
    return state;
  }
  return { ...state, page, activeIndex: NOTHING_HIGHLIGHTED };
}

export function reducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'typed':
      return searched(state, action.value);
    case 'typePicked':
      return {
        ...state,
        type: action.filter,
        page: 1,
        activeIndex: NOTHING_HIGHLIGHTED,
      };
    case 'moved':
      return moved(state, action.by);
    case 'paged':
      return paged(state, action.page);
    case 'cleared':
      return INITIAL;
  }
}

const KEY_MS = 95;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value },
  }));
}

function arrow(after: number): Step {
  return {
    after,
    by: 'demo',
    press: 'key-down',
    action: { type: 'moved', by: 1 },
  };
}

function picked(after: number, filter: TypeFilter): Step {
  return {
    after,
    by: 'demo',
    press: `type-${filter}`,
    action: { type: 'typePicked', filter },
  };
}

/**
 * Someone searches, walks the results, narrows to guides and back, turns a page and clears; then a
 * misspelled word finds nothing and the correction the page offers is taken. The round ends empty.
 */
export const SCRIPT: Step[] = [
  ...typing('deliver', 1400),
  arrow(1300),
  arrow(650),
  picked(1500, 'guide'),
  picked(1700, 'all'),
  {
    after: 1300,
    by: 'demo',
    press: 'page-2',
    action: { type: 'paged', page: 2 },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'key-escape',
    action: { type: 'cleared' },
  },
  ...typing('signatre', 1100),
  {
    after: 1700,
    by: 'demo',
    press: 'correction',
    action: { type: 'typed', value: 'signature' },
  },
  {
    after: 2300,
    by: 'demo',
    press: 'key-escape',
    action: { type: 'cleared' },
  },
];

/** Under reduced motion the results of a search are on the page with the first one highlighted. */
export const RESTING: SearchState = {
  query: 'deliver',
  type: 'all',
  page: 1,
  activeIndex: 0,
  searchMs: 0,
};

export const LOOP_AFTER_MS = 2200;
