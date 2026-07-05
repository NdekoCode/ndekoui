import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { TASKS, type AgentId, type LaneId, type TaskSeed } from './data';

export type Task = {
  id: string;
  agentId: AgentId;
  title: string;
  lane: LaneId;
  costUsd: number;
  startedAt: number;
  endedAt?: number;
  request: string;
  /** What a person asked for when they sent the task back. */
  note?: string;
  wasApproved: boolean;
  /** Counts the drops: a dropped card lands where it was let go, it does not travel from its lane. */
  drops: number;
};

export type LastMove = {
  title: string;
  lane: LaneId;
};

export type BoardState = {
  /** In the order of the lanes: a task that changes lane goes to the end of its new one. */
  tasks: Task[];
  lastMove: LastMove | null;
};

export type BoardAction =
  | { type: 'submitted'; id: string; usd: number }
  | { type: 'spent'; id: string; usd: number }
  | { type: 'approved'; id: string }
  | { type: 'sentBack'; id: string; note: string }
  | { type: 'moved'; id: string; to: LaneId }
  | { type: 'dropped'; id: string; to: LaneId };

type Step = SessionStep<BoardState, BoardAction>;

const MINUTE_MS = 60_000;

const LOADED_AT = Date.now();

function since(minutes: number) {
  return LOADED_AT - minutes * MINUTE_MS;
}

function endedAtOf(seed: TaskSeed) {
  if (seed.endedAgo === undefined) {
    return undefined;
  }
  return since(seed.endedAgo);
}

function taskOf(seed: TaskSeed): Task {
  return {
    id: seed.id,
    agentId: seed.agentId,
    title: seed.title,
    lane: seed.lane,
    costUsd: seed.costUsd,
    startedAt: since(seed.startedAgo),
    endedAt: endedAtOf(seed),
    request: seed.request,
    wasApproved: seed.lane === 'done',
    drops: 0,
  };
}

export const INITIAL: BoardState = {
  tasks: TASKS.map(taskOf),
  lastMove: null,
};

export function tasksIn(state: BoardState, lane: LaneId) {
  return state.tasks.filter((task) => task.lane === lane);
}

/** Where every task sits. Cards only measure themselves again when it changes. */
export function placementOf(state: BoardState) {
  const places = state.tasks.map((task) => `${task.id}:${task.lane}`);
  return places.join(' ');
}

function taskById(state: BoardState, id: string) {
  return state.tasks.find((task) => task.id === id);
}

/** Work stops the clock when a task leaves Running and starts it again when it comes back. */
function timedFor(task: Task, lane: LaneId, now: number): Task {
  if (lane === 'running') {
    return { ...task, lane, endedAt: undefined };
  }
  return { ...task, lane, endedAt: task.endedAt ?? now };
}

function relocated(
  state: BoardState,
  id: string,
  change: (task: Task) => Task
): BoardState {
  const task = taskById(state, id);
  if (!task) {
    return state;
  }
  const next = change(task);
  const others = state.tasks.filter((candidate) => candidate.id !== id);
  const lastMove = { title: next.title, lane: next.lane };
  return { tasks: [...others, next], lastMove };
}

function submitted(
  state: BoardState,
  id: string,
  usd: number,
  now: number
): BoardState {
  const task = taskById(state, id);
  if (task?.lane !== 'running') {
    return state;
  }
  return relocated(state, id, (current) => ({
    ...timedFor(current, 'review', now),
    costUsd: current.costUsd + usd,
  }));
}

function spent(state: BoardState, id: string, usd: number): BoardState {
  const tasks = state.tasks.map((task) => {
    const isWorking = task.id === id && task.lane === 'running';
    if (isWorking) {
      return { ...task, costUsd: task.costUsd + usd };
    }
    return task;
  });
  return { ...state, tasks };
}

function approved(state: BoardState, id: string, now: number): BoardState {
  const task = taskById(state, id);
  if (task?.lane !== 'review') {
    return state;
  }
  return relocated(state, id, (current) => ({
    ...timedFor(current, 'done', now),
    wasApproved: true,
    note: undefined,
  }));
}

function sentBack(
  state: BoardState,
  id: string,
  note: string,
  now: number
): BoardState {
  const task = taskById(state, id);
  if (task?.lane !== 'review') {
    return state;
  }
  return relocated(state, id, (current) => ({
    ...timedFor(current, 'running', now),
    note,
  }));
}

function moved(
  state: BoardState,
  id: string,
  to: LaneId,
  now: number,
  isDrop: boolean
): BoardState {
  const task = taskById(state, id);
  const isSameLane = task?.lane === to;
  if (!task || isSameLane) {
    return state;
  }
  let drops = task.drops;
  if (isDrop) {
    drops += 1;
  }
  return relocated(state, id, (current) => ({
    ...timedFor(current, to, now),
    wasApproved: to === 'done',
    drops,
  }));
}

export function applyAt(
  state: BoardState,
  action: BoardAction,
  now: number
): BoardState {
  switch (action.type) {
    case 'submitted':
      return submitted(state, action.id, action.usd, now);
    case 'spent':
      return spent(state, action.id, action.usd);
    case 'approved':
      return approved(state, action.id, now);
    case 'sentBack':
      return sentBack(state, action.id, action.note, now);
    case 'moved':
      return moved(state, action.id, action.to, now, false);
    case 'dropped':
      return moved(state, action.id, action.to, now, true);
  }
}

export function reducer(state: BoardState, action: BoardAction) {
  return applyAt(state, action, Date.now());
}

function hasLeftReview(id: string) {
  return (state: BoardState) => taskById(state, id)?.lane !== 'review';
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

/** How long an agent takes to rework a task a person sent back. */
export const REWORK_MS = 4200;

export const REWORK_USD = 0.038;

const FIRST_SUBMIT: Step = {
  after: 1500,
  action: { type: 'submitted', id: 'returns-page', usd: 0.026 },
};

export const SCRIPT: Step[] = [
  FIRST_SUBMIT,
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve-contract',
    action: { type: 'approved', id: 'contract' },
    isAnswered: hasLeftReview('contract'),
  },
  { after: 1500, action: { type: 'spent', id: 'tax-rounding', usd: 0.041 } },
  { after: 1300, action: { type: 'submitted', id: 'couriers', usd: 0.033 } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve-returns-page',
    action: { type: 'approved', id: 'returns-page' },
    isAnswered: hasLeftReview('returns-page'),
  },
  {
    after: 1700,
    action: { type: 'submitted', id: 'tax-rounding', usd: 0.052 },
  },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve-couriers',
    action: { type: 'approved', id: 'couriers' },
    isAnswered: hasLeftReview('couriers'),
  },
];

/** Under reduced motion two tasks wait in Needs review, with their buttons to read. */
export const RESTING = applyAt(INITIAL, FIRST_SUBMIT.action, LOADED_AT);

export const LOOP_AFTER_MS = 3800;
