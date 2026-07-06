import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  ANSWER,
  FAILING_RUN,
  FILES,
  HUNKS,
  PASSING_RUN,
  stepOf,
  TASK,
  type PanelTab,
  type StepId,
} from './data';
import { wordsOf } from './words';

export type Stage =
  | 'idle'
  | 'working'
  | 'answering'
  | 'asking'
  | 'opening'
  | 'opened'
  | 'declined';

/** `failing` and `passing` are the two runs while their output still streams. */
export type TestRun = 'none' | 'failing' | 'failed' | 'passing' | 'passed';

export type PageVersion = 'before' | 'after';

export type Decision = 'approved' | 'denied';

export type StepRun = {
  id: StepId;
  status: 'running' | 'done';
  startedAt: number;
  endedAt?: number;
};

export type CodingState = {
  draft: string;
  task: string | null;
  followUps: string[];
  stage: Stage;
  steps: StepRun[];
  filesRead: number;
  hunksStarted: number;
  hunksDone: number;
  testRun: TestRun;
  preview: PageVersion;
  tab: PanelTab;
  isFollowingAgent: boolean;
  tokens: number;
  costUsd: number;
  isSheetOpen: boolean;
};

export type CodingAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'stepStarted'; id: StepId }
  | { type: 'stepDone'; id: StepId }
  | { type: 'fileRead' }
  | { type: 'hunkStarted' }
  | { type: 'hunkDone' }
  | { type: 'testRun'; run: TestRun }
  | { type: 'previewed'; view: PageVersion }
  | { type: 'focused'; tab: PanelTab }
  | { type: 'tabPicked'; tab: PanelTab }
  | { type: 'answering' }
  | { type: 'asked' }
  | { type: 'decided'; decision: Decision }
  | { type: 'opened' }
  | { type: 'sheet'; isOpen: boolean }
  | { type: 'batch'; actions: CodingAction[] };

type Step = SessionStep<CodingState, CodingAction>;

export const INITIAL: CodingState = {
  draft: '',
  task: null,
  followUps: [],
  stage: 'idle',
  steps: [],
  filesRead: 0,
  hunksStarted: 0,
  hunksDone: 0,
  testRun: 'none',
  preview: 'before',
  tab: 'diff',
  isFollowingAgent: true,
  tokens: 0,
  costUsd: 0,
  isSheetOpen: false,
};

const STAGE_ORDER: Stage[] = [
  'idle',
  'working',
  'answering',
  'asking',
  'opening',
  'opened',
  'declined',
];

export function hasReached(stage: Stage, target: Stage) {
  const position = STAGE_ORDER.indexOf(stage);
  const targetPosition = STAGE_ORDER.indexOf(target);
  return position >= targetPosition;
}

export function isOver(stage: Stage) {
  return stage === 'opened' || stage === 'declined';
}

/** A person who takes over while the task is being typed sends the whole task, not the half that was typed. */
function taskOf(draft: string) {
  const trimmed = draft.trim();
  const isUnfinishedDemo = TASK.startsWith(trimmed);
  if (isUnfinishedDemo) {
    return TASK;
  }
  return trimmed;
}

/** What Send would post now: the task, then follow-ups once the run is over. Null while the agent works. */
export function sendableTextOf(state: CodingState) {
  if (state.task === null) {
    return taskOf(state.draft);
  }
  const text = state.draft.trim();
  const canFollowUp = isOver(state.stage) && text !== '';
  if (canFollowUp) {
    return text;
  }
  return null;
}

function sent(state: CodingState): CodingState {
  const text = sendableTextOf(state);
  if (text === null) {
    return state;
  }
  if (state.task === null) {
    return { ...state, draft: '', task: text, stage: 'working' };
  }
  return { ...state, draft: '', followUps: [...state.followUps, text] };
}

function stepStarted(state: CodingState, id: StepId, now: number): CodingState {
  const isKnown = state.steps.some((run) => run.id === id);
  if (isKnown) {
    return state;
  }
  const run: StepRun = { id, status: 'running', startedAt: now };
  return { ...state, steps: [...state.steps, run] };
}

function isRunningStep(run: StepRun, id: StepId) {
  return run.id === id && run.status === 'running';
}

function stepDone(state: CodingState, id: StepId, now: number): CodingState {
  const wasRunning = state.steps.some((run) => isRunningStep(run, id));
  if (!wasRunning) {
    return state;
  }
  const steps = state.steps.map((run) => {
    if (run.id !== id) {
      return run;
    }
    const ended: StepRun = { ...run, status: 'done', endedAt: now };
    return ended;
  });
  const step = stepOf(id);
  const tokens = state.tokens + step.tokens;
  const costUsd = state.costUsd + step.usd;
  return { ...state, steps, tokens, costUsd };
}

function fileRead(state: CodingState): CodingState {
  const read = state.filesRead + 1;
  const filesRead = Math.min(FILES.length, read);
  return { ...state, filesRead };
}

function hunkStarted(state: CodingState): CodingState {
  const isWriting = state.hunksStarted > state.hunksDone;
  const isComplete = state.hunksStarted >= HUNKS.length;
  if (isWriting || isComplete) {
    return state;
  }
  const hunksStarted = state.hunksStarted + 1;
  return { ...state, hunksStarted };
}

/** The page after the fix exists once the tests pass, never before. */
function previewed(state: CodingState, view: PageVersion): CodingState {
  const isTooEarly = view === 'after' && state.testRun !== 'passed';
  if (isTooEarly) {
    return state;
  }
  return { ...state, preview: view };
}

