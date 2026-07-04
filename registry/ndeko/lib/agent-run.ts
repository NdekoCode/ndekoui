export type SeriesSlot = 1 | 2 | 3 | 4 | 5;

export type RunStatus =
  'idle' | 'running' | 'waiting' | 'done' | 'failed' | 'cancelled';

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'done' | 'failed';

export type StepStatus = 'upcoming' | 'running' | 'done' | 'failed' | 'skipped';

export type CallStatus = 'queued' | 'running' | 'waiting' | 'done' | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ApprovalScope = 'once' | 'session' | 'always';

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export type RunAgent = {
  id: string;
  name: string;
  series: SeriesSlot;
  status: AgentStatus;
  role?: string;
  model?: string;
  task?: string;
  parentId?: string;
  costUsd?: number;
  startedAt?: number;
  endedAt?: number;
};

export type PlanStep = {
  id: string;
  title: string;
  status: StepStatus;
  detail?: string;
  substeps?: PlanStep[];
  startedAt?: number;
  endedAt?: number;
};

export type ToolCall = {
  id: string;
  tool: string;
  label: string;
  status: CallStatus;
  agentId?: string;
  parentId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt?: number;
  endedAt?: number;
};

export type ApprovalRequest = {
  id: string;
  title: string;
  risk: RiskLevel;
  status: ApprovalStatus;
  agentId?: string;
  detail?: string;
  command?: string;
  scope?: ApprovalScope;
  requestedAt?: number;
  resolvedAt?: number;
};

export type RunUsage = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  contextTokens: number;
  contextLimit: number;
};

export type RunSnapshot = {
  id: string;
  title: string;
  status: RunStatus;
  agents: RunAgent[];
  plan: PlanStep[];
  calls: ToolCall[];
  approvals: ApprovalRequest[];
  usage: RunUsage;
  startedAt?: number;
  endedAt?: number;
};

export type RunEvent =
  | { type: 'run.started'; title?: string }
  | { type: 'run.finished'; status: 'done' | 'failed' | 'cancelled' }
  | { type: 'agent.added'; agent: RunAgent }
  | { type: 'agent.updated'; id: string; patch: Partial<RunAgent> }
  | { type: 'plan.set'; steps: PlanStep[] }
  | { type: 'step.updated'; id: string; patch: Partial<PlanStep> }
  | { type: 'call.started'; call: ToolCall }
  | { type: 'call.updated'; id: string; patch: Partial<ToolCall> }
  | { type: 'approval.requested'; approval: ApprovalRequest }
  | {
      type: 'approval.resolved';
      id: string;
      decision: 'approved' | 'denied';
      scope?: ApprovalScope;
    }
  | {
      type: 'usage.added';
      inputTokens?: number;
      outputTokens?: number;
      costUsd?: number;
      contextTokens?: number;
    }
  | { type: 'reset'; snapshot: RunSnapshot };

export type RunStore = {
  getSnapshot: () => RunSnapshot;
  subscribe: (listener: () => void) => () => void;
  dispatch: (event: RunEvent) => void;
};

const EMPTY_USAGE: RunUsage = {
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
  contextTokens: 0,
  contextLimit: 200_000,
};

export function emptyRun(partial: Partial<RunSnapshot> = {}): RunSnapshot {
  return {
    id: 'run',
    title: 'Run',
    status: 'idle',
    agents: [],
    plan: [],
    calls: [],
    approvals: [],
    usage: EMPTY_USAGE,
    ...partial,
  };
}

/** The CSS colour of a series slot, for dots, lanes, lines and `--chip`. */
export function seriesColorOf(slot: SeriesSlot) {
  return `var(--series-${slot})`;
}

function isFinishedStatus(status: string) {
  const isDone = status === 'done';
  const isFailed = status === 'failed';
  const isSkipped = status === 'skipped';
  return isDone || isFailed || isSkipped;
}

function stampedTimes<T extends { startedAt?: number; endedAt?: number }>(
  patch: Partial<T> & { status?: string },
  now: number
) {
  const stamped = { ...patch };
  const isStarting = patch.status === 'running';
  const needsStart = isStarting && patch.startedAt === undefined;
  if (needsStart) {
    stamped.startedAt = now;
  }
  const isEnding = isFinishedStatus(patch.status ?? '');
  const needsEnd = isEnding && patch.endedAt === undefined;
  if (needsEnd) {
    stamped.endedAt = now;
  }
  return stamped;
}

function updatedSteps(
  steps: PlanStep[],
  id: string,
  patch: Partial<PlanStep>
): PlanStep[] {
  return steps.map((step) => {
    if (step.id === id) {
      return { ...step, ...patch };
    }
    if (!step.substeps) {
      return step;
    }
    return { ...step, substeps: updatedSteps(step.substeps, id, patch) };
  });
}

function plus(total: number, amount: number | undefined) {
  const added = amount ?? 0;
  return total + added;
}

function hasPendingApproval(approvals: ApprovalRequest[]) {
  return approvals.some((approval) => approval.status === 'pending');
}

