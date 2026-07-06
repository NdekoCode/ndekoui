import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { wordsOf } from '@/registry/ndeko/lib/words';

import { DEMO_EXCHANGE_ID, EXCHANGES, type ExchangeId } from './data';

export type Phase = 'idle' | 'thinking' | 'reading' | 'streaming' | 'done';

export type Turn = {
  id: number;
  exchangeId: ExchangeId;
  question: string;
};

export type ChatState = {
  draft: string;
  turns: Turn[];
  phase: Phase;
  toolsShown: number;
};

export type ChatAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'asked'; exchangeId: ExchangeId; question: string }
  | { type: 'tick' }
  | { type: 'wait' };

type Step = SessionStep<ChatState, ChatAction>;

const MAX_TURNS = 3;

export const THINK_MS = 800;

export const TOOL_MS = 700;

export const STREAM_LEAD_MS = 450;

export const WORD_MS = 48;

const STREAM_SETTLE_MS = 500;

const LINGER_MS = 3600;

const FIRST_KEY_MS = 1300;

const KEY_MS = 64;

const KEYS_PER_STEP = 3;

const SEND_AFTER_MS = 650;

const DEMO_EXCHANGE = EXCHANGES[DEMO_EXCHANGE_ID];

export const INITIAL: ChatState = {
  draft: '',
  turns: [],
  phase: 'idle',
  toolsShown: 0,
};

export function lastTurnOf(state: ChatState) {
  return state.turns.at(-1);
}

export function isAnswering(phase: Phase) {
  const isIdle = phase === 'idle';
  const isDone = phase === 'done';
  return !isIdle && !isDone;
}

export function exchangeOfText(text: string): ExchangeId {
  const lowered = text.toLowerCase();
  if (lowered.includes('move')) {
    return 'move';
  }
  if (lowered.includes('promise')) {
    return 'promises';
  }
  if (lowered.includes('friday') || lowered.includes('plate')) {
    return 'friday';
  }
  return 'fallback';
}

function asked(
  state: ChatState,
  exchangeId: ExchangeId,
  question: string
): ChatState {
  if (isAnswering(state.phase)) {
    return state;
  }
  const lastId = lastTurnOf(state)?.id ?? 0;
  const turn: Turn = { id: lastId + 1, exchangeId, question };
  const turns = [...state.turns, turn].slice(-MAX_TURNS);
  return { draft: '', turns, phase: 'thinking', toolsShown: 0 };
}

function sent(state: ChatState): ChatState {
  const question = state.draft.trim();
  if (question === '') {
    return state;
  }
  const exchangeId = exchangeOfText(question);
  return asked(state, exchangeId, question);
}

function ticked(state: ChatState): ChatState {
  const turn = lastTurnOf(state);
  if (!turn) {
    return state;
  }
  const toolCount = EXCHANGES[turn.exchangeId].tools.length;
  if (state.phase === 'thinking') {
    return { ...state, phase: 'reading' };
  }
  if (state.phase === 'reading') {
    const hasMoreTools = state.toolsShown < toolCount;
    if (hasMoreTools) {
      return { ...state, toolsShown: state.toolsShown + 1 };
    }
    return { ...state, phase: 'streaming' };
  }
  if (state.phase === 'streaming') {
    return { ...state, phase: 'done' };
  }
  return state;
}

export function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state);
    case 'asked':
      return asked(state, action.exchangeId, action.question);
    case 'tick':
      return ticked(state);
    case 'wait':
      return state;
  }
}

export function tickDelayOf(state: ChatState) {
  const turn = lastTurnOf(state);
  if (!turn) {
    return null;
  }
  const exchange = EXCHANGES[turn.exchangeId];
  if (state.phase === 'thinking') {
    return THINK_MS;
  }
  if (state.phase === 'reading') {
    const hasMoreTools = state.toolsShown < exchange.tools.length;
    if (hasMoreTools) {
      return TOOL_MS;
    }
    return STREAM_LEAD_MS;
  }
  if (state.phase === 'streaming') {
    const wordCount = wordsOf(exchange.answer).length;
    return wordCount * WORD_MS + STREAM_SETTLE_MS;
  }
  return null;
}

function answerMsOf(exchangeId: ExchangeId) {
  const exchange = EXCHANGES[exchangeId];
  const wordCount = wordsOf(exchange.answer).length;
  const toolsMs = exchange.tools.length * TOOL_MS;
  const streamMs = wordCount * WORD_MS + STREAM_SETTLE_MS;
  return THINK_MS + toolsMs + STREAM_LEAD_MS + streamMs;
}

function typingSteps(): Step[] {
  const prompt = DEMO_EXCHANGE.prompt;
  const steps: Step[] = [];
  const last = prompt.length + KEYS_PER_STEP;
  for (let end = KEYS_PER_STEP; end < last; end += KEYS_PER_STEP) {
    const text = prompt.slice(0, end);
    let after = KEY_MS;
    if (steps.length === 0) {
      after = FIRST_KEY_MS;
    }
    steps.push({ after, by: 'demo', action: { type: 'typed', text } });
  }
  return steps;
}

function hasAsked(state: ChatState) {
  return state.turns.length > 0;
}

export const SCRIPT: Step[] = [
  ...typingSteps(),
  {
    after: SEND_AFTER_MS,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasAsked,
  },
  { after: answerMsOf(DEMO_EXCHANGE_ID) + LINGER_MS, action: { type: 'wait' } },
];

export const RESTING: ChatState = {
  draft: '',
  turns: [
    { id: 1, exchangeId: DEMO_EXCHANGE_ID, question: DEMO_EXCHANGE.prompt },
  ],
  phase: 'done',
  toolsShown: DEMO_EXCHANGE.tools.length,
};

export const LOOP_AFTER_MS = 1800;
