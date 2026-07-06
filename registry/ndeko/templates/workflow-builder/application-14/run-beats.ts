import { formatDuration } from '@/registry/ndeko/lib/agent-run';

import {
  edgeIdOf,
  firstOf,
  joinAfter,
  outputNamed,
  restAfter,
  stepOf,
  successorOf,
  withInside,
} from './flow';
import type { BranchOutput, BranchStep, Step, Workflow } from './model';
import {
  failsNow,
  stoppedRun,
  tryMsOf,
  waitingIdOf,
  type Beat,
  type Decision,
  type Run,
  type StepRun,
} from './run';
import { FAILED_TRY_MS, resultOf, sampleOf, type Sample } from './samples';

export type Outcome = {
  run: Run;
  /** The one line a screen reader hears about the beat. Empty when there is nothing to say. */
  spoken: string;
};

function withStep(run: Run, id: string, stepRun: StepRun): Run {
  return { ...run, steps: { ...run.steps, [id]: stepRun } };
}

function withSkipped(run: Run, skipped: Step[]): Run {
  const steps = { ...run.steps };
  for (const step of skipped) {
    steps[step.id] = { status: 'skipped', ms: 0, usd: 0, note: null };
  }
  return { ...run, steps };
}

function stopped(run: Run): Outcome {
  const ended = stoppedRun(run);
  return { run: ended, spoken: 'The run stopped: its next step was removed' };
}

/** The run takes the edge out of a step, then goes on with what it leads to or ends there. */
function handedOver(
  run: Run,
  target: Step | null,
  edgeId: string,
  spoken: string
): Outcome {
  const taken = [...run.taken, edgeId];
  if (!target) {
    const total = formatDuration(run.durationMs);
    const ended: Run = { ...run, taken, phase: 'done', next: null };
    return { run: ended, spoken: `${spoken}. Run finished in ${total}` };
  }
  const next: Beat = { kind: 'start', stepId: target.id };
  return { run: { ...run, taken, next }, spoken };
}

function streamingIdOf(step: Step) {
  const isStreamed = step.kind === 'agent' && step.agent.streams;
  if (isStreamed) {
    return step.id;
  }
  return null;
}

function startedStep(run: Run, step: Step): Outcome {
  if (step.kind === 'approval') {
    const sample = sampleOf(run.sampleId);
    const asked = sample.request?.spoken ?? step.name;
    const waiting = withStep(run, step.id, {
      status: 'waiting',
      ms: 0,
      usd: 0,
      note: 'Waiting for you',
    });
    return {
      run: { ...waiting, phase: 'waiting', next: null },
      spoken: `Waiting for you: ${asked}`,
    };
  }
  const running = withStep(run, step.id, {
    status: 'running',
    ms: 0,
    usd: 0,
    note: null,
  });
  const next: Beat = { kind: 'finish', stepId: step.id };
  const streamingId = streamingIdOf(step);
  return { run: { ...running, next, streamingId }, spoken: '' };
}

function retriedStep(run: Run, step: Step): Outcome {
  const spentMs = run.steps[step.id]?.ms ?? 0;
  const retrying = withStep(run, step.id, {
    status: 'retrying',
    ms: spentMs,
    usd: 0,
    note: 'Trying again',
  });
  const next: Beat = { kind: 'finish', stepId: step.id };
  return { run: { ...retrying, next }, spoken: '' };
}

function failedStep(run: Run, step: Step, sample: Sample): Outcome {
  const error = sample.failure?.error ?? 'It did not answer';
  const failed = withStep(run, step.id, {
    status: 'failed',
    ms: FAILED_TRY_MS,
    usd: 0,
    note: error,
  });
  const next: Beat = { kind: 'retry', stepId: step.id };
  return {
    run: { ...failed, next },
    spoken: `${step.name} failed: ${error}. Trying again`,
  };
}

function doneNoteOf(step: Step, wasRetried: boolean) {
  if (wasRetried) {
    return 'Done on the second try';
  }
  if (step.kind === 'wait') {
    return 'A test run does not wait';
  }
  if (step.kind === 'loop') {
    return 'A test run plays it once';
  }
  return null;
}

function insideOfOutput(output: BranchOutput) {
  return output.steps.flatMap(withInside);
}

