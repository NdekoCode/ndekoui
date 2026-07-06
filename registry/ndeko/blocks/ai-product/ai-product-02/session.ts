import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  answerTextOf,
  SUGGESTIONS,
  suggestionOf,
  WAITING,
  type SuggestionId,
  type WaitingId,
} from './data';

export type AnswerId = SuggestionId | 'none';

export type HomeState = {
  question: string;
  answerId: AnswerId | null;
  /** How many of the agents have stopped to ask for the person. They arrive in the order of the list. */
  arrived: number;
  resolved: WaitingId[];
  spoken: string;
};

export type HomeAction =
  | { type: 'arrived' }
  | { type: 'questionTyped'; text: string }
  | { type: 'asked' }
  | { type: 'suggestionPicked'; id: SuggestionId }
  | { type: 'resolved'; id: WaitingId };

type Step = SessionStep<HomeState, HomeAction>;

export const INITIAL: HomeState = {
  question: '',
  answerId: null,
  arrived: 0,
  resolved: [],
  spoken: '',
};

export function waitingCountOf(state: HomeState) {
  return state.arrived - state.resolved.length;
}

function arrived(state: HomeState): HomeState {
  if (state.arrived >= WAITING.length) {
    return state;
  }
  const next = WAITING[state.arrived];
  const spoken = `${next.agent} needs you: ${next.ask}`;
  return { ...state, arrived: state.arrived + 1, spoken };
}

function questionTyped(state: HomeState, text: string): HomeState {
  return { ...state, question: text, answerId: null };
}

function asked(state: HomeState): HomeState {
  const isEmpty = state.question.trim() === '';
  if (isEmpty) {
    return state;
  }
  const match = suggestionOf(state.question);
  const answerId: AnswerId = match?.id ?? 'none';
  const spoken = answerTextOf(answerId);
  return { ...state, answerId, spoken };
}

function suggestionPicked(state: HomeState, id: SuggestionId): HomeState {
  const suggestion = SUGGESTIONS.find((candidate) => candidate.id === id);
  if (!suggestion) {
    return state;
  }
  return {
    ...state,
    question: suggestion.question,
    answerId: id,
    spoken: suggestion.answer,
  };
}

function resolved(state: HomeState, id: WaitingId): HomeState {
  const index = WAITING.findIndex((waiting) => waiting.id === id);
  const hasArrived = index >= 0 && index < state.arrived;
  const isDone = state.resolved.includes(id);
  if (!hasArrived || isDone) {
    return state;
  }
  const spoken = WAITING[index].done;
  return { ...state, resolved: [...state.resolved, id], spoken };
}

export function reducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case 'arrived':
      return arrived(state);
    case 'questionTyped':
      return questionTyped(state, action.text);
    case 'asked':
      return asked(state);
    case 'suggestionPicked':
      return suggestionPicked(state, action.id);
    case 'resolved':
      return resolved(state, action.id);
  }
}

const KEY_MS = 42;

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'questionTyped', text: typed },
  }));
}

function arrivalAfterOf(index: number) {
  if (index === 0) {
    return 900;
  }
  return 750;
}

/** The agents arrive on their own, so they keep arriving after a person takes over. */
const ARRIVALS: Step[] = WAITING.map((_, index) => ({
  after: arrivalAfterOf(index),
  action: { type: 'arrived' },
}));

const QUESTION = SUGGESTIONS[0].question;

export const SCRIPT: Step[] = [
  ...ARRIVALS,
  ...typingSteps(QUESTION, 1500),
  { after: 450, by: 'demo', press: 'ask', action: { type: 'asked' } },
  {
    after: 2800,
    by: 'demo',
    press: 'act-writer',
    action: { type: 'resolved', id: 'writer' },
  },
];

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: HomeState = { ...endOf(SCRIPT), spoken: '' };

export const LOOP_AFTER_MS = 4200;
