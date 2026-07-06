import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  ANSWER_TOKENS,
  FOLDED_BY_DEMO,
  QUESTION,
  SECTION_WORDS,
  seedOf,
  type StepId,
} from './data';

export type Stage =
  | 'idle'
  | 'researching'
  | 'answering'
  | 'answered'
  | 'asking'
  | 'sharing'
  | 'shared'
  | 'kept';

export type Decision = 'approved' | 'denied';

export type ActivityRun = {
  id: StepId;
  status: 'running' | 'done';
  startedAt: number;
  endedAt?: number;
};

export type ResearchState = {
  draft: string;
  question: string | null;
  followUps: string[];
  stage: Stage;
  activity: ActivityRun[];
  sectionsStarted: number;
  sectionsDone: number;
  foldedSections: string[];
  costUsd: number;
  startedAt?: number;
  endedAt?: number;
  demoLitSource: number | null;
  isSheetOpen: boolean;
};

export type ResearchAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'stepStarted'; id: StepId }
  | { type: 'stepDone'; id: StepId }
  | { type: 'sectionStarted' }
  | { type: 'sectionDone' }
  | { type: 'answering' }
  | { type: 'answered' }
  | { type: 'asked' }
  | { type: 'decided'; decision: Decision }
  | { type: 'shared' }
  | { type: 'lit'; source: number | null }
  | { type: 'sectionToggled'; id: string }
  | { type: 'sheet'; isOpen: boolean }
  | { type: 'batch'; actions: ResearchAction[] };

type Step = SessionStep<ResearchState, ResearchAction>;

export const INITIAL: ResearchState = {
  draft: '',
  question: null,
  followUps: [],
  stage: 'idle',
  activity: [],
  sectionsStarted: 0,
  sectionsDone: 0,
  foldedSections: [],
  costUsd: 0,
  demoLitSource: null,
  isSheetOpen: false,
};

const STAGE_ORDER: Stage[] = [
  'idle',
  'researching',
  'answering',
  'answered',
  'asking',
  'sharing',
  'shared',
  'kept',
];

export function hasReached(stage: Stage, target: Stage) {
  const position = STAGE_ORDER.indexOf(stage);
  const targetPosition = STAGE_ORDER.indexOf(target);
  return position >= targetPosition;
}

export function isOver(stage: Stage) {
  return stage === 'shared' || stage === 'kept';
}

/** A person who takes over while the question is being typed sends the whole question, not the half that was typed. */
function questionOf(draft: string) {
  const trimmed = draft.trim();
  const isUnfinishedDemo = QUESTION.startsWith(trimmed);
  if (isUnfinishedDemo) {
    return QUESTION;
  }
  return trimmed;
}

/** What Send would post now: the first question, then follow-ups once the run is over. Null while the agent works. */
export function sendableTextOf(state: ResearchState) {
  if (state.question === null) {
    return questionOf(state.draft);
  }
  const text = state.draft.trim();
  const canFollowUp = isOver(state.stage) && text !== '';
  if (canFollowUp) {
    return text;
  }
  return null;
}

function sent(state: ResearchState, now: number): ResearchState {
  const text = sendableTextOf(state);
  if (text === null) {
    return state;
  }
  if (state.question === null) {
    return {
      ...state,
      draft: '',
      question: text,
      stage: 'researching',
      startedAt: now,
    };
  }
  return { ...state, draft: '', followUps: [...state.followUps, text] };
}

function stepStarted(
  state: ResearchState,
  id: StepId,
  now: number
): ResearchState {
  const isKnown = state.activity.some((run) => run.id === id);
  if (isKnown) {
    return state;
  }
  const run: ActivityRun = { id, status: 'running', startedAt: now };
  return { ...state, activity: [...state.activity, run] };
}

function isRunningStep(run: ActivityRun, id: StepId) {
  return run.id === id && run.status === 'running';
}

function stepDone(
  state: ResearchState,
  id: StepId,
  now: number
): ResearchState {
  const wasRunning = state.activity.some((run) => isRunningStep(run, id));
  if (!wasRunning) {
    return state;
  }
  const activity = state.activity.map((run) => {
    if (run.id !== id) {
      return run;
    }
    const ended: ActivityRun = { ...run, status: 'done', endedAt: now };
    return ended;
  });
  const seed = seedOf(id);
  const costUsd = state.costUsd + seed.usd;
  return { ...state, activity, costUsd };
}

function sectionStarted(state: ResearchState): ResearchState {
  const isWriting = state.sectionsStarted > state.sectionsDone;
  const isComplete = state.sectionsStarted >= SECTION_WORDS.length;
  if (isWriting || isComplete) {
    return state;
  }
  const sectionsStarted = state.sectionsStarted + 1;
  return { ...state, sectionsStarted };
}

function answering(state: ResearchState, now: number): ResearchState {
  if (state.stage !== 'researching') {
    return state;
  }
  return { ...state, stage: 'answering', endedAt: now };
}

