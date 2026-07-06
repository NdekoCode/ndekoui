import { WORKFLOW } from './data';
import type {
  AgentSetup,
  ApprovalSetup,
  InsertAt,
  LoopRounds,
  WaitDuration,
  Workflow,
} from './model';
import {
  clearedRun,
  IDLE_RUN,
  isBusy,
  isOver,
  startedRun,
  type Decision,
  type Run,
} from './run';
import { advancedRun, decidedRun, type Outcome } from './run-beats';
import { sampleOf, type SampleId } from './samples';
import {
  stepAdded,
  stepDuplicated,
  stepRemoved,
  stepRenamed,
  workflowRenamed,
} from './session-edits';
import { redone, undone } from './session-history';
import {
  actionPicked,
  agentChanged,
  approvalChanged,
  fieldChanged,
  loopChanged,
  outputAdded,
  outputRemoved,
  outputRenamed,
  stepReset,
  waitChanged,
} from './session-setup';

export type InspectorTab = 'setup' | 'variables' | 'run';

/** One line in the tool bar about what just happened, with a way back when there is one. */
export type Notice = {
  token: number;
  text: string;
  canUndo: boolean;
  /** The step an Undo brings back, so it is selected again. */
  restoresId: string | null;
};

/** `at` is null for the save the sample data starts from: it reads "Saved 2 min ago" and never ticks. */
export type SaveState = {
  status: 'saved' | 'saving';
  at: number | null;
};

export type RunTotals = {
  durationMs: number;
  costUsd: number;
};

/** A moment of a run the script waits for: the reply starts to stream, or the run has nothing left to play. */
export type Cue = 'reply' | 'settled';

export type BuilderState = {
  workflow: Workflow;
  /** The flow as it was last saved: what Reset gives back, and what "unsaved" is measured against. */
  savedWorkflow: Workflow;
  /** The flow as it was when Save was pressed. A change made while it saves stays unsaved. */
  savingWorkflow: Workflow | null;
  save: SaveState;
  isLive: boolean;
  past: Workflow[];
  future: Workflow[];
  lastEditKey: string | null;
  selectedId: string | null;
  /** The step that was just added: it grows into place and its edges draw themselves. */
  arrivedId: string | null;
  tab: InspectorTab;
  /** The inspector goes to the step that streams, until a person picks a step or a tab themselves. */
  isFollowingRun: boolean;
  run: Run;
  lastRun: RunTotals | null;
  notice: Notice | null;
  noticeCount: number;
  spoken: string;
  cuesPassed: number;
  isPaletteOpen: boolean;
  isInspectorOpen: boolean;
};

export type BuilderAction =
  | { type: 'selected'; id: string | null }
  | { type: 'tabPicked'; tab: InspectorTab }
  | { type: 'paletteSheet'; isOpen: boolean }
  | { type: 'inspectorSheet'; isOpen: boolean }
  | {
      type: 'stepAdded';
      entryId: string;
      at: InsertAt;
      id: string;
      name?: string;
    }
  | { type: 'stepRemoved'; id: string }
  | { type: 'stepDuplicated'; id: string; copyId: string }
  | { type: 'stepRenamed'; id: string; name: string }
  | { type: 'workflowRenamed'; name: string }
  | { type: 'agentChanged'; id: string; patch: Partial<AgentSetup> }
  | { type: 'approvalChanged'; id: string; patch: Partial<ApprovalSetup> }
  | { type: 'actionPicked'; id: string; actionId: string }
  | { type: 'fieldChanged'; id: string; fieldId: string; value: string }
  | { type: 'waitChanged'; id: string; duration: WaitDuration }
  | { type: 'loopChanged'; id: string; rounds: LoopRounds }
  | { type: 'outputAdded'; id: string; outputId: string }
  | { type: 'outputRenamed'; id: string; outputId: string; label: string }
  | { type: 'outputRemoved'; id: string; outputId: string }
  | { type: 'stepReset'; id: string }
  | { type: 'undone' }
  | { type: 'redone' }
  | { type: 'noticeCleared'; token: number }
  | { type: 'saveStarted' }
  | { type: 'saved' }
  | { type: 'published'; isLive: boolean }
  | { type: 'runStarted'; sampleId: SampleId }
  | { type: 'runAdvanced'; token: number; beat: number }
  | { type: 'decided'; decision: Decision }
  | { type: 'runCleared' }
  | { type: 'cuePassed'; cue: Cue };

