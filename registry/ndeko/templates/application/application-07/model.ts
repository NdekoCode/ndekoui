import type {
  RunAgent,
  RunSnapshot,
  ToolCall,
} from '@/registry/ndeko/lib/agent-run';

import { planSeedOf } from './data';

export type LaneId = 'queued' | 'running' | 'needs' | 'done';

export type BoardTask = {
  id: string;
  title: string;
  ownerId: string;
  lane: LaneId;
  status: string;
};

export function agentOf(run: RunSnapshot, id: string) {
  return run.agents.find((agent) => agent.id === id);
}

export function callsOfAgent(run: RunSnapshot, agentId: string) {
  return run.calls.filter((call) => call.agentId === agentId);
}

function laneOf(status: string, isOwnerWaiting: boolean): LaneId {
  if (status === 'upcoming') {
    return 'queued';
  }
  if (status === 'running') {
    if (isOwnerWaiting) {
      return 'needs';
    }
    return 'running';
  }
  return 'done';
}

export function boardOf(run: RunSnapshot): BoardTask[] {
  return run.plan.map((step) => {
    const ownerId = planSeedOf(step.id).ownerId;
    const owner = agentOf(run, ownerId);
    const isOwnerWaiting = owner?.status === 'waiting';
    const lane = laneOf(step.status, isOwnerWaiting);
    return {
      id: step.id,
      title: step.title,
      ownerId,
      lane,
      status: step.status,
    };
  });
}

export function placementOf(tasks: BoardTask[]) {
  const places = tasks.map((task) => `${task.id}:${task.lane}`);
  return places.join(' ');
}

function startedAtOf(agent: RunAgent) {
  return agent.startedAt ?? 0;
}

function latestFirst(first: RunAgent, second: RunAgent) {
  return startedAtOf(second) - startedAtOf(first);
}

/**
 * The agent the monitor follows: the one a person picked, else the one that waits on a person, else
 * the one that started last among those at work, else the one that finished last.
 */
export function monitoredAgentOf(run: RunSnapshot, focusId: string | null) {
  if (focusId !== null) {
    return agentOf(run, focusId);
  }
  const waiting = run.agents.find((agent) => agent.status === 'waiting');
  if (waiting) {
    return waiting;
  }
  const working = run.agents.filter((agent) => agent.status === 'running');
  const latestWorking = [...working].sort(latestFirst)[0];
  if (latestWorking) {
    return latestWorking;
  }
  const finished = run.agents.filter((agent) => agent.status === 'done');
  const lastFinished = [...finished].sort(latestFirst)[0];
  if (lastFinished) {
    return lastFinished;
  }
  return agentOf(run, 'coordinator');
}

function maxOf(values: Array<number | undefined>) {
  let largest = 0;
  for (const value of values) {
    if (value !== undefined && value > largest) {
      largest = value;
    }
  }
  return largest;
}

function stampsOfCall(call: ToolCall) {
  return [call.startedAt, call.endedAt];
}

/** The latest moment the run has recorded. A clock never reads earlier than it. */
export function latestStampOf(run: RunSnapshot) {
  const stamps: Array<number | undefined> = [run.startedAt, run.endedAt];
  for (const agent of run.agents) {
    stamps.push(agent.startedAt, agent.endedAt);
  }
  for (const step of run.plan) {
    stamps.push(step.startedAt, step.endedAt);
  }
  for (const call of run.calls) {
    stamps.push(...stampsOfCall(call));
  }
  for (const approval of run.approvals) {
    stamps.push(approval.requestedAt, approval.resolvedAt);
  }
  return maxOf(stamps);
}

/** What time it is for a run: the clock of the page, but never before what the run already recorded. */
export function runNowOf(run: RunSnapshot, now: number) {
  return Math.max(now, latestStampOf(run));
}

export function isRunLive(run: RunSnapshot) {
  return run.status === 'running' || run.status === 'waiting';
}
