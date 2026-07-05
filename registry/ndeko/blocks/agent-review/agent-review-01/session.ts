import type { CallStatus } from '@/registry/ndeko/lib/agent-run';

import type { CheckId } from './data';
import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type IssueStatus = 'planned' | 'progress' | 'review' | 'merged';

export type PlanStatus = 'pending' | 'approved' | 'changes';

export type MergeStatus = 'idle' | 'busy' | 'done';

export type Check = {
  status: CallStatus;
  attempt: number;
  startedAt?: number;
  endedAt?: number;
};

export type TaskState = {
  status: IssueStatus;
  events: string[];
  plan: PlanStatus;
  checks: Record<CheckId, Check> | null;
  merge: MergeStatus;
  isBranchDeleted: boolean;
};

export type PlanDecision = 'approved' | 'changes';

export type TaskAction =
  | { type: 'event'; id: string }
  | { type: 'status'; status: IssueStatus }
  | { type: 'planDecided'; decision: PlanDecision }
  | { type: 'checksStarted' }
  | { type: 'check'; id: CheckId; status: CallStatus }
  | { type: 'rerun'; id: CheckId }
  | { type: 'merge' }
  | { type: 'merged' }
  | { type: 'branch'; isDeleted: boolean }
  | { type: 'work'; actions: TaskAction[] };

type Step = SessionStep<TaskState, TaskAction>;

export const INITIAL: TaskState = {
  status: 'planned',
  events: [],
  plan: 'pending',
  checks: null,
  merge: 'idle',
  isBranchDeleted: false,
};

export function allChecksPassed(checks: Record<CheckId, Check> | null) {
  if (!checks) {
    return false;
  }
  const all = Object.values(checks);
  return all.every((check) => check.status === 'done');
}

export function passedCountOf(checks: Record<CheckId, Check> | null) {
  if (!checks) {
    return 0;
  }
  const all = Object.values(checks);
  const passed = all.filter((check) => check.status === 'done');
  return passed.length;
}

function planDecided(state: TaskState, decision: PlanDecision): TaskState {
  if (state.plan !== 'pending') {
    return state;
  }
  if (decision === 'changes') {
    return { ...state, plan: 'changes', events: [...state.events, 'changes'] };
  }
  return {
    ...state,
    plan: 'approved',
    status: 'progress',
    events: [...state.events, 'approved'],
  };
}

function runningCheck(now: number, attempt: number): Check {
  return { status: 'running', attempt, startedAt: now };
}

function checkUpdated(
  state: TaskState,
  id: CheckId,
  status: CallStatus,
  now: number
): TaskState {
  if (!state.checks) {
    return state;
  }
  const check: Check = { ...state.checks[id], status, endedAt: now };
  return { ...state, checks: { ...state.checks, [id]: check } };
}

function rerun(state: TaskState, id: CheckId, now: number): TaskState {
  if (!state.checks) {
    return state;
  }
  const attempt = state.checks[id].attempt + 1;
  const check = runningCheck(now, attempt);
  return { ...state, checks: { ...state.checks, [id]: check } };
}

function merge(state: TaskState): TaskState {
  const canMerge = allChecksPassed(state.checks) && state.merge === 'idle';
  if (!canMerge) {
    return state;
  }
  return { ...state, merge: 'busy' };
}

function merged(state: TaskState): TaskState {
  if (state.merge !== 'busy') {
    return state;
  }
  return {
    ...state,
    merge: 'done',
    status: 'merged',
    events: [...state.events, 'merged'],
  };
}

function branchChanged(state: TaskState, isDeleted: boolean): TaskState {
  if (isDeleted) {
    return { ...state, isBranchDeleted: true };
  }
  const events = [...state.events, 'restored'];
  return { ...state, isBranchDeleted: false, events };
}

/** The agent only works once a person has approved its plan. */
function work(state: TaskState, actions: TaskAction[], now: number) {
  if (state.plan !== 'approved') {
    return state;
  }
  let next = state;
  for (const inner of actions) {
    next = applyAt(next, inner, now);
  }
  return next;
}

export function applyAt(
  state: TaskState,
  action: TaskAction,
  now: number
): TaskState {
  switch (action.type) {
    case 'event':
      return { ...state, events: [...state.events, action.id] };
    case 'status':
      return { ...state, status: action.status };
    case 'planDecided':
      return planDecided(state, action.decision);
    case 'checksStarted':
      return {
        ...state,
        checks: {
          lint: runningCheck(now, 1),
          build: runningCheck(now, 1),
          tests: runningCheck(now, 1),
        },
      };
    case 'check':
      return checkUpdated(state, action.id, action.status, now);
    case 'rerun':
      return rerun(state, action.id, now);
    case 'merge':
      return merge(state);
    case 'merged':
      return merged(state);
    case 'branch':
      return branchChanged(state, action.isDeleted);
    case 'work':
      return work(state, action.actions, now);
  }
}

export function reducer(state: TaskState, action: TaskAction) {
  return applyAt(state, action, Date.now());
}

function workStep(after: number, actions: TaskAction[]): Step {
  return { after, action: { type: 'work', actions } };
}

function hasDecidedPlan(state: TaskState) {
  return state.plan !== 'pending';
}

function hasPressedMerge(state: TaskState) {
  return state.merge !== 'idle';
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  { after: 1100, action: { type: 'event', id: 'plan' } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve',
    action: { type: 'planDecided', decision: 'approved' },
    isAnswered: hasDecidedPlan,
  },
  workStep(1500, [{ type: 'event', id: 'commit1' }]),
  workStep(1300, [{ type: 'event', id: 'commit2' }]),
  workStep(1200, [
    { type: 'event', id: 'pr' },
    { type: 'status', status: 'review' },
    { type: 'checksStarted' },
  ]),
  workStep(1200, [{ type: 'check', id: 'lint', status: 'done' }]),
  workStep(700, [{ type: 'check', id: 'build', status: 'done' }]),
  workStep(700, [
    { type: 'check', id: 'tests', status: 'failed' },
    { type: 'event', id: 'failed' },
  ]),
  workStep(1700, [
    { type: 'event', id: 'commit3' },
    { type: 'rerun', id: 'tests' },
  ]),
  workStep(1900, [{ type: 'check', id: 'tests', status: 'done' }]),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'merge',
    action: { type: 'merge' },
    isAnswered: hasPressedMerge,
  },
  { after: 1100, action: { type: 'merged' } },
  workStep(800, [
    { type: 'event', id: 'branch' },
    { type: 'branch', isDeleted: true },
  ]),
];

function restingOf() {
  let state = INITIAL;
  let now = 1000;
  for (const step of SCRIPT) {
    now += step.after;
    state = applyAt(state, step.action, now);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3800;