/** A branch takes the output that carries the topic of the sample, or its last one when none does. */
function routed(
  run: Run,
  workflow: Workflow,
  branch: BranchStep,
  sample: Sample
): Outcome {
  const named = outputNamed(branch, sample.topic);
  const output = named ?? branch.outputs.at(-1);
  if (!output) {
    return stopped(run);
  }
  const others = branch.outputs.filter((other) => other.id !== output.id);
  const leftOut = others.flatMap(insideOfOutput);
  const skipped = withSkipped(run, leftOut);
  const spentMs = skipped.steps[branch.id]?.ms ?? 0;
  const noted = withStep(skipped, branch.id, {
    status: 'done',
    ms: spentMs,
    usd: 0,
    note: `Took ${output.label}`,
  });
  const choices = { ...noted.choices, [branch.id]: output.id };
  const target = firstOf(workflow, branch, output);
  const edgeId = edgeIdOf(branch.id, output.id);
  const spoken = `${branch.name} took ${output.label}`;
  return handedOver({ ...noted, choices }, target, edgeId, spoken);
}

function finishedStep(run: Run, workflow: Workflow, step: Step): Outcome {
  const sample = sampleOf(run.sampleId);
  if (failsNow(run, step, sample)) {
    return failedStep(run, step, sample);
  }
  const before = run.steps[step.id];
  const wasRetried = before?.status === 'retrying';
  const spentMs = before?.ms ?? 0;
  const result = resultOf(sample, step);
  const tryMs = tryMsOf(step, sample, run.decision);
  const ms = spentMs + tryMs;
  const done = withStep(run, step.id, {
    status: 'done',
    ms,
    usd: result.usd,
    note: doneNoteOf(step, wasRetried),
  });
  const counted: Run = {
    ...done,
    streamingId: null,
    durationMs: run.durationMs + ms,
    costUsd: run.costUsd + result.usd,
  };
  if (step.kind === 'branch') {
    return routed(counted, workflow, step, sample);
  }
  const target = successorOf(workflow, step.id);
  const edgeId = edgeIdOf(step.id, null);
  const spoken = `${step.name} done in ${formatDuration(ms)}`;
  return handedOver(counted, target, edgeId, spoken);
}

export function advancedRun(run: Run, workflow: Workflow): Outcome {
  const beat = run.next;
  if (run.phase !== 'running' || beat === null) {
    return { run, spoken: '' };
  }
  const played: Run = { ...run, beat: run.beat + 1 };
  const step = stepOf(workflow, beat.stepId);
  if (!step) {
    return stopped(played);
  }
  if (beat.kind === 'start') {
    return startedStep(played, step);
  }
  if (beat.kind === 'retry') {
    return retriedStep(played, step);
  }
  return finishedStep(played, workflow, step);
}

/**
 * Allow lets the run go on. Deny stops its branch there: what was left of the branch is skipped and
 * the run goes on from the step where the branches join, or ends when the approval sat on the trunk.
 */
export function decidedRun(
  run: Run,
  workflow: Workflow,
  decision: Decision
): Outcome {
  if (run.phase !== 'waiting') {
    return { run, spoken: '' };
  }
  const waitingId = waitingIdOf(run);
  const step = stepOf(workflow, waitingId);
  if (!step) {
    return stopped(run);
  }
  const answered: Run = { ...run, phase: 'running', decision };
  if (decision === 'approved') {
    const allowed = withStep(answered, step.id, {
      status: 'done',
      ms: 0,
      usd: 0,
      note: 'Allowed by you',
    });
    const target = successorOf(workflow, step.id);
    const edgeId = edgeIdOf(step.id, null);
    return handedOver(allowed, target, edgeId, 'Allowed by you');
  }
  const denied = withStep(answered, step.id, {
    status: 'denied',
    ms: 0,
    usd: 0,
    note: 'Denied by you',
  });
  const leftOut = restAfter(workflow, step.id);
  const skipped = withSkipped(denied, leftOut);
  const target = joinAfter(workflow, step.id);
  if (!target) {
    const ended: Run = { ...skipped, phase: 'stopped', next: null };
    return { run: ended, spoken: 'Denied. The run stops here' };
  }
  const next: Beat = { kind: 'start', stepId: target.id };
  return {
    run: { ...skipped, next },
    spoken:
      'Denied. The branch stops here and the reply says a person will follow up',
  };
}
