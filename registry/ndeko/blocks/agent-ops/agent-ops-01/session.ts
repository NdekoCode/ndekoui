import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import type { AgentStatus } from '@/registry/ndeko/lib/agent-run';

import {
  agentOf,
  APPROVALS,
  MAIN_AGENTS,
  MODELS,
  PERIOD_BASE,
  type AgentId,
  type ApprovalId,
  type ModelId,
  type PeriodId,
} from './data';

export type Decision = 'approved' | 'denied';

export type AgentLive = {
  status: AgentStatus;
  task: string;
  costUsd: number;
  startedAt?: number;
  endedAt?: number;
  /** The trace a person leaves on the row after an approval is handled. */
  decision?: Decision;
};

export type OverviewState = {
  period: PeriodId;
  /** Requests that wait on a person, oldest first. */
  pending: ApprovalId[];
  agents: Record<AgentId, AgentLive>;
  /** The main agent whose sub-agents are unfolded. */
  openId: AgentId | null;
  finishedRuns: number;
  failedRuns: number;
  sessionSpendUsd: Record<ModelId, number>;
};

export type OverviewAction =
  | { type: 'period'; period: PeriodId }
  | { type: 'toggled'; id: AgentId }
  | { type: 'spent'; id: AgentId; usd: number }
  | { type: 'told'; id: AgentId; task: string }
  | { type: 'finished'; id: AgentId; task: string; usd: number }
  | { type: 'failed'; id: AgentId; task: string }
  | { type: 'asked'; approvalId: ApprovalId }
  | { type: 'decided'; approvalId: ApprovalId; decision: Decision }
  | { type: 'batch'; actions: OverviewAction[] };

type Step = SessionStep<OverviewState, OverviewAction>;

const MINUTE_MS = 60_000;

const LOADED_AT = Date.now();

function since(minutes: number) {
  return LOADED_AT - minutes * MINUTE_MS;
}

const NO_SESSION_SPEND: Record<ModelId, number> = {
  'claude-sonnet': 0,
  'claude-haiku': 0,
  'gpt-mini': 0,
  'gemini-pro': 0,
};

export const INITIAL: OverviewState = {
  period: 'today',
  pending: ['send-policy'],
  openId: null,
  finishedRuns: 0,
  failedRuns: 0,
  sessionSpendUsd: NO_SESSION_SPEND,
  agents: {
    planner: {
      status: 'done',
      task: 'Planned the autumn catalogue in 6 steps',
      costUsd: 0.884,
      startedAt: since(26),
      endedAt: since(3),
    },
    researcher: {
      status: 'running',
      task: 'Comparing courier prices for parcels under 2 kg',
      costUsd: 0.412,
      startedAt: since(12),
    },
    'rate-reader': {
      status: 'running',
      task: 'Reading 4 courier rate cards',
      costUsd: 0.061,
      startedAt: since(3),
    },
    writer: {
      status: 'running',
      task: 'Writing product notes for 14 new titles',
      costUsd: 0.188,
      startedAt: since(4),
    },
    reviewer: {
      status: 'waiting',
      task: APPROVALS['send-policy'].waitingTask,
      costUsd: 0.356,
      startedAt: since(7),
    },
    coder: {
      status: 'running',
      task: 'Fixing the checkout rounding error',
      costUsd: 1.204,
      startedAt: since(21),
    },
    'test-runner': {
      status: 'running',
      task: 'Running 41 checkout tests',
      costUsd: 0.092,
      startedAt: since(2),
    },
    'log-reader': {
      status: 'done',
      task: 'Found the rounding in the tax step',
      costUsd: 0.047,
      startedAt: since(15),
      endedAt: since(11),
    },
  },
};

function patched(
  state: OverviewState,
  id: AgentId,
  change: (agent: AgentLive) => AgentLive
): OverviewState {
  const agent = change(state.agents[id]);
  return { ...state, agents: { ...state.agents, [id]: agent } };
}

function charged(state: OverviewState, id: AgentId, usd: number) {
  const modelId = agentOf(id).model;
  const spentOnModel = state.sessionSpendUsd[modelId] + usd;
  const sessionSpendUsd = { ...state.sessionSpendUsd, [modelId]: spentOnModel };
  const withSpend = { ...state, sessionSpendUsd };
  return patched(withSpend, id, (agent) => ({
    ...agent,
    costUsd: agent.costUsd + usd,
  }));
}

function toggled(state: OverviewState, id: AgentId): OverviewState {
  if (state.openId === id) {
    return { ...state, openId: null };
  }
  return { ...state, openId: id };
}

function told(state: OverviewState, id: AgentId, task: string) {
  if (state.agents[id].status !== 'running') {
    return state;
  }
  return patched(state, id, (agent) => ({ ...agent, task }));
}

function finished(
  state: OverviewState,
  id: AgentId,
  task: string,
  usd: number,
  now: number
): OverviewState {
  if (state.agents[id].status !== 'running') {
    return state;
  }
  const charge = charged(state, id, usd);
  const done = patched(charge, id, (agent) => ({
    ...agent,
    status: 'done',
    task,
    endedAt: now,
  }));
  return { ...done, finishedRuns: done.finishedRuns + 1 };
}

