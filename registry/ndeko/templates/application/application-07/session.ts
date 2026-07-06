import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  pendingApprovalsOf,
  reduceRun,
  type AgentStatus,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  AGENT_COST_AFTER,
  AGENT_TASK,
  AGENTS,
  callSeedOf,
  JOURNAL_REQUEST,
  PLAN_STEPS,
  PLAN_USAGE,
  POSTING_TASK,
  RUN_ID,
  RUN_TITLE,
  type AgentId,
  type StepId,
} from './data';

export type Decision = 'approved' | 'denied';

export type ScrollTarget = 'top' | 'fleet';

export type OpsState = {
  run: RunSnapshot;
  focusAgentId: string | null;
  scrollTarget: ScrollTarget;
  isStopped: boolean;
};

export type OpsAction =
  | { type: 'events'; events: RunEvent[] }
  | { type: 'decided'; decision: Decision }
  | { type: 'focused'; id: string | null }
  | { type: 'scrolled'; target: ScrollTarget };

type Step = SessionStep<OpsState, OpsAction>;

export const INITIAL: OpsState = {
  run: emptyRun({ id: RUN_ID, title: RUN_TITLE, agents: AGENTS }),
  focusAgentId: null,
  scrollTarget: 'top',
  isStopped: false,
};

function appliedEvents(run: RunSnapshot, events: RunEvent[], now: number) {
  let next = run;
  for (const event of events) {
    next = reduceRun(next, event, now);
  }
  return next;
}

function patchedCall(
  run: RunSnapshot,
  id: string,
  patch: Partial<ToolCall>
): RunSnapshot {
  const calls = run.calls.map((call) => {
    if (call.id !== id) {
      return call;
    }
    return { ...call, ...patch };
  });
  return { ...run, calls };
}

function patchedAgent(
  run: RunSnapshot,
  id: string,
  patch: Partial<RunAgent>
): RunSnapshot {
  const agents = run.agents.map((agent) => {
    if (agent.id !== id) {
      return agent;
    }
    return { ...agent, ...patch };
  });
  return { ...run, agents };
}

function patchedStep(
  run: RunSnapshot,
  id: string,
  status: 'skipped',
  endedAt: number
): RunSnapshot {
  const plan = run.plan.map((step) => {
    if (step.id !== id) {
      return step;
    }
    return { ...step, status, endedAt };
  });
  return { ...run, plan };
}

/**
 * Once a person answers, the call and its agent carry on from where they waited: a patch that
 * went through `reduceRun` would stamp their start again and lose the time spent waiting.
 */
function resumed(run: RunSnapshot): RunSnapshot {
  const call = patchedCall(run, 'c7', { status: 'running' });
  return patchedAgent(call, 'coordinator', { status: 'running' });
}

function stopped(run: RunSnapshot, now: number): RunSnapshot {
  const call = patchedCall(run, 'c7', {
    status: 'failed',
    error: 'Denied by you',
    endedAt: now,
  });
  const step = patchedStep(call, 'post', 'skipped', now);
  const agent = patchedAgent(step, 'coordinator', {
    status: 'done',
    task: 'Stopped, nothing was posted',
    endedAt: now,
  });
  return { ...agent, status: 'cancelled', endedAt: now };
}

function decided(state: OpsState, decision: Decision, now: number): OpsState {
  const pending = pendingApprovalsOf(state.run)[0];
  if (!pending || state.isStopped) {
    return state;
  }
  const resolved = reduceRun(
    state.run,
    { type: 'approval.resolved', id: pending.id, decision },
    now
  );
  if (decision === 'approved') {
    return { ...state, run: resumed(resolved) };
  }
  return { ...state, run: stopped(resolved, now), isStopped: true };
}

export function applyAt(
  state: OpsState,
  action: OpsAction,
  now: number
): OpsState {
  switch (action.type) {
    case 'events': {
      if (state.isStopped) {
        return state;
      }
      const run = appliedEvents(state.run, action.events, now);
      return { ...state, run };
    }
    case 'decided':
      return decided(state, action.decision, now);
    case 'focused':
      return { ...state, focusAgentId: action.id };
    case 'scrolled':
      return { ...state, scrollTarget: action.target };
  }
}

export function reducer(state: OpsState, action: OpsAction) {
  return applyAt(state, action, Date.now());
}

function hasDecided(state: OpsState) {
  if (state.isStopped) {
    return true;
  }
  return pendingApprovalsOf(state.run).length === 0;
}

function events(after: number, ...list: RunEvent[]): Step {
  return { after, action: { type: 'events', events: list } };
}

/** A patch without a task keeps the one the agent had: an explicit undefined would clear it. */
function agentStatus(
  id: AgentId,
  status: AgentStatus,
  task?: string
): RunEvent {
  if (task === undefined) {
    return { type: 'agent.updated', id, patch: { status } };
  }
  return { type: 'agent.updated', id, patch: { status, task } };
}

