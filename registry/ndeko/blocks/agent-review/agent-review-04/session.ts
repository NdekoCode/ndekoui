import {
  AGENT_MOVES,
  PAY_MOVE,
  type PageId,
  type Period,
  type PointerTarget,
} from './data';
import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type Actor = 'agent' | 'person';

export type Frame = {
  id: number;
  actor: Actor;
  text: string;
  page: PageId;
  pointer: PointerTarget | null;
  period: Period;
  hasAddon: boolean;
};

export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'denied';

export type SessionStatus = 'running' | 'done' | 'stopped';

export type ComputerState = {
  status: SessionStatus;
  frames: Frame[];
  movesDone: number;
  control: Actor;
  isPaused: boolean;
  approval: ApprovalStatus;
  /** The frame being looked at, or null to follow the live one. */
  viewed: number | null;
  startedAt: number | null;
  endedAt: number | null;
};

export type ComputerAction =
  | { type: 'started' }
  | { type: 'moved' }
  | { type: 'paused' }
  | { type: 'tookOver' }
  | { type: 'handedBack' }
  | { type: 'addon' }
  | { type: 'period'; period: Period }
  | { type: 'decided'; decision: 'approved' | 'denied' }
  | { type: 'stopped' }
  | { type: 'viewed'; index: number | null };

type Step = SessionStep<ComputerState, ComputerAction>;

const BLANK: Frame = {
  id: 0,
  actor: 'agent',
  text: 'Started a browser',
  page: 'blank',
  pointer: null,
  period: 1,
  hasAddon: true,
};

export const INITIAL: ComputerState = {
  status: 'running',
  frames: [BLANK],
  movesDone: 0,
  control: 'agent',
  isPaused: false,
  approval: 'none',
  viewed: null,
  startedAt: null,
  endedAt: null,
};

export function liveFrameOf(state: ComputerState) {
  const last = state.frames.at(-1);
  return last ?? BLANK;
}

export function shownFrameOf(state: ComputerState) {
  if (state.viewed === null) {
    return liveFrameOf(state);
  }
  return state.frames[state.viewed] ?? liveFrameOf(state);
}

export function isAgentHeld(state: ComputerState) {
  const isOver = state.status !== 'running';
  const isWaiting = state.isPaused || state.control === 'person';
  return isOver || isWaiting;
}

function withFrame(
  state: ComputerState,
  patch: Partial<Frame> & Pick<Frame, 'actor' | 'text'>
): ComputerState {
  const live = liveFrameOf(state);
  const frame: Frame = { ...live, ...patch, id: state.frames.length };
  return { ...state, frames: [...state.frames, frame] };
}

function moved(state: ComputerState, now: number): ComputerState {
  const move = AGENT_MOVES[state.movesDone];
  const isWaitingForYes = state.approval === 'pending';
  const cannotMove = isWaitingForYes || isAgentHeld(state);
  if (!move) {
    return state;
  }
  if (cannotMove) {
    return state;
  }
  const next = withFrame(state, { actor: 'agent', ...move });
  const movesDone = state.movesDone + 1;
  const isPayMove = state.movesDone === PAY_MOVE;
  if (isPayMove) {
    return { ...next, movesDone, approval: 'pending' };
  }
  const isLast = movesDone === AGENT_MOVES.length;
  if (isLast) {
    return { ...next, movesDone, status: 'done', endedAt: now };
  }
  return { ...next, movesDone };
}

function personChanged(
  state: ComputerState,
  patch: Partial<Frame>,
  text: string
): ComputerState {
  const live = liveFrameOf(state);
  const isOnForm = live.page === 'renew';
  const canAct = state.control === 'person' && state.status === 'running';
  if (!isOnForm || !canAct) {
    return state;
  }
  return withFrame(state, { ...patch, actor: 'person', text, pointer: null });
}

function addonTextOf(hasAddon: boolean) {
  if (hasAddon) {
    return 'You added privacy protection';
  }
  return 'You removed privacy protection';
}

function periodTextOf(period: Period) {
  if (period === 1) {
    return 'You chose 1 year';
  }
  return 'You chose 2 years';
}

function decided(
  state: ComputerState,
  decision: 'approved' | 'denied',
  now: number
): ComputerState {
  if (state.approval !== 'pending') {
    return state;
  }
  if (decision === 'approved') {
    return { ...state, approval: 'approved' };
  }
  const denied = withFrame(state, {
    actor: 'person',
    text: 'You denied the payment. Nothing was charged',
    pointer: null,
  });
  return { ...denied, approval: 'denied', status: 'stopped', endedAt: now };
}

function stopped(state: ComputerState, now: number): ComputerState {
  if (state.status !== 'running') {
    return state;
  }
  const next = withFrame(state, {
    actor: 'person',
    text: 'You stopped the session',
    pointer: null,
  });
  return { ...next, status: 'stopped', approval: 'none', endedAt: now };
}

function viewed(state: ComputerState, index: number | null): ComputerState {
  const last = state.frames.length - 1;
  const isLive = index === null || index >= last;
  if (isLive) {
    return { ...state, viewed: null };
  }
  return { ...state, viewed: Math.max(0, index) };
}

export function applyAt(
  state: ComputerState,
  action: ComputerAction,
  now: number
): ComputerState {
  switch (action.type) {
    case 'started':
      return { ...state, startedAt: now };
    case 'moved':
      return moved(state, now);
    case 'paused':
      return { ...state, isPaused: !state.isPaused };
    case 'tookOver':
      return { ...state, control: 'person', viewed: null };
    case 'handedBack':
      return { ...state, control: 'agent' };
    case 'addon': {
      const hasAddon = !liveFrameOf(state).hasAddon;
      return personChanged(state, { hasAddon }, addonTextOf(hasAddon));
    }
    case 'period':
      return personChanged(
        state,
        { period: action.period },
        periodTextOf(action.period)
      );
    case 'decided':
      return decided(state, action.decision, now);
    case 'stopped':
      return stopped(state, now);
    case 'viewed':
      return viewed(state, action.index);
  }
}

export function reducer(state: ComputerState, action: ComputerAction) {
  return applyAt(state, action, Date.now());
}

function hasDecided(state: ComputerState) {
  return state.approval !== 'pending';
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  { after: 500, action: { type: 'started' } },
  { after: 700, action: { type: 'moved' } },
  { after: 1600, action: { type: 'moved' } },
  { after: 1600, action: { type: 'moved' } },
  { after: 1700, by: 'demo', press: 'takeover', action: { type: 'tookOver' } },
  { after: 1500, by: 'demo', press: 'addon', action: { type: 'addon' } },
  {
    after: 1700,
    by: 'demo',
    press: 'takeover',
    action: { type: 'handedBack' },
  },
  { after: 1300, action: { type: 'moved' } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  { after: 1300, action: { type: 'moved' } },
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

export const LOOP_AFTER_MS = 3800;