/** The panel follows the agent from tab to tab until a person picks one themselves. */
function focused(state: CodingState, tab: PanelTab): CodingState {
  if (!state.isFollowingAgent) {
    return state;
  }
  return { ...state, tab };
}

function staged(state: CodingState, from: Stage, to: Stage): CodingState {
  if (state.stage !== from) {
    return state;
  }
  return { ...state, stage: to };
}

function decided(state: CodingState, decision: Decision): CodingState {
  if (decision === 'approved') {
    return staged(state, 'asking', 'opening');
  }
  return staged(state, 'asking', 'declined');
}

export function applyAt(
  state: CodingState,
  action: CodingAction,
  now: number
): CodingState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state);
    case 'stepStarted':
      return stepStarted(state, action.id, now);
    case 'stepDone':
      return stepDone(state, action.id, now);
    case 'fileRead':
      return fileRead(state);
    case 'hunkStarted':
      return hunkStarted(state);
    case 'hunkDone':
      return { ...state, hunksDone: state.hunksStarted };
    case 'testRun':
      return { ...state, testRun: action.run };
    case 'previewed':
      return previewed(state, action.view);
    case 'focused':
      return focused(state, action.tab);
    case 'tabPicked':
      return { ...state, tab: action.tab, isFollowingAgent: false };
    case 'answering':
      return staged(state, 'working', 'answering');
    case 'asked':
      return staged(state, 'answering', 'asking');
    case 'decided':
      return decided(state, action.decision);
    case 'opened':
      return staged(state, 'opening', 'opened');
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

export function reducer(state: CodingState, action: CodingAction) {
  return applyAt(state, action, Date.now());
}

function hasTask(state: CodingState) {
  return state.task !== null;
}

function hasDecided(state: CodingState) {
  return hasReached(state.stage, 'opening');
}

export const LINE_MS = 90;

export const LOG_MS = 110;

export const ANSWER_WORD_MS = 45;

/** A stream is given a little longer than its lines need, so its last line lands before the next step. */
const STREAM_MARGIN_MS = 200;

const KEY_MS = 34;

const DEMO_DECIDES_AFTER_MS = 2500;

export const OPEN_MS = 1000;

function hunkMsOf(index: number) {
  const lineCount = HUNKS[index].lines.length;
  const streamMs = lineCount * LINE_MS;
  return streamMs + STREAM_MARGIN_MS;
}

function runMsOf(lineCount: number) {
  const streamMs = lineCount * LOG_MS;
  return streamMs + STREAM_MARGIN_MS;
}

const FAILING_MS = runMsOf(FAILING_RUN.length);

const PASSING_MS = runMsOf(PASSING_RUN.length);

const ANSWER_WORDS = wordsOf(ANSWER);

const ANSWER_STREAM_MS = ANSWER_WORDS.length * ANSWER_WORD_MS;

const ANSWER_MS = ANSWER_STREAM_MS + STREAM_MARGIN_MS;

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', text: typed },
  }));
}

function frame(after: number, actions: CodingAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function started(id: StepId): CodingAction {
  return { type: 'stepStarted', id };
}

function done(id: StepId): CodingAction {
  return { type: 'stepDone', id };
}

function focus(tab: PanelTab): CodingAction {
  return { type: 'focused', tab };
}

function run(result: TestRun): CodingAction {
  return { type: 'testRun', run: result };
}

const FILE: CodingAction = { type: 'fileRead' };

const HUNK_STARTED: CodingAction = { type: 'hunkStarted' };

const HUNK_DONE: CodingAction = { type: 'hunkDone' };

/** The test is written and seen to fail before a line of the fix: that is what a reviewer wants to see first. */
const OPENING: Step[] = [
  ...typingSteps(TASK, 1000),
  {
    after: 500,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasTask,
  },
  frame(500, [started('read')]),
  frame(450, [FILE]),
  frame(400, [FILE]),
  frame(400, [FILE]),
  frame(400, [FILE]),
  frame(600, [done('read'), started('reproduce'), focus('diff'), HUNK_STARTED]),
  { after: 300, by: 'demo', action: { type: 'sheet', isOpen: true } },
  frame(hunkMsOf(0), [HUNK_DONE]),
  frame(400, [focus('tests'), run('failing')]),
  frame(FAILING_MS, [run('failed'), done('reproduce'), started('edit')]),
  frame(1100, [focus('diff'), HUNK_STARTED]),
  frame(hunkMsOf(1), [HUNK_DONE, HUNK_STARTED]),
  frame(hunkMsOf(2), [HUNK_DONE, done('edit'), started('verify')]),
  frame(800, [focus('tests'), run('passing')]),
  frame(PASSING_MS, [run('passed'), done('verify'), started('preview')]),
  frame(1600, [focus('preview')]),
  frame(1100, [{ type: 'previewed', view: 'after' }]),
  frame(1300, [done('preview')]),
  { after: 600, by: 'demo', action: { type: 'sheet', isOpen: false } },
  frame(400, [{ type: 'answering' }]),
  frame(ANSWER_MS, [{ type: 'asked' }]),
];

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  { after: OPEN_MS, action: { type: 'opened' } },
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const ASKED = restingOf(INITIAL, OPENING, applyAt);

/** Under reduced motion the work is done, the tests show green and the pull request waits for an answer. */
export const RESTING: CodingState = {
  ...ASKED,
  tab: 'tests',
  isSheetOpen: false,
};

export const LOOP_AFTER_MS = 3400;
