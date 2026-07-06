import { wordsOf } from '@/registry/ndeko/lib/words';

import { stepOf } from './flow';
import type { Step, Workflow } from './model';
import {
  FAILED_TRY_MS,
  resultOf,
  sampleOf,
  type Sample,
  type SampleId,
} from './samples';

export type RunPhase = 'idle' | 'running' | 'waiting' | 'done' | 'stopped';

export type StepStatus =
  'running' | 'failed' | 'retrying' | 'waiting' | 'done' | 'denied' | 'skipped';

export type Decision = 'approved' | 'denied';

export type StepRun = {
  status: StepStatus;
  ms: number;
  usd: number;
  /** One line the card shows in place of the kind: what a branch took, why a try failed. */
  note: string | null;
};

export type Beat = {
  kind: 'start' | 'finish' | 'retry';
  stepId: string;
};

export type Run = {
  /** Counts the runs, so what belongs to an earlier one can be told apart. */
  token: number;
  sampleId: SampleId;
  phase: RunPhase;
  /** Counts the beats played in this run: a timer that fires late cannot play one twice. */
  beat: number;
  next: Beat | null;
  steps: Partial<Record<string, StepRun>>;
  taken: string[];
  choices: Partial<Record<string, string>>;
  streamingId: string | null;
  decision: Decision | null;
  durationMs: number;
  costUsd: number;
};

export const WORD_MS = 45;

/** A stream is given a little longer than its words need, so its last word lands before the step ends. */
const STREAM_MARGIN_MS = 400;

const START_MS = 500;

/** The run waits this long between two steps: the time the dot takes along the edge. */
export const TRAVEL_MS = 380;

/** How long a failure stays on the card before the step tries again. */
const RETRY_AFTER_MS = 800;

/** The agent whose answer carries this name writes the email that goes back to the customer. */
const REPLY_NAME = 'reply';

export const IDLE_RUN: Run = {
  token: 0,
  sampleId: 'delivery',
  phase: 'idle',
  beat: 0,
  next: null,
  steps: {},
  taken: [],
  choices: {},
  streamingId: null,
  decision: null,
  durationMs: 0,
  costUsd: 0,
};

export function isBusy(run: Run) {
  return run.phase === 'running';
}

export function isOver(run: Run) {
  return run.phase === 'done' || run.phase === 'stopped';
}

export function hasRun(run: Run) {
  return run.phase !== 'idle';
}

export function startedRun(
  run: Run,
  workflow: Workflow,
  sampleId: SampleId
): Run {
  const token = run.token + 1;
  const fresh: Run = { ...IDLE_RUN, token, sampleId };
  const first = workflow.steps[0];
  if (!first) {
    return { ...fresh, phase: 'done' };
  }
  const next: Beat = { kind: 'start', stepId: first.id };
  return { ...fresh, phase: 'running', next };
}

/** The marks of the last run leave the canvas. The count of runs stays, so a late timer still misses. */
export function clearedRun(run: Run): Run {
  return { ...IDLE_RUN, token: run.token, sampleId: run.sampleId };
}

export function waitingIdOf(run: Run) {
  const entries = Object.entries(run.steps);
  const waiting = entries.find(([, stepRun]) => stepRun?.status === 'waiting');
  if (!waiting) {
    return null;
  }
  return waiting[0];
}

function isLive(stepRun: StepRun | undefined) {
  const status = stepRun?.status;
  const isAtWork = status === 'running' || status === 'retrying';
  return isAtWork || status === 'waiting';
}

export function liveIdOf(run: Run) {
  const entries = Object.entries(run.steps);
  const live = entries.find(([, stepRun]) => isLive(stepRun));
  if (!live) {
    return null;
  }
  return live[0];
}

/** A failed try is followed by another one: a run that stops in between leaves the step unfinished too. */
function isUnfinished(stepRun: StepRun | undefined) {
  const hasFailedTry = stepRun?.status === 'failed';
  return isLive(stepRun) || hasFailedTry;
}

/**
 * A run that stops keeps what its steps did and drops what they were still doing: nothing would ever
 * end it, and an Undo that brings the step back would show it at work or waiting for good.
 */
export function stoppedRun(run: Run): Run {
  const steps: Partial<Record<string, StepRun>> = {};
  for (const [id, stepRun] of Object.entries(run.steps)) {
    if (!isUnfinished(stepRun)) {
      steps[id] = stepRun;
    }
  }
  return { ...run, steps, phase: 'stopped', next: null, streamingId: null };
}

/** A run that waits on a step that is gone has nothing left to wait for. */
export function reconciledRun(run: Run, workflow: Workflow): Run {
  if (run.phase !== 'waiting') {
    return run;
  }
  const waitingId = waitingIdOf(run);
  const step = stepOf(workflow, waitingId);
  if (step) {
    return run;
  }
  return stoppedRun(run);
}

/** Only an agent writes prose. The others give a result with named parts. */
function textOf(step: Step, sample: Sample, decision: Decision | null) {
  if (step.kind !== 'agent') {
    return null;
  }
  if (step.agent.outputName !== REPLY_NAME) {
    const result = resultOf(sample, step);
    return result.text ?? null;
  }
  if (decision === 'denied') {
    return sample.replyIfDenied;
  }
  return sample.reply;
}

function streamMsOf(text: string) {
  const words = wordsOf(text);
  return words.length * WORD_MS + STREAM_MARGIN_MS;
}

/** A step that streams runs for as long as its text takes to arrive. */
export function tryMsOf(step: Step, sample: Sample, decision: Decision | null) {
  const result = resultOf(sample, step);
  const text = textOf(step, sample, decision);
  const isStreamed = step.kind === 'agent' && step.agent.streams;
  const followsText = isStreamed || result.ms === 0;
  if (text !== null && followsText) {
    return streamMsOf(text);
  }
  return result.ms;
}

export function failsNow(run: Run, step: Step, sample: Sample) {
  const isTheOne = sample.failure?.stepId === step.id;
  const isFirstTry = run.steps[step.id]?.status === 'running';
  return isTheOne && isFirstTry;
}

function startDelayOf(run: Run) {
  if (run.beat === 0) {
    return START_MS;
  }
  return TRAVEL_MS;
}

/** How long to wait before the next beat. Null while the run has nothing to play. */
export function delayOf(run: Run, workflow: Workflow) {
  const beat = run.next;
  if (run.phase !== 'running' || beat === null) {
    return null;
  }
  if (beat.kind === 'retry') {
    return RETRY_AFTER_MS;
  }
  if (beat.kind === 'start') {
    return startDelayOf(run);
  }
  const step = stepOf(workflow, beat.stepId);
  if (!step) {
    return 0;
  }
  const sample = sampleOf(run.sampleId);
  if (failsNow(run, step, sample)) {
    return FAILED_TRY_MS;
  }
  return tryMsOf(step, sample, run.decision);
}

export type StepExchange = {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  text: string | null;
};

/** An approval gives what the person decided, so its output is not in the recorded results. */
export function exchangeOf(run: Run, step: Step): StepExchange {
  const sample = sampleOf(run.sampleId);
  const result = resultOf(sample, step);
  const text = textOf(step, sample, run.decision);
  if (step.kind !== 'approval') {
    return { input: result.input, output: result.output, text };
  }
  const status = run.steps[step.id]?.status;
  if (status === 'done') {
    return { input: result.input, output: { decision: 'approved' }, text };
  }
  if (status === 'denied') {
    return { input: result.input, output: { decision: 'denied' }, text };
  }
  return { input: result.input, output: {}, text };
}