function failed(
  state: OverviewState,
  id: AgentId,
  task: string,
  now: number
): OverviewState {
  if (state.agents[id].status !== 'running') {
    return state;
  }
  const stopped = patched(state, id, (agent) => ({
    ...agent,
    status: 'failed',
    task,
    endedAt: now,
  }));
  return { ...stopped, failedRuns: stopped.failedRuns + 1 };
}

function asked(state: OverviewState, approvalId: ApprovalId): OverviewState {
  const approval = APPROVALS[approvalId];
  const isRunning = state.agents[approval.agentId].status === 'running';
  const isAlreadyAsked = state.pending.includes(approvalId);
  if (!isRunning || isAlreadyAsked) {
    return state;
  }
  const waiting = patched(state, approval.agentId, (agent) => ({
    ...agent,
    status: 'waiting',
    task: approval.waitingTask,
  }));
  return { ...waiting, pending: [...waiting.pending, approvalId] };
}

function decided(
  state: OverviewState,
  approvalId: ApprovalId,
  decision: Decision,
  now: number
): OverviewState {
  if (!state.pending.includes(approvalId)) {
    return state;
  }
  const approval = APPROVALS[approvalId];
  const pending = state.pending.filter((id) => id !== approvalId);
  const handled = { ...state, pending };
  if (decision === 'approved') {
    return patched(handled, approval.agentId, (agent) => ({
      ...agent,
      status: 'running',
      task: approval.approvedTask,
      decision,
    }));
  }
  return patched(handled, approval.agentId, (agent) => ({
    ...agent,
    status: 'idle',
    task: approval.deniedTask,
    decision,
    endedAt: now,
  }));
}

export function applyAt(
  state: OverviewState,
  action: OverviewAction,
  now: number
): OverviewState {
  switch (action.type) {
    case 'period':
      return { ...state, period: action.period };
    case 'toggled':
      return toggled(state, action.id);
    case 'spent':
      return charged(state, action.id, action.usd);
    case 'told':
      return told(state, action.id, action.task);
    case 'finished':
      return finished(state, action.id, action.task, action.usd, now);
    case 'failed':
      return failed(state, action.id, action.task, now);
    case 'asked':
      return asked(state, action.approvalId);
    case 'decided':
      return decided(state, action.approvalId, action.decision, now);
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: OverviewState, action: OverviewAction) {
  return applyAt(state, action, Date.now());
}

export type Totals = {
  runs: number;
  waiting: number;
  failed: number;
  spendUsd: number;
};

export function spendOf(state: OverviewState, modelId: ModelId) {
  const base = PERIOD_BASE[state.period].spendUsd[modelId];
  return base + state.sessionSpendUsd[modelId];
}

export function totalSpendOf(state: OverviewState) {
  let total = 0;
  for (const model of MODELS) {
    total += spendOf(state, model.id);
  }
  return total;
}

export function totalsOf(state: OverviewState): Totals {
  const base = PERIOD_BASE[state.period];
  return {
    runs: base.runs + state.finishedRuns,
    waiting: state.pending.length,
    failed: base.failed + state.failedRuns,
    spendUsd: totalSpendOf(state),
  };
}

export function runningCountOf(state: OverviewState) {
  const running = MAIN_AGENTS.filter(
    (agent) => state.agents[agent.id].status === 'running'
  );
  return running.length;
}

function hasDecided(approvalId: ApprovalId) {
  return (state: OverviewState) => !state.pending.includes(approvalId);
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

const ARRIVAL: Step[] = [
  { after: 1300, action: { type: 'spent', id: 'researcher', usd: 0.021 } },
  {
    after: 1400,
    action: {
      type: 'finished',
      id: 'writer',
      task: 'Product notes ready for 14 titles',
      usd: 0.026,
    },
  },
  {
    after: 1400,
    action: {
      type: 'batch',
      actions: [
        {
          type: 'failed',
          id: 'test-runner',
          task: '3 of 41 tests failed on currency rounding',
        },
        { type: 'told', id: 'coder', task: 'Reading the 3 failed tests' },
      ],
    },
  },
  { after: 1500, action: { type: 'asked', approvalId: 'run-migration' } },
];

export const SCRIPT: Step[] = [
  ...ARRIVAL,
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve-send-policy',
    action: {
      type: 'decided',
      approvalId: 'send-policy',
      decision: 'approved',
    },
    isAnswered: hasDecided('send-policy'),
  },
  {
    after: 1300,
    by: 'demo',
    press: 'toggle-coder',
    action: { type: 'toggled', id: 'coder' },
  },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve-run-migration',
    action: {
      type: 'decided',
      approvalId: 'run-migration',
      decision: 'approved',
    },
    isAnswered: hasDecided('run-migration'),
  },
  {
    after: 1600,
    action: {
      type: 'finished',
      id: 'reviewer',
      task: 'Sent the refund policy update to 212 customers',
      usd: 0.018,
    },
  },
  { after: 1500, by: 'demo', action: { type: 'period', period: 'week' } },
  {
    after: 1700,
    action: {
      type: 'finished',
      id: 'rate-reader',
      task: 'Read 4 rate cards, 2 prices changed',
      usd: 0.031,
    },
  },
];

/** Under reduced motion both requests still wait, so the list and its buttons can be read. */
function restingOf() {
  let state = INITIAL;
  let now = LOADED_AT;
  for (const step of ARRIVAL) {
    now += step.after;
    state = applyAt(state, step.action, now);
  }
  return applyAt(state, { type: 'toggled', id: 'coder' }, now);
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3600;
