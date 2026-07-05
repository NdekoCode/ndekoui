import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type CallStatus = 'ringing' | 'live' | 'ended';

export type DoneBy = 'assistant' | 'person';

export type VoiceState = {
  status: CallStatus;
  isMuted: boolean;
  linesShown: number;
  notesShown: number;
  todosShown: number;
  /** Who ticked each finished to-do. */
  doneBy: Record<string, DoneBy>;
  startedAt: number | null;
  endedAt: number | null;
  share: 'idle' | 'busy' | 'done';
};

export type VoiceAction =
  | { type: 'started' }
  | { type: 'line' }
  | { type: 'note' }
  | { type: 'todo' }
  | { type: 'did'; id: string }
  | { type: 'toggled'; id: string }
  | { type: 'muted' }
  | { type: 'ended' }
  | { type: 'sharing' }
  | { type: 'shared' }
  | { type: 'batch'; actions: VoiceAction[] };

type Step = SessionStep<VoiceState, VoiceAction>;

export const INITIAL: VoiceState = {
  status: 'ringing',
  isMuted: false,
  linesShown: 0,
  notesShown: 0,
  todosShown: 0,
  doneBy: {},
  startedAt: null,
  endedAt: null,
  share: 'idle',
};

function without(doneBy: Record<string, DoneBy>, id: string) {
  const rest = { ...doneBy };
  delete rest[id];
  return rest;
}

function toggled(state: VoiceState, id: string): VoiceState {
  const isDone = state.doneBy[id] !== undefined;
  if (isDone) {
    return { ...state, doneBy: without(state.doneBy, id) };
  }
  return { ...state, doneBy: { ...state.doneBy, [id]: 'person' } };
}

function ended(state: VoiceState, now: number): VoiceState {
  if (state.status !== 'live') {
    return state;
  }
  return { ...state, status: 'ended', endedAt: now };
}

function shared(state: VoiceState): VoiceState {
  if (state.share !== 'busy') {
    return state;
  }
  return { ...state, share: 'done' };
}

/** Once the call has ended nothing more is said or written. */
function whileLive(state: VoiceState, next: VoiceState) {
  if (state.status === 'live') {
    return next;
  }
  return state;
}

export function applyAt(
  state: VoiceState,
  action: VoiceAction,
  now: number
): VoiceState {
  switch (action.type) {
    case 'started':
      return { ...state, status: 'live', startedAt: now };
    case 'line':
      return whileLive(state, { ...state, linesShown: state.linesShown + 1 });
    case 'note':
      return whileLive(state, { ...state, notesShown: state.notesShown + 1 });
    case 'todo':
      return whileLive(state, { ...state, todosShown: state.todosShown + 1 });
    case 'did': {
      const doneBy: Record<string, DoneBy> = {
        ...state.doneBy,
        [action.id]: 'assistant',
      };
      return whileLive(state, { ...state, doneBy });
    }
    case 'toggled':
      return toggled(state, action.id);
    case 'muted':
      return { ...state, isMuted: !state.isMuted };
    case 'ended':
      return ended(state, now);
    case 'sharing':
      return { ...state, share: 'busy' };
    case 'shared':
      return shared(state);
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: VoiceState, action: VoiceAction) {
  return applyAt(state, action, Date.now());
}

function frame(after: number, actions: VoiceAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

export const SHARE_MS = 900;

export const SCRIPT: Step[] = [
  frame(700, [{ type: 'started' }]),
  frame(900, [{ type: 'line' }]),
  frame(1900, [{ type: 'note' }]),
  frame(900, [{ type: 'line' }]),
  frame(2000, [{ type: 'line' }]),
  frame(1500, [{ type: 'todo' }]),
  frame(800, [{ type: 'todo' }]),
  frame(1100, [{ type: 'line' }, { type: 'did', id: 't2' }, { type: 'note' }]),
  frame(2400, [{ type: 'line' }]),
  frame(1300, [{ type: 'todo' }]),
  frame(900, [{ type: 'note' }, { type: 'todo' }]),
  frame(1000, [{ type: 'line' }, { type: 'did', id: 't3' }]),
  { after: 2600, by: 'demo', press: 'end', action: { type: 'ended' } },
];

function restingOf() {
  let state = INITIAL;
  let now = 1000;
  for (const step of SCRIPT) {
    now += step.after;
    state = applyAt(state, step.action, now);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 4200;
