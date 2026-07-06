import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import { SPRINT_TASKS } from './data';

export type SprintState = {
  doneIds: string[];
  workingId: string | null;
};

export type SprintAction =
  | { type: 'worked'; id: string }
  | { type: 'ticked'; id: string }
  | { type: 'toggled'; id: string };

type Step = SessionStep<SprintState, SprintAction>;

export const INITIAL: SprintState = { doneIds: [], workingId: null };

const RESTING_DONE = SPRINT_TASKS.slice(0, 4).map((task) => task.id);

export const RESTING: SprintState = {
  doneIds: RESTING_DONE,
  workingId: SPRINT_TASKS[4].id,
};

function ticked(state: SprintState, id: string): SprintState {
  if (state.doneIds.includes(id)) {
    return { ...state, workingId: null };
  }
  return { doneIds: [...state.doneIds, id], workingId: null };
}

function toggled(state: SprintState, id: string): SprintState {
  const isDone = state.doneIds.includes(id);
  if (isDone) {
    const doneIds = state.doneIds.filter((doneId) => doneId !== id);
    return { ...state, doneIds };
  }
  return ticked(state, id);
}

export function reducer(state: SprintState, action: SprintAction) {
  switch (action.type) {
    case 'worked':
      return { ...state, workingId: action.id };
    case 'ticked':
      return ticked(state, action.id);
    case 'toggled':
      return toggled(state, action.id);
  }
}

export function tickPressKeyOf(id: string) {
  return `tick-${id}`;
}

function sprintSteps() {
  const steps: Step[] = [];
  SPRINT_TASKS.forEach((task) => {
    steps.push({
      after: 900,
      by: 'demo',
      action: { type: 'worked', id: task.id },
    });
    steps.push({
      after: 1100,
      by: 'demo',
      press: tickPressKeyOf(task.id),
      action: { type: 'ticked', id: task.id },
    });
  });
  return steps;
}

export const SESSION: SessionConfig<SprintState, SprintAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: sprintSteps(),
  loopAfter: 2600,
};
