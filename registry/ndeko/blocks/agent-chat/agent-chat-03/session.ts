import { FIELD_TEXT, PROMPT, type FieldId } from './data';
import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type CheckStatus = 'upcoming' | 'running' | 'done';

export type LiveStatus = 'idle' | 'busy' | 'done';

export type CanvasState = {
  draft: string;
  ask: string | null;
  checks: CheckStatus[];
  cardsShown: number;
  cardsReady: number;
  fields: Record<FieldId, string>;
  live: LiveStatus;
};

export type CanvasAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'check'; index: number; status: CheckStatus }
  | { type: 'card' }
  | { type: 'ready' }
  | { type: 'edited'; id: FieldId; text: string }
  | { type: 'run' }
  | { type: 'live' }
  | { type: 'batch'; actions: CanvasAction[] };

type Step = SessionStep<CanvasState, CanvasAction>;

export const INITIAL: CanvasState = {
  draft: '',
  ask: null,
  checks: ['upcoming', 'upcoming', 'upcoming'],
  cardsShown: 0,
  cardsReady: 0,
  fields: FIELD_TEXT,
  live: 'idle',
};

function askOf(draft: string) {
  const trimmed = draft.trim();
  if (trimmed === '') {
    return PROMPT;
  }
  return trimmed;
}

function sent(state: CanvasState): CanvasState {
  if (state.ask !== null) {
    return state;
  }
  return { ...state, draft: '', ask: askOf(state.draft) };
}

function checked(
  state: CanvasState,
  index: number,
  status: CheckStatus
): CanvasState {
  const checks = state.checks.map((current, position) => {
    if (position === index) {
      return status;
    }
    return current;
  });
  return { ...state, checks };
}

function ran(state: CanvasState): CanvasState {
  const isReady = state.cardsReady === 3;
  const canRun = isReady && state.live === 'idle';
  if (!canRun) {
    return state;
  }
  return { ...state, live: 'busy' };
}

function wentLive(state: CanvasState): CanvasState {
  if (state.live !== 'busy') {
    return state;
  }
  return { ...state, live: 'done' };
}

export function reducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state);
    case 'check':
      return checked(state, action.index, action.status);
    case 'card':
      return { ...state, cardsShown: state.cardsShown + 1 };
    case 'ready':
      return { ...state, cardsReady: state.cardsReady + 1 };
    case 'edited': {
      const fields = { ...state.fields, [action.id]: action.text };
      return { ...state, fields };
    }
    case 'run':
      return ran(state);
    case 'live':
      return wentLive(state);
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = reducer(next, inner);
      }
      return next;
    }
  }
}

const CHUNK = 3;

function delayOfChunk(index: number) {
  if (index === 0) {
    return 1000;
  }
  return 70;
}

function typingSteps(): Step[] {
  const steps: Step[] = [];
  const last = PROMPT.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const text = PROMPT.slice(0, end);
    const after = delayOfChunk(steps.length);
    steps.push({ after, by: 'demo', action: { type: 'typed', text } });
  }
  return steps;
}

function frame(after: number, actions: CanvasAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function hasAsked(state: CanvasState) {
  return state.ask !== null;
}

function hasRun(state: CanvasState) {
  return state.live !== 'idle';
}

/** Two characters every tick: a card of ninety characters writes itself in under two seconds. */
export const TYPE_TICK_MS = 40;

export const GO_LIVE_MS = 900;

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  ...typingSteps(),
  {
    after: 450,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasAsked,
  },
  frame(400, [{ type: 'check', index: 0, status: 'running' }]),
  frame(900, [
    { type: 'check', index: 0, status: 'done' },
    { type: 'check', index: 1, status: 'running' },
  ]),
  frame(1000, [
    { type: 'check', index: 1, status: 'done' },
    { type: 'check', index: 2, status: 'running' },
    { type: 'card' },
  ]),
  frame(2300, [{ type: 'ready' }, { type: 'card' }]),
  frame(1200, [{ type: 'ready' }, { type: 'card' }]),
  frame(1500, [{ type: 'ready' }, { type: 'check', index: 2, status: 'done' }]),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'run',
    action: { type: 'run' },
    isAnswered: hasRun,
  },
  { after: GO_LIVE_MS, action: { type: 'live' } },
];

function restingOf() {
  let state = INITIAL;
  for (const step of SCRIPT) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3200;