function statusAfterApproval(
  snapshot: RunSnapshot,
  approvals: ApprovalRequest[]
) {
  const isWaiting = snapshot.status === 'waiting';
  const stillWaiting = hasPendingApproval(approvals);
  if (!isWaiting) {
    return snapshot.status;
  }
  if (stillWaiting) {
    return 'waiting';
  }
  return 'running';
}

/** Applies one event to a run. Times the event leaves out are stamped with `now`. */
export function reduceRun(
  snapshot: RunSnapshot,
  event: RunEvent,
  now: number = Date.now()
): RunSnapshot {
  switch (event.type) {
    case 'reset':
      return event.snapshot;
    case 'run.started': {
      const title = event.title ?? snapshot.title;
      return { ...snapshot, title, status: 'running', startedAt: now };
    }
    case 'run.finished':
      return { ...snapshot, status: event.status, endedAt: now };
    case 'agent.added':
      return { ...snapshot, agents: [...snapshot.agents, event.agent] };
    case 'agent.updated': {
      const patch = stampedTimes<RunAgent>(event.patch, now);
      const agents = snapshot.agents.map((agent) => {
        if (agent.id !== event.id) {
          return agent;
        }
        return { ...agent, ...patch };
      });
      return { ...snapshot, agents };
    }
    case 'plan.set':
      return { ...snapshot, plan: event.steps };
    case 'step.updated': {
      const patch = stampedTimes<PlanStep>(event.patch, now);
      const plan = updatedSteps(snapshot.plan, event.id, patch);
      return { ...snapshot, plan };
    }
    case 'call.started': {
      const call = stampedTimes<ToolCall>(event.call, now) as ToolCall;
      return { ...snapshot, calls: [...snapshot.calls, call] };
    }
    case 'call.updated': {
      const patch = stampedTimes<ToolCall>(event.patch, now);
      const calls = snapshot.calls.map((call) => {
        if (call.id !== event.id) {
          return call;
        }
        return { ...call, ...patch };
      });
      return { ...snapshot, calls };
    }
    case 'approval.requested': {
      const approval = { requestedAt: now, ...event.approval };
      const approvals = [...snapshot.approvals, approval];
      const isRunning = snapshot.status === 'running';
      if (isRunning) {
        return { ...snapshot, approvals, status: 'waiting' };
      }
      return { ...snapshot, approvals };
    }
    case 'approval.resolved': {
      const approvals = snapshot.approvals.map((approval) => {
        if (approval.id !== event.id) {
          return approval;
        }
        return {
          ...approval,
          status: event.decision,
          scope: event.scope ?? approval.scope,
          resolvedAt: now,
        };
      });
      const status = statusAfterApproval(snapshot, approvals);
      return { ...snapshot, approvals, status };
    }
    case 'usage.added': {
      const usage = snapshot.usage;
      const contextTokens = plus(usage.contextTokens, event.contextTokens);
      const cappedContext = Math.min(contextTokens, usage.contextLimit);
      const nextUsage: RunUsage = {
        ...usage,
        inputTokens: plus(usage.inputTokens, event.inputTokens),
        outputTokens: plus(usage.outputTokens, event.outputTokens),
        costUsd: plus(usage.costUsd, event.costUsd),
        contextTokens: cappedContext,
      };
      return { ...snapshot, usage: nextUsage };
    }
  }
}

/** A tiny store every agent view can read: feed it events from any backend. */
export function createRunStore(initial: RunSnapshot): RunStore {
  let snapshot = initial;
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch(event) {
      snapshot = reduceRun(snapshot, event);
      notify();
    },
  };
}

export function pendingApprovalsOf(snapshot: RunSnapshot) {
  return snapshot.approvals.filter((approval) => approval.status === 'pending');
}

export function elapsedOf(
  item: { startedAt?: number; endedAt?: number },
  now: number
) {
  if (item.startedAt === undefined) {
    return 0;
  }
  const end = item.endedAt ?? now;
  return Math.max(0, end - item.startedAt);
}

/** 0.4s, 4.2s, 42s, 1m 04s, 1h 02m. */
export function formatDuration(milliseconds: number) {
  const seconds = milliseconds / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`;
  }
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const restSeconds = Math.floor(seconds % 60);
    const paddedSeconds = String(restSeconds).padStart(2, '0');
    return `${minutes}m ${paddedSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  const paddedMinutes = String(restMinutes).padStart(2, '0');
  return `${hours}h ${paddedMinutes}m`;
}

/** 940, 4.2k, 42k, 1.2M. */
export function formatTokens(count: number) {
  if (count < 1000) {
    return String(Math.round(count));
  }
  const thousands = count / 1000;
  if (count < 10_000) {
    return `${thousands.toFixed(1)}k`;
  }
  if (count < 1_000_000) {
    return `${Math.round(thousands)}k`;
  }
  const millions = count / 1_000_000;
  return `${millions.toFixed(1)}M`;
}

const SMALL_COST = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const LARGE_COST = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $0.042 under a dollar, $12.40 above. */
export function formatCost(usd: number) {
  const isSmall = usd < 1;
  if (isSmall) {
    return SMALL_COST.format(usd);
  }
  return LARGE_COST.format(usd);
}