export const INITIAL: BuilderState = {
  workflow: WORKFLOW,
  savedWorkflow: WORKFLOW,
  savingWorkflow: null,
  save: { status: 'saved', at: null },
  isLive: false,
  past: [],
  future: [],
  lastEditKey: null,
  selectedId: null,
  arrivedId: null,
  tab: 'setup',
  isFollowingRun: false,
  run: IDLE_RUN,
  lastRun: null,
  notice: null,
  noticeCount: 0,
  spoken: '',
  cuesPassed: 0,
  isPaletteOpen: false,
  isInspectorOpen: false,
};

/** Read by content: a Reset, or an edit that puts back what was saved, leaves nothing to save. */
export function hasUnsavedChanges(state: BuilderState) {
  if (state.workflow === state.savedWorkflow) {
    return false;
  }
  const current = JSON.stringify(state.workflow);
  const saved = JSON.stringify(state.savedWorkflow);
  return current !== saved;
}

/** A pick breaks the run of edits that continue one another: typing again later is another step of the history. */
function selected(state: BuilderState, id: string | null): BuilderState {
  return { ...state, selectedId: id, isFollowingRun: false, lastEditKey: null };
}

function saveStarted(state: BuilderState): BuilderState {
  if (state.save.status === 'saving') {
    return state;
  }
  return {
    ...state,
    savingWorkflow: state.workflow,
    save: { status: 'saving', at: state.save.at },
  };
}

function saved(state: BuilderState, now: number): BuilderState {
  const sent = state.savingWorkflow;
  const isSaving = state.save.status === 'saving';
  if (!isSaving || sent === null) {
    return state;
  }
  return {
    ...state,
    savedWorkflow: sent,
    savingWorkflow: null,
    save: { status: 'saved', at: now },
    lastEditKey: null,
    spoken: 'Saved',
  };
}

const LIVE_LINE = 'Live. Every new email now runs through this workflow';

const DRAFT_LINE = 'Back to draft. New emails wait until you publish again';

function publishLineOf(isLive: boolean) {
  if (isLive) {
    return LIVE_LINE;
  }
  return DRAFT_LINE;
}

/** Going live or back to draft is confirmed in words, in the tool bar and to a screen reader. */
function published(state: BuilderState, isLive: boolean): BuilderState {
  if (isLive === state.isLive) {
    return state;
  }
  const noticeCount = state.noticeCount + 1;
  const text = publishLineOf(isLive);
  const notice: Notice = {
    token: noticeCount,
    text,
    canUndo: false,
    restoresId: null,
  };
  return { ...state, isLive, notice, noticeCount, spoken: text };
}

function noticeCleared(state: BuilderState, token: number): BuilderState {
  if (state.notice?.token !== token) {
    return state;
  }
  return { ...state, notice: null };
}

function totalsOf(run: Run): RunTotals {
  return { durationMs: run.durationMs, costUsd: run.costUsd };
}

function spokenAfter(before: string, spoken: string) {
  if (spoken === '') {
    return before;
  }
  return spoken;
}

/** What a beat of the run changes around it: the inspector follows a step that streams, and a finished run leaves its totals. */
function withOutcome(state: BuilderState, outcome: Outcome): BuilderState {
  const { run } = outcome;
  const isNewStream = run.streamingId !== state.run.streamingId;
  const startsStreaming = isNewStream && run.streamingId !== null;
  const followsStream = startsStreaming && state.isFollowingRun;
  const hasJustEnded = isOver(run) && !isOver(state.run);
  let next: BuilderState = {
    ...state,
    run,
    spoken: spokenAfter(state.spoken, outcome.spoken),
  };
  if (followsStream) {
    next = { ...next, selectedId: run.streamingId, tab: 'run' };
  }
  if (hasJustEnded) {
    next = { ...next, lastRun: totalsOf(run) };
  }
  return next;
}

