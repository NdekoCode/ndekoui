import type {
  CallStatus,
  PlanStep,
  StepStatus,
  ToolCall,
} from '@/registry/ndeko/lib/agent-run';

import { toolOf, type Tool, type ToolId, type ToolTask } from './data';

/**
 * A first run as a short film of five moments. A moment starts or ends a step of the plan or a
 * call to a tool; what is on screen is worked out from how many moments have passed and when.
 */
export type Run = {
  /** The tools the run works with: the first two that are connected. */
  tools: ToolId[];
  startedAt: number;
  /** How many moments the run has been through. */
  tick: number;
  /** When each moment happened. */
  stamps: number[];
};

export const RUN_TICKS = 5;

/** The wait before each moment, the first one included. */
export const TICK_DELAYS_MS = [700, 1100, 1500, 1400, 1600];

function sumOf(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

export const RUN_MS = sumOf(TICK_DELAYS_MS);

/** The moment something starts at and the moment it ends at. */
type Span = {
  from: number;
  to: number;
};

const PLAN_SPANS: Span[] = [
  { from: 1, to: 2 },
  { from: 2, to: 4 },
  { from: 4, to: 5 },
];

const CALL_SPANS: Span[] = [
  { from: 2, to: 3 },
  { from: 3, to: 4 },
];

export function newRun(tools: ToolId[], now: number): Run {
  return { tools, startedAt: now, tick: 0, stamps: [] };
}

export function isRunDone(run: Run) {
  return run.tick >= RUN_TICKS;
}

export function tickedRun(run: Run, now: number): Run {
  if (isRunDone(run)) {
    return run;
  }
  return { ...run, tick: run.tick + 1, stamps: [...run.stamps, now] };
}

function hasReached(run: Run, moment: number) {
  return run.tick >= moment;
}

function stepStatusOf(run: Run, span: Span): StepStatus {
  if (hasReached(run, span.to)) {
    return 'done';
  }
  if (hasReached(run, span.from)) {
    return 'running';
  }
  return 'upcoming';
}

function callStatusOf(run: Run, span: Span): CallStatus {
  if (hasReached(run, span.to)) {
    return 'done';
  }
  if (hasReached(run, span.from)) {
    return 'running';
  }
  return 'queued';
}

/** Moments are counted from one, their times are kept from zero. A moment not reached yet has no time. */
function timesOf(run: Run, span: Span) {
  return {
    startedAt: run.stamps[span.from - 1],
    endedAt: run.stamps[span.to - 1],
  };
}

export type RunTask = {
  tool: Tool;
  task: ToolTask;
};

/** Two things to do: one in each of two tools, or two in the same one when it is the only one. */
export function tasksOf(tools: ToolId[]): RunTask[] {
  const [firstId, secondId] = tools;
  if (firstId === undefined) {
    return [];
  }
  const first = toolOf(firstId);
  if (secondId === undefined) {
    return [
      { tool: first, task: first.tasks[0] },
      { tool: first, task: first.tasks[1] },
    ];
  }
  const second = toolOf(secondId);
  return [
    { tool: first, task: first.tasks[0] },
    { tool: second, task: second.tasks[0] },
  ];
}

/** Linear and GitHub, or Linear when both tasks are in it. */
export function toolNamesOf(tools: ToolId[]) {
  const names = tools.map((id) => toolOf(id).name);
  return names.join(' and ');
}

const PLAN_IDS = ['read', 'gather', 'write'];

function planTitlesOf(run: Run) {
  return [
    'Read the job',
    `Gather from ${toolNamesOf(run.tools)}`,
    'Write the summary',
  ];
}

export function planOf(run: Run): PlanStep[] {
  const titles = planTitlesOf(run);
  return PLAN_SPANS.map((span, index) => ({
    id: PLAN_IDS[index],
    title: titles[index],
    status: stepStatusOf(run, span),
    ...timesOf(run, span),
  }));
}

export function callsOf(run: Run): ToolCall[] {
  const tasks = tasksOf(run.tools);
  return tasks.map((entry, index) => {
    const span = CALL_SPANS[index];
    return {
      id: `call-${index}`,
      tool: entry.tool.id,
      label: entry.task.label,
      status: callStatusOf(run, span),
      output: entry.task.finding,
      ...timesOf(run, span),
    };
  });
}

/** What the agent hands back: where it looked, then what it found there. */
export function resultOf(run: Run) {
  const tasks = tasksOf(run.tools);
  const findings = tasks.map((entry) => `${entry.task.finding}.`);
  const sentences = [`Looked at ${toolNamesOf(run.tools)}.`, ...findings];
  return sentences.join(' ');
}

/** The run from its start to its last moment, for the clock that times it. */
export function runTimesOf(run: Run) {
  return {
    startedAt: run.startedAt,
    endedAt: run.stamps[RUN_TICKS - 1],
  };
}
