import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import type { TypeFilter } from './data';
import { entryOf, monthIdOf } from './groups';

export type LogState = {
  filter: TypeFilter;
  openIds: string[];
  copiedId: string | null;
  jumpKey: string | null;
  /** Counts the requests, so asking twice for the same place still scrolls. */
  jumpRequest: number;
};

export type LogAction =
  | { type: 'filterPicked'; filter: TypeFilter }
  | { type: 'toggled'; id: string }
  | { type: 'copied'; id: string }
  | { type: 'copyCleared' }
  | { type: 'jumped'; key: string }
  | { type: 'linked'; id: string };

type Step = SessionStep<LogState, LogAction>;

export const INITIAL: LogState = {
  filter: 'all',
  openIds: [],
  copiedId: null,
  jumpKey: null,
  jumpRequest: 0,
};

export function monthKeyOf(monthId: string) {
  return `month-${monthId}`;
}

export function entryKeyOf(entryId: string) {
  return `entry-${entryId}`;
}

function toggled(openIds: string[], id: string) {
  if (openIds.includes(id)) {
    return openIds.filter((openId) => openId !== id);
  }
  return [...openIds, id];
}

function linked(state: LogState, id: string): LogState {
  const entry = entryOf(id);
  const isKnown = entry !== undefined;
  if (!isKnown) {
    return state;
  }
  return {
    ...state,
    filter: 'all',
    openIds: [...state.openIds.filter((openId) => openId !== id), id],
    jumpKey: entryKeyOf(id),
    jumpRequest: state.jumpRequest + 1,
  };
}

export function reducer(state: LogState, action: LogAction): LogState {
  switch (action.type) {
    case 'filterPicked':
      return { ...state, filter: action.filter };
    case 'toggled':
      return { ...state, openIds: toggled(state.openIds, action.id) };
    case 'copied':
      return { ...state, copiedId: action.id };
    case 'copyCleared':
      return { ...state, copiedId: null };
    case 'jumped':
      return {
        ...state,
        jumpKey: action.key,
        jumpRequest: state.jumpRequest + 1,
      };
    case 'linked':
      return linked(state, action.id);
  }
}

export const COPIED_MS = 1600;

const AUGUST = monthIdOf('2026-08-26');

const OCTOBER = monthIdOf('2026-10-27');

/**
 * Someone jumps to August, opens an entry and copies its link, narrows the list to the fixes,
 * comes back to everything and returns to the newest month.
 */
export const SCRIPT: Step[] = [
  {
    after: 2000,
    by: 'demo',
    press: `month-${AUGUST}`,
    action: { type: 'jumped', key: monthKeyOf(AUGUST) },
  },
  {
    after: 2200,
    by: 'demo',
    press: 'toggle-weekly-digest',
    action: { type: 'toggled', id: 'weekly-digest' },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'copy-weekly-digest',
    action: { type: 'copied', id: 'weekly-digest' },
  },
  {
    after: 2600,
    by: 'demo',
    press: 'filter-fixed',
    action: { type: 'filterPicked', filter: 'fixed' },
  },
  {
    after: 2600,
    by: 'demo',
    press: 'filter-all',
    action: { type: 'filterPicked', filter: 'all' },
  },
  {
    after: 1200,
    by: 'demo',
    press: `month-${OCTOBER}`,
    action: { type: 'jumped', key: monthKeyOf(OCTOBER) },
  },
];

/** Under reduced motion the newest month is on top with one entry open. */
export const RESTING: LogState = {
  ...INITIAL,
  openIds: ['quiet-hours'],
};

export const LOOP_AFTER_MS = 2800;