function runStarted(state: BuilderState, sampleId: SampleId): BuilderState {
  if (isBusy(state.run)) {
    return state;
  }
  const sample = sampleOf(sampleId);
  const run = startedRun(state.run, state.workflow, sampleId);
  const spoken = `Test run started with the email from ${sample.from}`;
  return withOutcome({ ...state, isFollowingRun: true }, { run, spoken });
}

function runAdvanced(
  state: BuilderState,
  token: number,
  beat: number
): BuilderState {
  const isNextBeat = token === state.run.token && beat === state.run.beat;
  if (!isNextBeat) {
    return state;
  }
  const outcome = advancedRun(state.run, state.workflow);
  return withOutcome(state, outcome);
}

function decided(state: BuilderState, decision: Decision): BuilderState {
  const outcome = decidedRun(state.run, state.workflow, decision);
  return withOutcome(state, outcome);
}

function runCleared(state: BuilderState): BuilderState {
  if (isBusy(state.run)) {
    return state;
  }
  return { ...state, run: clearedRun(state.run) };
}

export function isCueOpen(state: BuilderState, cue: Cue) {
  if (!isBusy(state.run)) {
    return true;
  }
  if (cue === 'reply') {
    return state.run.streamingId !== null;
  }
  return false;
}

/** More beats than any run of the sample flow has: the walk to a cue always ends. */
const CUE_BEAT_LIMIT = 200;

/**
 * Live, the script waits for a cue and this only counts it. When the resting state is worked out
 * no clock plays the run, so the run is walked here up to the cue.
 */
function cuePassed(state: BuilderState, cue: Cue): BuilderState {
  let next = state;
  for (let beats = 0; beats < CUE_BEAT_LIMIT; beats += 1) {
    if (isCueOpen(next, cue)) {
      break;
    }
    next = runAdvanced(next, next.run.token, next.run.beat);
  }
  return { ...next, cuesPassed: state.cuesPassed + 1 };
}

export function applyAt(
  state: BuilderState,
  action: BuilderAction,
  now: number
): BuilderState {
  switch (action.type) {
    case 'selected':
      return selected(state, action.id);
    case 'tabPicked':
      return { ...state, tab: action.tab, isFollowingRun: false };
    case 'paletteSheet':
      return { ...state, isPaletteOpen: action.isOpen };
    case 'inspectorSheet':
      return { ...state, isInspectorOpen: action.isOpen };
    case 'stepAdded':
      return stepAdded(
        state,
        action.entryId,
        action.at,
        action.id,
        action.name
      );
    case 'stepRemoved':
      return stepRemoved(state, action.id);
    case 'stepDuplicated':
      return stepDuplicated(state, action.id, action.copyId);
    case 'stepRenamed':
      return stepRenamed(state, action.id, action.name);
    case 'workflowRenamed':
      return workflowRenamed(state, action.name);
    case 'agentChanged':
      return agentChanged(state, action.id, action.patch);
    case 'approvalChanged':
      return approvalChanged(state, action.id, action.patch);
    case 'actionPicked':
      return actionPicked(state, action.id, action.actionId);
    case 'fieldChanged':
      return fieldChanged(state, action.id, action.fieldId, action.value);
    case 'waitChanged':
      return waitChanged(state, action.id, action.duration);
    case 'loopChanged':
      return loopChanged(state, action.id, action.rounds);
    case 'outputAdded':
      return outputAdded(state, action.id, action.outputId);
    case 'outputRenamed':
      return outputRenamed(state, action.id, action.outputId, action.label);
    case 'outputRemoved':
      return outputRemoved(state, action.id, action.outputId);
    case 'stepReset':
      return stepReset(state, action.id);
    case 'undone':
      return undone(state);
    case 'redone':
      return redone(state);
    case 'noticeCleared':
      return noticeCleared(state, action.token);
    case 'saveStarted':
      return saveStarted(state);
    case 'saved':
      return saved(state, now);
    case 'published':
      return published(state, action.isLive);
    case 'runStarted':
      return runStarted(state, action.sampleId);
    case 'runAdvanced':
      return runAdvanced(state, action.token, action.beat);
    case 'decided':
      return decided(state, action.decision);
    case 'runCleared':
      return runCleared(state);
    case 'cuePassed':
      return cuePassed(state, action.cue);
  }
}

export function reducer(state: BuilderState, action: BuilderAction) {
  return applyAt(state, action, Date.now());
}
