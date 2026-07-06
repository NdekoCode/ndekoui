import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import { STATEMENT_LINES } from './data';

export type ReaderState = {
  readIds: string[];
  headId: string | null;
  isCopied: boolean;
};

export type ReaderAction =
  | { type: 'headMoved'; id: string | null }
  | { type: 'lineRead'; id: string }
  | { type: 'lineToggled'; id: string }
  | { type: 'allRead' }
  | { type: 'cleared' }
  | { type: 'copied' }
  | { type: 'copyEnded' };

type Step = SessionStep<ReaderState, ReaderAction>;

const ALL_IDS = STATEMENT_LINES.map((line) => line.id);

export const INITIAL: ReaderState = {
  readIds: [],
  headId: null,
  isCopied: false,
};

export const RESTING: ReaderState = {
  readIds: ALL_IDS,
  headId: null,
  isCopied: false,
};

function withLineRead(state: ReaderState, id: string): ReaderState {
  if (state.readIds.includes(id)) {
    return state;
  }
  return { ...state, readIds: [...state.readIds, id] };
}

function withLineToggled(state: ReaderState, id: string): ReaderState {
  const isRead = state.readIds.includes(id);
  if (isRead) {
    const readIds = state.readIds.filter((readId) => readId !== id);
    return { ...state, readIds, isCopied: false };
  }
  return { ...state, readIds: [...state.readIds, id], isCopied: false };
}

export function reducer(state: ReaderState, action: ReaderAction): ReaderState {
  switch (action.type) {
    case 'headMoved':
      return { ...state, headId: action.id };
    case 'lineRead':
      return withLineRead(state, action.id);
    case 'lineToggled':
      return withLineToggled(state, action.id);
    case 'allRead':
      return { ...state, readIds: ALL_IDS, headId: null, isCopied: false };
    case 'cleared':
      return { readIds: [], headId: null, isCopied: false };
    case 'copied':
      return { ...state, isCopied: true };
    case 'copyEnded':
      return { ...state, isCopied: false };
  }
}

const FIRST_LINE_AFTER_MS = 1100;

const HEAD_MOVE_MS = 520;

const READ_MS = 420;

const COPY_PRESS_AFTER_MS = 800;

const COPIED_SHOWN_MS = 1800;

function headDelayOf(index: number) {
  if (index === 0) {
    return FIRST_LINE_AFTER_MS;
  }
  return HEAD_MOVE_MS;
}

function readingSteps() {
  const steps: Step[] = [];
  STATEMENT_LINES.forEach((line, index) => {
    const headAfter = headDelayOf(index);
    steps.push({
      after: headAfter,
      by: 'demo',
      action: { type: 'headMoved', id: line.id },
    });
    steps.push({
      after: READ_MS,
      by: 'demo',
      action: { type: 'lineRead', id: line.id },
    });
  });
  return steps;
}

export const COPY_PRESS_KEY = 'copy';

const SCRIPT: Step[] = [
  ...readingSteps(),
  { after: 500, by: 'demo', action: { type: 'headMoved', id: null } },
  {
    after: COPY_PRESS_AFTER_MS,
    by: 'demo',
    press: COPY_PRESS_KEY,
    action: { type: 'copied' },
  },
  { after: COPIED_SHOWN_MS, by: 'demo', action: { type: 'copyEnded' } },
];

export const SESSION: SessionConfig<ReaderState, ReaderAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 1600,
};
