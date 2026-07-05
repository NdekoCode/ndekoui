import { FIRST_PROMPT, SECOND_PROMPT } from './data';
import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

/** 0 nothing asked, 1 writing the first version, 2 first version ready, 3 revising, 4 second version ready. */
export type Stage = 0 | 1 | 2 | 3 | 4;

export type Version = 1 | 2;

export type ArtifactView = 'code' | 'changes';

export type ApplyStatus = 'idle' | 'busy' | 'done';

export type ArtifactState = {
  draft: string;
  asks: string[];
  stage: Stage;
  version: Version;
  view: ArtifactView;
  apply: ApplyStatus;
  appliedVersion: Version | null;
  isSheetOpen: boolean;
};

export type ArtifactAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'wrote' }
  | { type: 'version'; version: Version }
  | { type: 'view'; view: ArtifactView }
  | { type: 'applying' }
  | { type: 'applied' }
  | { type: 'sheet'; isOpen: boolean };

type Step = SessionStep<ArtifactState, ArtifactAction>;

export const INITIAL: ArtifactState = {
  draft: '',
  asks: [],
  stage: 0,
  version: 1,
  view: 'code',
  apply: 'idle',
  appliedVersion: null,
  isSheetOpen: false,
};

export function canSendAt(stage: Stage) {
  return stage === 0 || stage === 2;
}

function fallbackPromptOf(stage: Stage) {
  if (stage === 0) {
    return FIRST_PROMPT;
  }
  return SECOND_PROMPT;
}

function askOf(state: ArtifactState) {
  const trimmed = state.draft.trim();
  if (trimmed === '') {
    return fallbackPromptOf(state.stage);
  }
  return trimmed;
}

function sent(state: ArtifactState): ArtifactState {
  if (!canSendAt(state.stage)) {
    return state;
  }
  const asks = [...state.asks, askOf(state)];
  if (state.stage === 0) {
    return { ...state, draft: '', asks, stage: 1 };
  }
  return { ...state, draft: '', asks, stage: 3 };
}

function wrote(state: ArtifactState): ArtifactState {
  if (state.stage === 1) {
    return { ...state, stage: 2, version: 1 };
  }
  if (state.stage === 3) {
    return { ...state, stage: 4, version: 2, apply: 'idle' };
  }
  return state;
}

function applied(state: ArtifactState): ArtifactState {
  if (state.apply !== 'busy') {
    return state;
  }
  return { ...state, apply: 'done', appliedVersion: state.version };
}

export function reducer(
  state: ArtifactState,
  action: ArtifactAction
): ArtifactState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state);
    case 'wrote':
      return wrote(state);
    case 'version':
      return { ...state, version: action.version, apply: 'idle' };
    case 'view':
      return { ...state, view: action.view };
    case 'applying':
      return { ...state, apply: 'busy' };
    case 'applied':
      return applied(state);
    case 'sheet':
      return { ...state, isSheetOpen: action.isOpen };
  }
}

const CHUNK = 3;

function delayOfChunk(index: number, startAfter: number) {
  if (index === 0) {
    return startAfter;
  }
  return 70;
}

function typingSteps(text: string, startAfter: number): Step[] {
  const steps: Step[] = [];
  const last = text.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const typed = text.slice(0, end);
    const after = delayOfChunk(steps.length, startAfter);
    steps.push({ after, by: 'demo', action: { type: 'typed', text: typed } });
  }
  return steps;
}

function hasAskedOnce(state: ArtifactState) {
  return state.stage >= 1;
}

function hasAskedTwice(state: ArtifactState) {
  return state.stage >= 3;
}

/** How long a version takes to write: the panel streams its lines during that time. */
export const WRITE_MS = 2600;

export const REVISE_MS = 1700;

export const APPLY_MS = 900;

export const SCRIPT: Step[] = [
  ...typingSteps(FIRST_PROMPT, 1000),
  {
    after: 450,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasAskedOnce,
  },
  { after: 500, by: 'demo', action: { type: 'sheet', isOpen: true } },
  { after: WRITE_MS, action: { type: 'wrote' } },
  { after: 1500, by: 'demo', action: { type: 'sheet', isOpen: false } },
  ...typingSteps(SECOND_PROMPT, 500),
  {
    after: 450,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasAskedTwice,
  },
  { after: 500, by: 'demo', action: { type: 'sheet', isOpen: true } },
  { after: REVISE_MS, action: { type: 'wrote' } },
  { after: 1700, by: 'demo', action: { type: 'view', view: 'changes' } },
  { after: 1900, by: 'demo', press: 'apply', action: { type: 'applying' } },
  { after: APPLY_MS, action: { type: 'applied' } },
  { after: 1600, by: 'demo', action: { type: 'sheet', isOpen: false } },
];

function restingOf() {
  let state = INITIAL;
  for (const step of SCRIPT) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 2600;
