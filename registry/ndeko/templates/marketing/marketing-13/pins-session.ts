import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import { NOTES } from './data';

export type PinsState = {
  shownCount: number;
  resolvedIds: string[];
  activeId: string | null;
};

export type PinsAction =
  | { type: 'pinned' }
  | { type: 'picked'; id: string }
  | { type: 'resolveToggled'; id: string }
  | { type: 'resolved'; id: string };

type Step = SessionStep<PinsState, PinsAction>;

export const INITIAL: PinsState = {
  shownCount: 0,
  resolvedIds: [],
  activeId: null,
};

export const RESTING: PinsState = {
  shownCount: NOTES.length,
  resolvedIds: [],
  activeId: NOTES[0].id,
};

function pinned(state: PinsState): PinsState {
  const next = state.shownCount + 1;
  if (next > NOTES.length) {
    return state;
  }
  const note = NOTES[next - 1];
  return { ...state, shownCount: next, activeId: note.id };
}

function resolveToggled(state: PinsState, id: string): PinsState {
  const isResolved = state.resolvedIds.includes(id);
  if (isResolved) {
    const resolvedIds = state.resolvedIds.filter((resolved) => resolved !== id);
    return { ...state, resolvedIds };
  }
  return { ...state, resolvedIds: [...state.resolvedIds, id], activeId: id };
}

function resolved(state: PinsState, id: string): PinsState {
  if (state.resolvedIds.includes(id)) {
    return state;
  }
  return { ...state, resolvedIds: [...state.resolvedIds, id], activeId: id };
}

export function reducer(state: PinsState, action: PinsAction): PinsState {
  switch (action.type) {
    case 'pinned':
      return pinned(state);
    case 'picked':
      return { ...state, activeId: action.id };
    case 'resolveToggled':
      return resolveToggled(state, action.id);
    case 'resolved':
      return resolved(state, action.id);
  }
}

export function resolvePressKeyOf(id: string) {
  return `resolve-${id}`;
}

function pinStep(after: number): Step {
  return { after, by: 'demo', action: { type: 'pinned' } };
}

function resolveStep(after: number, id: string): Step {
  return {
    after,
    by: 'demo',
    press: resolvePressKeyOf(id),
    action: { type: 'resolved', id },
  };
}

const SCRIPT: Step[] = [
  pinStep(1000),
  pinStep(900),
  pinStep(900),
  resolveStep(1500, NOTES[0].id),
  resolveStep(1100, NOTES[1].id),
  resolveStep(1100, NOTES[2].id),
];

export const SESSION: SessionConfig<PinsState, PinsAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 2600,
};
