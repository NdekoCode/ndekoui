import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { NOTES, READ_AT_START } from './data';

export type NewsState = {
  isOpen: boolean;
  readIds: string[];
};

export type NewsAction =
  | { type: 'opened' }
  | { type: 'closed' }
  | { type: 'read'; id: string }
  | { type: 'allRead' };

type Step = SessionStep<NewsState, NewsAction>;

export const INITIAL: NewsState = {
  isOpen: false,
  readIds: READ_AT_START,
};

export function unreadCountOf(readIds: string[]) {
  const unread = NOTES.filter((note) => !readIds.includes(note.id));
  return unread.length;
}

function read(state: NewsState, id: string): NewsState {
  if (state.readIds.includes(id)) {
    return state;
  }
  return { ...state, readIds: [...state.readIds, id] };
}

export function reducer(state: NewsState, action: NewsAction): NewsState {
  switch (action.type) {
    case 'opened':
      return { ...state, isOpen: true };
    case 'closed':
      return { ...state, isOpen: false };
    case 'read':
      return read(state, action.id);
    case 'allRead':
      return { ...state, readIds: NOTES.map((note) => note.id) };
  }
}

/**
 * Someone opens the list, reads two notes so the count rolls down, marks the rest as read and
 * closes it: a round ends with nothing left to read, and starts again with three unread.
 */
export const SCRIPT: Step[] = [
  {
    after: 2000,
    by: 'demo',
    press: 'trigger',
    action: { type: 'opened' },
  },
  {
    after: 2200,
    by: 'demo',
    press: 'note-quiet-hours',
    action: { type: 'read', id: 'quiet-hours' },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'note-zone-strip',
    action: { type: 'read', id: 'zone-strip' },
  },
  {
    after: 1800,
    by: 'demo',
    press: 'mark-all',
    action: { type: 'allRead' },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'trigger',
    action: { type: 'closed' },
  },
];

/** Under reduced motion the list is open with three notes still unread. */
export const RESTING: NewsState = {
  isOpen: true,
  readIds: READ_AT_START,
};

export const LOOP_AFTER_MS = 2600;
