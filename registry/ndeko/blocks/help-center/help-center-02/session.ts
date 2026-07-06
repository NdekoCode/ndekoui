import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

export type Answer = 'none' | 'yes' | 'no';

export type FeedbackStatus = 'asking' | 'explaining' | 'thanked';

export type FeedbackState = {
  answer: Answer;
  status: FeedbackStatus;
  reason: string;
  /** True once a reason went out with the answer. */
  hasNote: boolean;
  spoken: string;
};

export type FeedbackAction =
  | { type: 'answered'; answer: 'yes' | 'no' }
  | { type: 'typed'; value: string }
  | { type: 'sent' }
  | { type: 'skipped' }
  | { type: 'changed' };

type Step = SessionStep<FeedbackState, FeedbackAction>;

export const INITIAL: FeedbackState = {
  answer: 'none',
  status: 'asking',
  reason: '',
  hasNote: false,
  spoken: '',
};

function answered(state: FeedbackState, answer: 'yes' | 'no'): FeedbackState {
  if (state.status === 'thanked') {
    return state;
  }
  if (answer === 'yes') {
    return {
      ...state,
      answer,
      status: 'thanked',
      hasNote: false,
      spoken: 'Thanks for letting us know',
    };
  }
  return { ...state, answer, status: 'explaining', spoken: '' };
}

function sent(state: FeedbackState): FeedbackState {
  if (state.status !== 'explaining') {
    return state;
  }
  const hasNote = state.reason.trim() !== '';
  if (!hasNote) {
    return state;
  }
  return {
    ...state,
    status: 'thanked',
    hasNote,
    spoken: 'Thanks, your note was sent to the team that writes these articles',
  };
}

function skipped(state: FeedbackState): FeedbackState {
  if (state.status !== 'explaining') {
    return state;
  }
  return {
    ...state,
    status: 'thanked',
    reason: '',
    hasNote: false,
    spoken: 'Thanks for letting us know',
  };
}

export function reducer(
  state: FeedbackState,
  action: FeedbackAction
): FeedbackState {
  switch (action.type) {
    case 'answered':
      return answered(state, action.answer);
    case 'typed':
      return { ...state, reason: action.value };
    case 'sent':
      return sent(state);
    case 'skipped':
      return skipped(state);
    case 'changed':
      return { ...INITIAL, spoken: 'Was this article helpful?' };
  }
}

const REASON = 'The steps for someone who already left are missing';

const KEY_MS = 40;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value },
  }));
}

/** A reader answers No, says what was missing and sends it; the question turns into a thank-you. */
export const SCRIPT: Step[] = [
  {
    after: 1800,
    by: 'demo',
    press: 'answer-no',
    action: { type: 'answered', answer: 'no' },
  },
  ...typing(REASON, 1100),
  { after: 700, by: 'demo', press: 'send', action: { type: 'sent' } },
];

/** Under reduced motion the reader has said what was missing and the thank-you stands in place. */
export const RESTING: FeedbackState = {
  answer: 'no',
  status: 'thanked',
  reason: REASON,
  hasNote: true,
  spoken: '',
};

export const LOOP_AFTER_MS = 3400;
