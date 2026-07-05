import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  DEMO_EMAIL,
  DEMO_READING,
  LIVE_INCIDENT,
  type ServiceId,
} from './data';

export type Subscription = 'idle' | 'invalid' | 'busy' | 'done';

export type Reading = {
  serviceId: ServiceId;
  day: number;
};

export type StatusState = {
  selected: ServiceId;
  /** How many updates of the live incident are out: 0 before it starts, 4 once it is resolved. */
  updatesOut: number;
  /** The day the demonstration reads on an uptime bar. */
  reading: Reading | null;
  email: string;
  subscription: Subscription;
};

export type StatusAction =
  | { type: 'selected'; id: ServiceId }
  | { type: 'updated'; updatesOut: number }
  | { type: 'read'; reading: Reading | null }
  | { type: 'typed'; text: string }
  | { type: 'subscribe' }
  | { type: 'subscribed' }
  | { type: 'unsubscribed' };

type Step = SessionStep<StatusState, StatusAction>;

export const INITIAL: StatusState = {
  selected: 'models',
  updatesOut: 0,
  reading: null,
  email: '',
  subscription: 'idle',
};

const RESOLVED_AT = LIVE_INCIDENT.updates.length;

/** The fault lasts from the first update until traffic moves to the second model. */
const TRAFFIC_MOVED_AT = 3;

export function isFaultOpen(state: StatusState) {
  const hasStarted = state.updatesOut > 0;
  const isResolved = state.updatesOut >= RESOLVED_AT;
  return hasStarted && !isResolved;
}

export function isSlowNow(state: StatusState) {
  const hasStarted = state.updatesOut > 0;
  const hasMoved = state.updatesOut >= TRAFFIC_MOVED_AT;
  return hasStarted && !hasMoved;
}

export function hasIncidentToday(state: StatusState) {
  return state.updatesOut > 0;
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(text: string) {
  const trimmed = text.trim();
  return EMAIL_SHAPE.test(trimmed);
}

/** An update only follows the one before it, so the incident never skips a stage. */
function updated(state: StatusState, updatesOut: number): StatusState {
  const isNext = updatesOut === state.updatesOut + 1;
  if (!isNext) {
    return state;
  }
  return { ...state, updatesOut };
}

function typed(state: StatusState, text: string): StatusState {
  const isLocked =
    state.subscription === 'busy' || state.subscription === 'done';
  if (isLocked) {
    return state;
  }
  return { ...state, email: text, subscription: 'idle' };
}

function subscribe(state: StatusState): StatusState {
  const isLocked =
    state.subscription === 'busy' || state.subscription === 'done';
  if (isLocked) {
    return state;
  }
  if (!isEmail(state.email)) {
    return { ...state, subscription: 'invalid' };
  }
  return { ...state, email: state.email.trim(), subscription: 'busy' };
}

function subscribed(state: StatusState): StatusState {
  if (state.subscription !== 'busy') {
    return state;
  }
  return { ...state, subscription: 'done' };
}

export function reducer(state: StatusState, action: StatusAction): StatusState {
  switch (action.type) {
    case 'selected':
      return { ...state, selected: action.id };
    case 'updated':
      return updated(state, action.updatesOut);
    case 'read':
      return { ...state, reading: action.reading };
    case 'typed':
      return typed(state, action.text);
    case 'subscribe':
      return subscribe(state);
    case 'subscribed':
      return subscribed(state);
    case 'unsubscribed':
      return { ...state, email: '', subscription: 'idle' };
  }
}

const CHUNK = 3;

function delayOfChunk(index: number) {
  if (index === 0) {
    return 1300;
  }
  return 70;
}

function typingSteps(): Step[] {
  const steps: Step[] = [];
  const last = DEMO_EMAIL.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const text = DEMO_EMAIL.slice(0, end);
    const after = delayOfChunk(steps.length);
    steps.push({ after, by: 'demo', action: { type: 'typed', text } });
  }
  return steps;
}

export const CONFIRM_MS = 1000;

export const SCRIPT: Step[] = [
  { after: 1500, action: { type: 'updated', updatesOut: 1 } },
  { after: 1900, action: { type: 'updated', updatesOut: 2 } },
  {
    after: 1500,
    by: 'demo',
    press: 'service-vectors',
    action: { type: 'selected', id: 'vectors' },
  },
  { after: 1300, by: 'demo', action: { type: 'read', reading: DEMO_READING } },
  { after: 2000, by: 'demo', action: { type: 'read', reading: null } },
  { after: 500, action: { type: 'updated', updatesOut: 3 } },
  {
    after: 1500,
    by: 'demo',
    press: 'service-models',
    action: { type: 'selected', id: 'models' },
  },
  { after: 1900, action: { type: 'updated', updatesOut: 4 } },
  ...typingSteps(),
  { after: 500, by: 'demo', press: 'subscribe', action: { type: 'subscribe' } },
  { after: CONFIRM_MS, action: { type: 'subscribed' } },
];

/** Under reduced motion the incident is resolved, with its four updates to read. */
export const RESTING: StatusState = { ...INITIAL, updatesOut: RESOLVED_AT };

export const LOOP_AFTER_MS = 3600;
