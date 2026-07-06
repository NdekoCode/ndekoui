import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

export type TileId = 'prompt' | 'plan' | 'approval' | 'context' | 'cost';

export type PromptStage = 0 | 1 | 2 | 3;

export type Decision = 'allowed' | 'denied';

export type ApprovalState = 'waiting' | Decision;

export type FeaturesState = {
  /** The tile that is playing: the others rest on their picture. */
  focus: TileId | null;
  prompt: string;
  stage: PromptStage;
  /** The step of the plan that is running: -1 before it starts, the length of the plan when it is done. */
  planStep: number;
  approval: ApprovalState;
  contextPercent: number;
  costCents: number;
};

export type FeaturesAction =
  | { type: 'focus'; tile: TileId | null }
  | { type: 'typed'; text: string }
  | { type: 'stage'; stage: PromptStage }
  | { type: 'planned'; step: number }
  | { type: 'decided'; decision: Decision }
  | { type: 'context'; percent: number }
  | { type: 'cost'; cents: number }
  | { type: 'settled' };

type Step = SessionStep<FeaturesState, FeaturesAction>;

export const PROMPT_TEXT = 'Close March for Kivuline Roasters';

export const STATUS_LINES = [
  'Waiting',
  'Reading 412 bank lines',
  'Matching to invoices',
  'Ready for review',
];

export const PLAN_STEPS = [
  'Match 412 bank lines',
  'Flag the 14 that do not match',
  'Draft the journal entries',
  'Hand them over for review',
];

export const CONTEXT_MONTHS = 14;

export const INITIAL: FeaturesState = {
  focus: null,
  prompt: '',
  stage: 0,
  planStep: -1,
  approval: 'waiting',
  contextPercent: 0,
  costCents: 0,
};

/** What the tiles show once nobody is playing them: each one on its most telling picture. */
export const RESTING: FeaturesState = {
  focus: null,
  prompt: PROMPT_TEXT,
  stage: 3,
  planStep: PLAN_STEPS.length,
  approval: 'waiting',
  contextPercent: 82,
  costCents: 246,
};

export function reducer(
  state: FeaturesState,
  action: FeaturesAction
): FeaturesState {
  switch (action.type) {
    case 'focus':
      return { ...state, focus: action.tile };
    case 'typed':
      return { ...state, prompt: action.text };
    case 'stage':
      return { ...state, stage: action.stage };
    case 'planned':
      return { ...state, planStep: action.step };
    case 'decided':
      return { ...state, approval: action.decision };
    case 'context':
      return { ...state, contextPercent: action.percent };
    case 'cost':
      return { ...state, costCents: action.cents };
    case 'settled':
      return RESTING;
  }
}

const KEY_MS = 45;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', text: typed },
  }));
}

function focus(after: number, tile: TileId | null): Step {
  return { after, by: 'demo', action: { type: 'focus', tile } };
}

function stage(after: number, value: PromptStage): Step {
  return { after, by: 'demo', action: { type: 'stage', stage: value } };
}

function planned(after: number, step: number): Step {
  return { after, by: 'demo', action: { type: 'planned', step } };
}

function context(after: number, percent: number): Step {
  return { after, by: 'demo', action: { type: 'context', percent } };
}

function cost(after: number, cents: number): Step {
  return { after, by: 'demo', action: { type: 'cost', cents } };
}

/** The tiles play in turn, one at a time: a request, its plan, an approval, the ledger in view, the cost. */
export const SCRIPT: Step[] = [
  focus(1400, 'prompt'),
  ...typing(PROMPT_TEXT, 500),
  stage(600, 1),
  stage(1300, 2),
  stage(1300, 3),
  focus(1200, 'plan'),
  planned(600, 0),
  planned(900, 1),
  planned(900, 2),
  planned(900, 3),
  planned(900, PLAN_STEPS.length),
  focus(1200, 'approval'),
  {
    after: 1700,
    by: 'demo',
    press: 'allow',
    action: { type: 'decided', decision: 'allowed' },
  },
  focus(1700, 'context'),
  context(500, 34),
  context(800, 61),
  context(800, 82),
  focus(1500, 'cost'),
  cost(500, 84),
  cost(800, 171),
  cost(800, 246),
  focus(1600, null),
];

export const LOOP_AFTER_MS = 2400;
