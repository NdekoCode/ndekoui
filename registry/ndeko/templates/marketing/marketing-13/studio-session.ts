import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import { BRIEF, HERO_TAKES } from './data';

export type StudioStage = 'typing' | 'making' | 'done';

export type StudioState = {
  brief: string;
  stage: StudioStage;
  readyCount: number;
};

export type StudioAction =
  | { type: 'typed'; text: string }
  | { type: 'made' }
  | { type: 'takeReady' }
  | { type: 'settled' };

type Step = SessionStep<StudioState, StudioAction>;

export const TAKE_COUNT = HERO_TAKES.length;

export const MAKE_PRESS_KEY = 'make';

export const READY_DELAYS_MS = [1100, 800, 650, 900];

export const INITIAL: StudioState = {
  brief: '',
  stage: 'typing',
  readyCount: 0,
};

export const RESTING: StudioState = {
  brief: BRIEF,
  stage: 'done',
  readyCount: TAKE_COUNT,
};

function made(state: StudioState): StudioState {
  const isEmpty = state.brief.trim() === '';
  if (isEmpty || state.stage === 'making') {
    return state;
  }
  return { ...state, stage: 'making', readyCount: 0 };
}

function takeReady(state: StudioState): StudioState {
  if (state.stage !== 'making') {
    return state;
  }
  const readyCount = state.readyCount + 1;
  if (readyCount >= TAKE_COUNT) {
    return { ...state, stage: 'done', readyCount };
  }
  return { ...state, readyCount };
}

export function reducer(state: StudioState, action: StudioAction) {
  switch (action.type) {
    case 'typed':
      return { ...state, brief: action.text };
    case 'made':
      return made(state);
    case 'takeReady':
      return takeReady(state);
    case 'settled':
      return state;
  }
}

function hasMade(state: StudioState) {
  return state.stage !== 'typing';
}

function isMaking(state: StudioState) {
  return state.stage === 'making';
}

function typingSteps() {
  const prefixes = prefixesOf(BRIEF);
  return prefixes.map((text, index): Step => {
    const after = keyDelayOf(index, 1000, 38);
    return { after, by: 'demo', action: { type: 'typed', text } };
  });
}

const SCRIPT: Step[] = [
  ...typingSteps(),
  {
    after: 700,
    by: 'person',
    press: MAKE_PRESS_KEY,
    action: { type: 'made' },
    isAnswered: hasMade,
  },
  { after: 500, by: 'agent', action: { type: 'settled' } },
];

export const SESSION: SessionConfig<StudioState, StudioAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 3600,
  holdWhile: isMaking,
};
