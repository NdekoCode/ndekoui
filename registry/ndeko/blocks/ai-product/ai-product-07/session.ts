import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  DEMO_KEYWORD,
  DEMO_PICK,
  directionOf,
  RESULT_COUNT,
  type DirectionId,
} from './data';

export type Phase = 'picking' | 'brief' | 'generating' | 'done';

export type DirectionState = {
  phase: Phase;
  pickedId: DirectionId | null;
  keywords: string[];
  progress: number;
  spoken: string;
};

export type DirectionAction =
  | { type: 'picked'; id: DirectionId }
  | { type: 'keywordEdited'; index: number; text: string }
  | { type: 'generateStarted' }
  | { type: 'progressed' }
  | { type: 'startedOver' };

type Step = SessionStep<DirectionState, DirectionAction>;

export const INITIAL: DirectionState = {
  phase: 'picking',
  pickedId: null,
  keywords: [],
  progress: 0,
  spoken: '',
};

const PROGRESS_STEP = 15;

function picked(state: DirectionState, id: DirectionId): DirectionState {
  if (state.phase === 'generating') {
    return state;
  }
  const direction = directionOf(id);
  return {
    phase: 'brief',
    pickedId: id,
    keywords: [...direction.keywords],
    progress: 0,
    spoken: `${direction.name} picked. Its brief is ready to edit`,
  };
}

function keywordEdited(
  state: DirectionState,
  index: number,
  text: string
): DirectionState {
  const hasBrief = state.pickedId !== null;
  if (!hasBrief) {
    return state;
  }
  const keywords = state.keywords.map((keyword, position) => {
    if (position === index) {
      return text;
    }
    return keyword;
  });
  return { ...state, keywords };
}

function generateStarted(state: DirectionState): DirectionState {
  const canGenerate = state.phase === 'brief' || state.phase === 'done';
  if (!canGenerate) {
    return state;
  }
  return {
    ...state,
    phase: 'generating',
    progress: 0,
    spoken: 'Generating options',
  };
}

function progressed(state: DirectionState): DirectionState {
  if (state.phase !== 'generating') {
    return state;
  }
  const advanced = state.progress + PROGRESS_STEP;
  const next = Math.min(100, advanced);
  if (next < 100) {
    return { ...state, progress: next };
  }
  return {
    ...state,
    phase: 'done',
    progress: 100,
    spoken: `${RESULT_COUNT} options generated`,
  };
}

export function reducer(
  state: DirectionState,
  action: DirectionAction
): DirectionState {
  switch (action.type) {
    case 'picked':
      return picked(state, action.id);
    case 'keywordEdited':
      return keywordEdited(state, action.index, action.text);
    case 'generateStarted':
      return generateStarted(state);
    case 'progressed':
      return progressed(state);
    case 'startedOver':
      return INITIAL;
  }
}

function hasPicked(state: DirectionState) {
  return state.pickedId !== null;
}

function hasGenerated(state: DirectionState) {
  const isGenerating = state.phase === 'generating';
  const isDone = state.phase === 'done';
  return isGenerating || isDone;
}

const KEY_MS = 85;

function editSteps(text: string, startAfter: number): Step[] {
  const prefixes = ['', ...prefixesOf(text)];
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'keywordEdited', index: DEMO_KEYWORD.index, text: typed },
  }));
}

const STEPS_TO_FULL = 100 / PROGRESS_STEP;

const PROGRESS_STEPS = Math.ceil(STEPS_TO_FULL);

/** The generation is the agent's work: it goes on once a person has taken over. */
const GENERATION: Step[] = Array.from({ length: PROGRESS_STEPS }, () => ({
  after: 430,
  action: { type: 'progressed' },
}));

export const SCRIPT: Step[] = [
  {
    after: 1700,
    by: 'person',
    press: `tile-${DEMO_PICK}`,
    isAnswered: hasPicked,
    action: { type: 'picked', id: DEMO_PICK },
  },
  ...editSteps(DEMO_KEYWORD.text, 1900),
  {
    after: 1300,
    by: 'person',
    press: 'generate',
    isAnswered: hasGenerated,
    action: { type: 'generateStarted' },
  },
  ...GENERATION,
];

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: DirectionState = { ...endOf(SCRIPT), spoken: '' };

export const LOOP_AFTER_MS = 5200;
