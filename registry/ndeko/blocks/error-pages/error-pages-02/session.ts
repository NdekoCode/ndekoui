import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type LoadStatus = 'error' | 'retrying' | 'recovered';

export type ServerState = {
  status: LoadStatus;
  /** Retries asked for so far. The page itself was the first try. */
  attempts: number;
  failures: number;
  isCopied: boolean;
  spoken: string;
};

export type ServerAction =
  | { type: 'retried' }
  | { type: 'answered'; attempt: number }
  | { type: 'copied' }
  | { type: 'copyReset' };

type Step = SessionStep<ServerState, ServerAction>;

export const RETRY_MS = 1500;

/** The simulated server fails the first retry and answers the second. */
const SUCCEEDS_ON_ATTEMPT = 2;

export const INITIAL: ServerState = {
  status: 'error',
  attempts: 0,
  failures: 0,
  isCopied: false,
  spoken: '',
};

function triesLineOf(attempts: number) {
  const tries = attempts + 1;
  return `Still not working after ${tries} tries`;
}

function retried(state: ServerState): ServerState {
  if (state.status !== 'error') {
    return state;
  }
  return {
    ...state,
    status: 'retrying',
    attempts: state.attempts + 1,
    spoken: 'Retrying',
  };
}

/** An answer only counts for the retry it belongs to. */
function answered(state: ServerState, attempt: number): ServerState {
  const isWaiting = state.status === 'retrying';
  const isCurrent = attempt === state.attempts;
  if (!isWaiting || !isCurrent) {
    return state;
  }
  if (attempt >= SUCCEEDS_ON_ATTEMPT) {
    return { ...state, status: 'recovered', spoken: 'The page loaded' };
  }
  return {
    ...state,
    status: 'error',
    failures: state.failures + 1,
    spoken: triesLineOf(state.attempts),
  };
}

export function reducer(state: ServerState, action: ServerAction) {
  switch (action.type) {
    case 'retried':
      return retried(state);
    case 'answered':
      return answered(state, action.attempt);
    case 'copied':
      return { ...state, isCopied: true, spoken: 'Error ID copied' };
    case 'copyReset':
      return { ...state, isCopied: false };
  }
}

/**
 * A person tries again and gets the same error, copies the ID for support, and tries once more.
 * The server answers on its own, whoever pressed.
 */
export const SCRIPT: Step[] = [
  { after: 1700, by: 'demo', press: 'retry', action: { type: 'retried' } },
  {
    after: RETRY_MS + 1300,
    by: 'demo',
    press: 'copy',
    action: { type: 'copied' },
  },
  { after: 1900, by: 'demo', press: 'retry', action: { type: 'retried' } },
];

/** Under reduced motion the page shows the error after one retry that failed. */
export const RESTING: ServerState = {
  status: 'error',
  attempts: 1,
  failures: 1,
  isCopied: false,
  spoken: '',
};

export const LOOP_AFTER_MS = RETRY_MS + 3200;
