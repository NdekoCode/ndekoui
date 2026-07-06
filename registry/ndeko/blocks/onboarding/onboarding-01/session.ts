import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { DONE_AT_FIRST, stepOf, STEPS, WORKSPACE, type StepId } from './data';

/** The guide is a card, a pill once snoozed, a short message once every step is done, or put away. */
export type View = 'card' | 'pill' | 'complete' | 'gone';

export type Source = 'demo' | 'person';

export type StepStatus = 'done' | 'current' | 'locked';

export type ChecklistState = {
  /** The steps that are done, in the order they were done. */
  done: StepId[];
  openId: StepId | null;
  /** The how-to that is unfolded inside the open step. */
  howToId: StepId | null;
  view: View;
  /** Who did the last step: the message that follows only fades for the one who brought it up. */
  completedBy: Source | null;
  spoken: string;
};

export type ChecklistAction =
  | { type: 'stepToggled'; id: StepId }
  | { type: 'howToToggled'; id: StepId }
  | { type: 'stepCompleted'; id: StepId; source: Source }
  | { type: 'snoozed' }
  | { type: 'resumed' }
  | { type: 'dismissed' }
  | { type: 'completionFaded'; source: Source };

type Step = SessionStep<ChecklistState, ChecklistAction>;

export const TOTAL = STEPS.length;

/** The steps are done in order: the first one that is not done is the current one. */
export function currentOf(done: StepId[]) {
  const current = STEPS.find((step) => !done.includes(step.id));
  return current?.id ?? null;
}

export function statusOf(done: StepId[], id: StepId): StepStatus {
  if (done.includes(id)) {
    return 'done';
  }
  if (currentOf(done) === id) {
    return 'current';
  }
  return 'locked';
}

export const INITIAL: ChecklistState = {
  done: DONE_AT_FIRST,
  openId: currentOf(DONE_AT_FIRST),
  howToId: null,
  view: 'card',
  completedBy: null,
  spoken: '',
};

function stepToggled(state: ChecklistState, id: StepId): ChecklistState {
  const isLocked = statusOf(state.done, id) === 'locked';
  if (isLocked) {
    return state;
  }
  if (state.openId === id) {
    return { ...state, openId: null, howToId: null };
  }
  return { ...state, openId: id, howToId: null };
}

function howToToggled(state: ChecklistState, id: StepId): ChecklistState {
  if (state.openId !== id) {
    return state;
  }
  if (state.howToId === id) {
    return { ...state, howToId: null };
  }
  return { ...state, howToId: id };
}

/** Doing the current step ticks it, and the next one unlocks and opens. After the last one the card says so. */
function stepCompleted(
  state: ChecklistState,
  id: StepId,
  source: Source
): ChecklistState {
  if (currentOf(state.done) !== id) {
    return state;
  }
  const done = [...state.done, id];
  const nextId = currentOf(done);
  if (nextId === null) {
    return {
      ...state,
      done,
      openId: null,
      howToId: null,
      view: 'complete',
      completedBy: source,
      spoken: `All ${TOTAL} steps done. ${WORKSPACE.name} is set up`,
    };
  }
  const title = stepOf(id).title;
  const nextTitle = stepOf(nextId).title;
  const spoken = `${title}: done, ${done.length} of ${TOTAL}. Next: ${nextTitle}`;
  return { ...state, done, openId: nextId, howToId: null, spoken };
}

function snoozed(state: ChecklistState): ChecklistState {
  if (state.view !== 'card') {
    return state;
  }
  return { ...state, view: 'pill', spoken: 'Setup guide snoozed' };
}

function resumed(state: ChecklistState): ChecklistState {
  const isPutAway = state.view === 'pill' || state.view === 'gone';
  if (!isPutAway) {
    return state;
  }
  return {
    ...state,
    view: 'card',
    openId: currentOf(state.done),
    howToId: null,
    spoken: 'Setup guide opened',
  };
}

function dismissed(state: ChecklistState): ChecklistState {
  if (state.view === 'gone') {
    return state;
  }
  const spoken = 'Setup guide dismissed. It stays in the top bar';
  return { ...state, view: 'gone', spoken };
}

function completionFaded(
  state: ChecklistState,
  source: Source
): ChecklistState {
  const isShowingMessage = state.view === 'complete';
  const isItsOwn = state.completedBy === source;
  if (!isShowingMessage || !isItsOwn) {
    return state;
  }
  return { ...state, view: 'gone', spoken: '' };
}

export function reducer(
  state: ChecklistState,
  action: ChecklistAction
): ChecklistState {
  switch (action.type) {
    case 'stepToggled':
      return stepToggled(state, action.id);
    case 'howToToggled':
      return howToToggled(state, action.id);
    case 'stepCompleted':
      return stepCompleted(state, action.id, action.source);
    case 'snoozed':
      return snoozed(state);
    case 'resumed':
      return resumed(state);
    case 'dismissed':
      return dismissed(state);
    case 'completionFaded':
      return completionFaded(state, action.source);
  }
}

/** How long the message that everything is done stays before the card fades. */
export const COMPLETE_FOR_MS = 3600;

function completes(after: number, id: StepId): Step {
  return {
    after,
    by: 'demo',
    press: `cta-${id}`,
    action: { type: 'stepCompleted', id, source: 'demo' },
  };
}

/** Two steps are done with their how-to read first: the state the guide rests in. */
const FIRST_STEPS: Step[] = [
  {
    after: 1500,
    by: 'demo',
    press: 'howto-invite',
    action: { type: 'howToToggled', id: 'invite' },
  },
  completes(2300, 'invite'),
];

/**
 * A person does every step, so they are the demonstration's: the guide is snoozed into its pill and
 * brought back, then the last steps are done. The fade that follows is the card's own doing, and it
 * plays even when a person took over while the message was up.
 */
export const SCRIPT: Step[] = [
  ...FIRST_STEPS,
  completes(2000, 'source'),
  { after: 1700, by: 'demo', press: 'snooze', action: { type: 'snoozed' } },
  { after: 1900, by: 'demo', press: 'pill', action: { type: 'resumed' } },
  completes(1500, 'agent'),
  completes(1700, 'run'),
  {
    after: COMPLETE_FOR_MS,
    action: { type: 'completionFaded', source: 'demo' },
  },
];

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

/** Under reduced motion two of five steps are done and the third is open, with its button to press. */
export const RESTING: ChecklistState = { ...endOf(FIRST_STEPS), spoken: '' };

export const LOOP_AFTER_MS = 2200;
