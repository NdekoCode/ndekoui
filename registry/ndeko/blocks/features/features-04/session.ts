import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import { PLAN_STEPS, PROMPT_TEXT } from './data';

export type PlanStatus =
  'upcoming' | 'running' | 'waiting' | 'done' | 'skipped';

export type TrayStatus = 'idle' | 'reading' | 'planned';

export type Approval = 'none' | 'waiting' | 'approved' | 'declined';

export type RunState = {
  prompt: string;
  tray: TrayStatus;
  steps: PlanStatus[];
  context: number;
  cost: number;
  approval: Approval;
};

export type RunAction =
  | { type: 'typed'; value: string }
  | { type: 'sent' }
  | { type: 'read' }
  | { type: 'planned' }
  | { type: 'advanced'; step: number; context: number; cost: number }
  | { type: 'asked' }
  | { type: 'approved' }
  | { type: 'declined' };

type Step = SessionStep<RunState, RunAction>;

const LAST_STEP = PLAN_STEPS.length - 1;

const APPROVED_COST_USD = 0.014;

const APPROVED_CONTEXT_PERCENT = 8;

function stepsOf(status: PlanStatus): PlanStatus[] {
  return PLAN_STEPS.map(() => status);
}

export const INITIAL: RunState = {
  prompt: '',
  tray: 'idle',
  steps: stepsOf('upcoming'),
  context: 0,
  cost: 0,
  approval: 'none',
};

function withStep(
  steps: PlanStatus[],
  index: number,
  status: PlanStatus
): PlanStatus[] {
  return steps.map((current, position) => {
    if (position === index) {
      return status;
    }
    return current;
  });
}

function planned(state: RunState): RunState {
  const isNotStarted = state.steps[0] === 'upcoming';
  if (!isNotStarted) {
    return { ...state, tray: 'planned' };
  }
  const steps = withStep(state.steps, 0, 'running');
  return { ...state, tray: 'planned', steps };
}

function advanced(
  state: RunState,
  step: number,
  context: number,
  cost: number
): RunState {
  let steps = withStep(state.steps, step, 'done');
  const next = step + 1;
  const isAutomatic = next < LAST_STEP;
  const isUpcoming = state.steps[next] === 'upcoming';
  if (isAutomatic && isUpcoming) {
    steps = withStep(steps, next, 'running');
  }
  return { ...state, steps, context, cost };
}

function asked(state: RunState): RunState {
  if (state.approval !== 'none') {
    return state;
  }
  const steps = withStep(state.steps, LAST_STEP, 'waiting');
  return { ...state, steps, approval: 'waiting' };
}

function approved(state: RunState): RunState {
  if (state.approval !== 'waiting') {
    return state;
  }
  const steps = withStep(state.steps, LAST_STEP, 'done');
  return {
    ...state,
    steps,
    approval: 'approved',
    cost: state.cost + APPROVED_COST_USD,
    context: state.context + APPROVED_CONTEXT_PERCENT,
  };
}

function declined(state: RunState): RunState {
  if (state.approval !== 'waiting') {
    return state;
  }
  const steps = withStep(state.steps, LAST_STEP, 'skipped');
  return { ...state, steps, approval: 'declined' };
}

export function reducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'typed':
      return { ...state, prompt: action.value };
    case 'sent':
      return { ...state, tray: 'reading' };
    case 'read':
      return { ...state, context: 18, cost: 0.012 };
    case 'planned':
      return planned(state);
    case 'advanced':
      return advanced(state, action.step, action.context, action.cost);
    case 'asked':
      return asked(state);
    case 'approved':
      return approved(state);
    case 'declined':
      return declined(state);
  }
}

export function doneCountOf(state: RunState) {
  const done = state.steps.filter((status) => status === 'done');
  return done.length;
}

const KEY_MS = 38;

/** How long the tray reads for a person who sends a prompt themselves. */
export const TRAY_READ_MS = 1400;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value },
  }));
}

function hasAnswered(state: RunState) {
  return state.approval !== 'waiting';
}

/**
 * The agent works on its own clock: it reads, plans and ticks its steps. The prompt is typed and
 * the approval is answered by the demonstration until a person takes over, and the run waits for
 * them from then on.
 */
export const SCRIPT: Step[] = [
  ...typing(PROMPT_TEXT, 700),
  { after: 600, by: 'demo', press: 'send', action: { type: 'sent' } },
  { after: 1100, action: { type: 'read' } },
  { after: 900, action: { type: 'planned' } },
  {
    after: 1100,
    action: { type: 'advanced', step: 0, context: 34, cost: 0.027 },
  },
  {
    after: 1200,
    action: { type: 'advanced', step: 1, context: 52, cost: 0.041 },
  },
  {
    after: 1200,
    action: { type: 'advanced', step: 2, context: 63, cost: 0.052 },
  },
  { after: 700, action: { type: 'asked' } },
  {
    after: 2600,
    by: 'person',
    press: 'approve',
    action: { type: 'approved' },
    isAnswered: hasAnswered,
  },
];

/** Under reduced motion the run rests where it waits on a person. */
export const RESTING: RunState = {
  prompt: PROMPT_TEXT,
  tray: 'planned',
  steps: ['done', 'done', 'done', 'waiting'],
  context: 63,
  cost: 0.052,
  approval: 'waiting',
};

export const LOOP_AFTER_MS = 4200;
