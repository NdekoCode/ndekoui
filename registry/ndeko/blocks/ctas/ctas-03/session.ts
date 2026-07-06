import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import { TASKS } from './data';

export type TaskStatus = 'open' | 'replying' | 'done';

export type FormStatus = 'idle' | 'invalid' | 'sending' | 'sent';

export type CtaState = {
  email: string;
  form: FormStatus;
  /** Counts the refused submits, so a second refusal nudges the field again. */
  attempts: number;
  sentTo: string;
  tasks: TaskStatus[];
};

export type CtaAction =
  | { type: 'typed'; value: string }
  | { type: 'submitted' }
  | { type: 'sent' }
  | { type: 'reset' }
  | { type: 'replying'; index: number }
  | { type: 'resolved'; index: number };

type Step = SessionStep<CtaState, CtaAction>;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailLike(email: string) {
  return EMAIL_SHAPE.test(email.trim());
}

function allTasks(status: TaskStatus): TaskStatus[] {
  return TASKS.map(() => status);
}

export const INITIAL: CtaState = {
  email: '',
  form: 'idle',
  attempts: 0,
  sentTo: '',
  tasks: allTasks('open'),
};

function submitted(state: CtaState): CtaState {
  const isIdle = state.form === 'idle';
  const isRefused = state.form === 'invalid';
  const canSubmit = isIdle || isRefused;
  if (!canSubmit) {
    return state;
  }
  if (!isEmailLike(state.email)) {
    return { ...state, form: 'invalid', attempts: state.attempts + 1 };
  }
  return { ...state, form: 'sending' };
}

function sent(state: CtaState): CtaState {
  if (state.form !== 'sending') {
    return state;
  }
  return { ...state, form: 'sent', sentTo: state.email.trim() };
}

function withTask(
  state: CtaState,
  index: number,
  status: TaskStatus
): CtaState {
  const tasks = state.tasks.map((current, position) => {
    if (position === index) {
      return status;
    }
    return current;
  });
  return { ...state, tasks };
}

export function reducer(state: CtaState, action: CtaAction): CtaState {
  switch (action.type) {
    case 'typed':
      return { ...state, email: action.value, form: 'idle' };
    case 'submitted':
      return submitted(state);
    case 'sent':
      return sent(state);
    case 'reset':
      return { ...state, email: '', form: 'idle' };
    case 'replying':
      return withTask(state, action.index, 'replying');
    case 'resolved':
      return withTask(state, action.index, 'done');
  }
}

export function resolvedCountOf(state: CtaState) {
  const resolved = state.tasks.filter((status) => status === 'done');
  return resolved.length;
}

const TYPED_EMAIL = 'amina@lubumbashi-books.example';

const KEY_MS = 48;

export const SEND_MS = 1100;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value },
  }));
}

function replying(after: number, index: number): Step {
  return { after, action: { type: 'replying', index } };
}

function resolved(after: number, index: number): Step {
  return { after, action: { type: 'resolved', index } };
}

/**
 * The queue clears on its own clock. Someone types an address and asks for the link while the
 * second conversation is being answered, and the rest of the queue goes on after the link is sent.
 */
export const SCRIPT: Step[] = [
  replying(1200, 0),
  resolved(1300, 0),
  replying(600, 1),
  ...typing(TYPED_EMAIL, 500),
  resolved(500, 1),
  {
    after: 900,
    by: 'demo',
    press: 'submit',
    action: { type: 'submitted' },
  },
  replying(1500, 2),
  resolved(1300, 2),
  replying(700, 3),
  resolved(1200, 3),
  replying(700, 4),
  resolved(1200, 4),
];

/** Under reduced motion the address is typed and the whole queue is cleared. */
export const RESTING: CtaState = {
  ...INITIAL,
  email: TYPED_EMAIL,
  tasks: allTasks('done'),
};

export const LOOP_AFTER_MS = 3600;