function staged(state: ResearchState, from: Stage, to: Stage): ResearchState {
  if (state.stage !== from) {
    return state;
  }
  return { ...state, stage: to };
}

function decided(state: ResearchState, decision: Decision): ResearchState {
  if (decision === 'approved') {
    return staged(state, 'asking', 'sharing');
  }
  return staged(state, 'asking', 'kept');
}

function sectionToggled(state: ResearchState, id: string): ResearchState {
  const isFolded = state.foldedSections.includes(id);
  if (isFolded) {
    const foldedSections = state.foldedSections.filter(
      (folded) => folded !== id
    );
    return { ...state, foldedSections };
  }
  return { ...state, foldedSections: [...state.foldedSections, id] };
}

export function applyAt(
  state: ResearchState,
  action: ResearchAction,
  now: number
): ResearchState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state, now);
    case 'stepStarted':
      return stepStarted(state, action.id, now);
    case 'stepDone':
      return stepDone(state, action.id, now);
    case 'sectionStarted':
      return sectionStarted(state);
    case 'sectionDone':
      return { ...state, sectionsDone: state.sectionsStarted };
    case 'answering':
      return answering(state, now);
    case 'answered':
      return staged(state, 'answering', 'answered');
    case 'asked':
      return staged(state, 'answered', 'asking');
    case 'decided':
      return decided(state, action.decision);
    case 'shared':
      return staged(state, 'sharing', 'shared');
    case 'lit':
      return { ...state, demoLitSource: action.source };
    case 'sectionToggled':
      return sectionToggled(state, action.id);
    case 'sheet':
      return { ...state, isSheetOpen: action.isOpen };
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: ResearchState, action: ResearchAction) {
  return applyAt(state, action, Date.now());
}

function hasAsked(state: ResearchState) {
  return state.question !== null;
}

function hasDecided(state: ResearchState) {
  return hasReached(state.stage, 'sharing');
}

export const WORD_MS = 55;

export const ANSWER_WORD_MS = 45;

/** A stream is given a little longer than its words need, so its last word lands before the next step. */
const STREAM_MARGIN_MS = 200;

const KEY_MS = 40;

const DEMO_DECIDES_AFTER_MS = 2500;

export const SHARE_MS = 900;

function sectionMsOf(index: number) {
  const streamMs = SECTION_WORDS[index] * WORD_MS;
  return streamMs + STREAM_MARGIN_MS;
}

const ANSWER_STREAM_MS = ANSWER_TOKENS.length * ANSWER_WORD_MS;

const ANSWER_MS = ANSWER_STREAM_MS + STREAM_MARGIN_MS;

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', text: typed },
  }));
}

function frame(after: number, actions: ResearchAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function started(id: StepId): ResearchAction {
  return { type: 'stepStarted', id };
}

function done(id: StepId): ResearchAction {
  return { type: 'stepDone', id };
}

function lit(after: number, source: number | null): Step {
  return { after, by: 'demo', action: { type: 'lit', source } };
}

const SECTION_STARTED: ResearchAction = { type: 'sectionStarted' };

const SECTION_DONE: ResearchAction = { type: 'sectionDone' };

/** Each source is read while the section drawn from the one before it is written. */
const OPENING: Step[] = [
  ...typingSteps(QUESTION, 1000),
  {
    after: 500,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasAsked,
  },
  frame(500, [started('plan')]),
  frame(1000, [done('plan'), started('search')]),
  frame(1100, [done('search'), started('notes')]),
  frame(1300, [done('notes'), SECTION_STARTED, started('cohort')]),
  { after: 300, by: 'demo', action: { type: 'sheet', isOpen: true } },
  frame(sectionMsOf(0), [SECTION_DONE]),
  frame(250, [done('cohort'), SECTION_STARTED, started('issue')]),
  frame(sectionMsOf(1), [SECTION_DONE]),
  frame(250, [done('issue'), SECTION_STARTED, started('check')]),
  frame(sectionMsOf(2), [SECTION_DONE]),
  frame(200, [done('check'), SECTION_STARTED]),
  frame(sectionMsOf(3), [SECTION_DONE]),
  { after: 1000, by: 'demo', action: { type: 'sheet', isOpen: false } },
  frame(500, [{ type: 'answering' }]),
  frame(ANSWER_MS, [{ type: 'answered' }]),
  lit(800, 1),
  lit(600, 2),
  lit(600, 3),
  lit(500, null),
  frame(600, [{ type: 'asked' }]),
];

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  { after: SHARE_MS, action: { type: 'shared' } },
  {
    after: 1500,
    by: 'demo',
    press: `section-${FOLDED_BY_DEMO}`,
    action: { type: 'sectionToggled', id: FOLDED_BY_DEMO },
  },
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const ASKED = restingOf(INITIAL, OPENING, applyAt);

/** Under reduced motion the research is over and the request to share waits, with its buttons to read. */
export const RESTING: ResearchState = {
  ...ASKED,
  isSheetOpen: false,
  demoLitSource: null,
};

export const LOOP_AFTER_MS = 3200;