function agentRunning(id: AgentId): RunEvent {
  return agentStatus(id, 'running', AGENT_TASK[id]);
}

function stepStatus(id: StepId, status: 'running' | 'done'): RunEvent {
  return { type: 'step.updated', id, patch: { status } };
}

function startCall(id: string): RunEvent {
  const seed = callSeedOf(id);
  return {
    type: 'call.started',
    call: {
      id,
      tool: seed.toolId,
      label: seed.label,
      status: 'running',
      agentId: seed.agentId,
    },
  };
}

function finishCall(id: string): RunEvent[] {
  const seed = callSeedOf(id);
  const spent = AGENT_COST_AFTER[id];
  return [
    { type: 'call.updated', id, patch: { status: 'done' } },
    {
      type: 'usage.added',
      inputTokens: seed.inputTokens,
      outputTokens: seed.outputTokens,
      costUsd: seed.costUsd,
      contextTokens: seed.inputTokens + seed.outputTokens,
    },
    { type: 'agent.updated', id: seed.agentId, patch: { costUsd: spent } },
  ];
}

function demoScroll(after: number, target: ScrollTarget): Step {
  return { after, by: 'demo', action: { type: 'scrolled', target } };
}

function demoFocus(after: number, id: string | null, press: string): Step {
  return { after, by: 'demo', press, action: { type: 'focused', id } };
}

const DEMO_DECIDES_AFTER_MS = 2500;

const OPENING: Step[] = [
  events(1000, { type: 'run.started' }),
  events(
    600,
    { type: 'plan.set', steps: PLAN_STEPS },
    agentRunning('coordinator'),
    {
      type: 'usage.added',
      inputTokens: PLAN_USAGE.inputTokens,
      outputTokens: PLAN_USAGE.outputTokens,
      costUsd: PLAN_USAGE.costUsd,
      contextTokens: PLAN_USAGE.inputTokens + PLAN_USAGE.outputTokens,
    },
    {
      type: 'agent.updated',
      id: 'coordinator',
      patch: { costUsd: PLAN_USAGE.costUsd },
    }
  ),
  events(
    1000,
    agentStatus('coordinator', 'idle', 'Waiting for the workers'),
    stepStatus('collect', 'running'),
    agentRunning('collector'),
    startCall('c1'),
    startCall('c2')
  ),
  events(1100, startCall('c3')),
  events(1400, ...finishCall('c1')),
  events(900, ...finishCall('c2')),
  events(
    1000,
    ...finishCall('c3'),
    stepStatus('collect', 'done'),
    agentStatus('collector', 'done')
  ),
  events(
    500,
    stepStatus('match', 'running'),
    agentRunning('matcher'),
    startCall('c4')
  ),
  demoScroll(700, 'fleet'),
  demoFocus(1100, 'matcher', 'fleet-matcher'),
  demoFocus(1500, null, 'fleet-matcher'),
  demoScroll(900, 'top'),
  events(
    300,
    ...finishCall('c4'),
    stepStatus('match', 'done'),
    agentStatus('matcher', 'done')
  ),
  events(
    500,
    stepStatus('draft', 'running'),
    agentRunning('writer'),
    startCall('c5')
  ),
  events(
    3000,
    ...finishCall('c5'),
    stepStatus('draft', 'done'),
    agentStatus('writer', 'done')
  ),
  events(
    500,
    stepStatus('review', 'running'),
    agentRunning('reviewer'),
    startCall('c6')
  ),
  events(
    2200,
    ...finishCall('c6'),
    stepStatus('review', 'done'),
    agentStatus('reviewer', 'done')
  ),
  events(
    600,
    stepStatus('post', 'running'),
    agentStatus('coordinator', 'running', POSTING_TASK),
    startCall('c7'),
    { type: 'call.updated', id: 'c7', patch: { status: 'waiting' } },
    { type: 'approval.requested', approval: JOURNAL_REQUEST },
    agentStatus('coordinator', 'waiting', POSTING_TASK)
  ),
];

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  events(
    2200,
    ...finishCall('c7'),
    stepStatus('post', 'done'),
    agentStatus('coordinator', 'done'),
    { type: 'run.finished', status: 'done' }
  ),
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const LOADED_AT = Date.now();

const ASKED = restingOf(INITIAL, OPENING, (state, action, sinceStart) =>
  applyAt(state, action, LOADED_AT + sinceStart)
);

/** Under reduced motion the run waits on its request: every step before it is done, the command to post shows. */
export const RESTING: OpsState = {
  ...ASKED,
  focusAgentId: null,
  scrollTarget: 'top',
};

export const LOOP_AFTER_MS = 3600;
