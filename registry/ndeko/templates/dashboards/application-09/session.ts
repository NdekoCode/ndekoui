import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  AGENTS,
  AGENT_ORDER,
  BASE_FIGURES,
  BASE_SPEND,
  INITIAL_PENDING,
  INITIAL_RUNS,
  REQUESTS,
  RUNS,
  type AgentId,
  type PageId,
  type RequestId,
  type RunId,
  type RunSeed,
} from './data';

export type Decision = 'approved' | 'denied';

export type RunEntry = {
  kind: 'run';
  id: RunId;
  status: 'running' | 'done';
};

export type DecisionEntry = {
  kind: 'decision';
  id: string;
  requestId: RequestId;
  decision: Decision;
};

export type ActivityEntry = RunEntry | DecisionEntry;

export type NotificationEntry = {
  id: string;
  agentId: AgentId;
  text: string;
  age: string;
  isUnread: boolean;
};

export type DashboardState = {
  pending: RequestId[];
  activity: ActivityEntry[];
  notifications: NotificationEntry[];
  runsToday: number;
  hoursSaved: number;
  spend: Record<AgentId, number>;
  pageId: PageId;
  isNavOpen: boolean;
  spoken: string;
};

export type DashboardAction =
  | { type: 'finished'; id: RunId }
  | { type: 'ran'; id: RunId }
  | { type: 'requested'; id: RequestId }
  | { type: 'decided'; id: RequestId; decision: Decision }
  | { type: 'read' }
  | { type: 'page'; id: PageId }
  | { type: 'nav'; isOpen: boolean };

type Step = SessionStep<DashboardState, DashboardAction>;

function initialEntryOf(id: RunId): RunEntry {
  if (id === 'digest') {
    return { kind: 'run', id, status: 'running' };
  }
  return { kind: 'run', id, status: 'done' };
}

const INITIAL_NOTIFICATIONS: NotificationEntry[] = [
  {
    id: 'note-bank',
    agentId: 'reconciler',
    text: RUNS.bank.doneText,
    age: '26 min ago',
    isUnread: false,
  },
  {
    id: 'note-vendors',
    agentId: 'researcher',
    text: RUNS.vendors.doneText,
    age: '1 h ago',
    isUnread: false,
  },
  {
    id: 'note-forecast',
    agentId: 'reviewer',
    text: RUNS.forecast.doneText,
    age: '2 h ago',
    isUnread: false,
  },
];

export const INITIAL: DashboardState = {
  pending: INITIAL_PENDING,
  activity: INITIAL_RUNS.map(initialEntryOf),
  notifications: INITIAL_NOTIFICATIONS,
  runsToday: BASE_FIGURES.runsToday,
  hoursSaved: BASE_FIGURES.hoursSaved,
  spend: BASE_SPEND,
  pageId: 'overview',
  isNavOpen: false,
  spoken: '',
};

function roundedTo(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function totalSpendOf(spend: Record<AgentId, number>) {
  let total = 0;
  for (const agentId of AGENT_ORDER) {
    total += spend[agentId];
  }
  return roundedTo(total, 2);
}

export function lowercasedFirst(text: string) {
  const first = text.charAt(0).toLowerCase();
  return `${first}${text.slice(1)}`;
}

export function decisionTextOf(requestId: RequestId, decision: Decision) {
  const request = REQUESTS[requestId];
  const agent = AGENTS[request.agentId];
  const task = lowercasedFirst(request.title);
  if (decision === 'approved') {
    return `You allowed ${agent.name} to ${task}`;
  }
  return `You denied ${agent.name} the request to ${task}`;
}

function completed(state: DashboardState, seed: RunSeed): DashboardState {
  const agentSpend = state.spend[seed.agentId] + seed.costUsd;
  const spend = { ...state.spend, [seed.agentId]: roundedTo(agentSpend, 2) };
  const hoursSaved = roundedTo(state.hoursSaved + seed.hoursSaved, 1);
  return { ...state, runsToday: state.runsToday + 1, hoursSaved, spend };
}

function isRunEntryOf(entry: ActivityEntry, id: RunId) {
  if (entry.kind !== 'run') {
    return false;
  }
  return entry.id === id;
}

function isRunningEntryOf(entry: ActivityEntry, id: RunId) {
  if (entry.kind !== 'run') {
    return false;
  }
  const isSameRun = entry.id === id;
  const isRunning = entry.status === 'running';
  return isSameRun && isRunning;
}

function isApprovalOf(entry: ActivityEntry, requestId: RequestId) {
  if (entry.kind !== 'decision') {
    return false;
  }
  const isSameRequest = entry.requestId === requestId;
  const isApprovedEntry = entry.decision === 'approved';
  return isSameRequest && isApprovedEntry;
}

function hasRunEntry(state: DashboardState, id: RunId) {
  return state.activity.some((entry) => isRunEntryOf(entry, id));
}

function isApproved(state: DashboardState, requestId: RequestId) {
  return state.activity.some((entry) => isApprovalOf(entry, requestId));
}

function withEntryDone(entry: ActivityEntry, id: RunId): ActivityEntry {
  if (entry.kind !== 'run') {
    return entry;
  }
  if (entry.id !== id) {
    return entry;
  }
  return { ...entry, status: 'done' };
}

function notificationOfRun(seed: RunSeed): NotificationEntry {
  return {
    id: `note-${seed.id}`,
    agentId: seed.agentId,
    text: seed.doneText,
    age: 'Just now',
    isUnread: true,
  };
}

function notificationOfRequest(requestId: RequestId): NotificationEntry {
  const request = REQUESTS[requestId];
  const agent = AGENTS[request.agentId];
  return {
    id: `note-ask-${requestId}`,
    agentId: request.agentId,
    text: `${agent.name} asks to ${lowercasedFirst(request.title)}`,
    age: 'Just now',
    isUnread: true,
  };
}

function finished(state: DashboardState, id: RunId): DashboardState {
  const isRunning = state.activity.some((entry) => isRunningEntryOf(entry, id));
  if (!isRunning) {
    return state;
  }
  const seed = RUNS[id];
  const activity = state.activity.map((entry) => withEntryDone(entry, id));
  const notifications = [notificationOfRun(seed), ...state.notifications];
  const next = completed({ ...state, activity, notifications }, seed);
  return { ...next, spoken: seed.doneText };
}

function ran(state: DashboardState, id: RunId): DashboardState {
  const seed = RUNS[id];
  const isKnown = hasRunEntry(state, id);
  const isBlocked =
    seed.afterApproval !== undefined && !isApproved(state, seed.afterApproval);
  if (isKnown || isBlocked) {
    return state;
  }
  const entry: RunEntry = { kind: 'run', id, status: 'done' };
  const activity = [entry, ...state.activity];
  const notifications = [notificationOfRun(seed), ...state.notifications];
  const next = completed({ ...state, activity, notifications }, seed);
  return { ...next, spoken: seed.doneText };
}

function requested(state: DashboardState, id: RequestId): DashboardState {
  const isWaiting = state.pending.includes(id);
  if (isWaiting) {
    return state;
  }
  const notification = notificationOfRequest(id);
  const notifications = [notification, ...state.notifications];
  const pending = [...state.pending, id];
  return { ...state, pending, notifications, spoken: notification.text };
}

function decided(
  state: DashboardState,
  id: RequestId,
  decision: Decision
): DashboardState {
  const isWaiting = state.pending.includes(id);
  if (!isWaiting) {
    return state;
  }
  const pending = state.pending.filter((requestId) => requestId !== id);
  const entry: DecisionEntry = {
    kind: 'decision',
    id: `decision-${id}`,
    requestId: id,
    decision,
  };
  const activity = [entry, ...state.activity];
  return {
    ...state,
    pending,
    activity,
    spoken: decisionTextOf(id, decision),
  };
}

function read(state: DashboardState): DashboardState {
  const notifications = state.notifications.map((note) => ({
    ...note,
    isUnread: false,
  }));
  return { ...state, notifications };
}

export function reducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'finished':
      return finished(state, action.id);
    case 'ran':
      return ran(state, action.id);
    case 'requested':
      return requested(state, action.id);
    case 'decided':
      return decided(state, action.id, action.decision);
    case 'read':
      return read(state);
    case 'page':
      return { ...state, pageId: action.id };
    case 'nav':
      return { ...state, isNavOpen: action.isOpen };
  }
}

export function unreadCountOf(state: DashboardState) {
  return state.notifications.filter((note) => note.isUnread).length;
}

function isAnswered(requestId: RequestId) {
  return (state: DashboardState) => !state.pending.includes(requestId);
}

function decide(requestId: RequestId, decision: Decision): DashboardAction {
  return { type: 'decided', id: requestId, decision };
}

/**
 * The Writer finishes its digest and asks to send it. A person allows the journal entries, so the
 * Reconciler posts them, then turns the refund down. The agents' steps play for everyone, the two
 * answers are the person's.
 */
export const SCRIPT: Step[] = [
  { after: 2600, action: { type: 'finished', id: 'digest' } },
  { after: 1100, action: { type: 'requested', id: 'digest' } },
  {
    after: 2400,
    by: 'person',
    press: 'allow-entries',
    action: decide('entries', 'approved'),
    isAnswered: isAnswered('entries'),
  },
  { after: 1500, action: { type: 'ran', id: 'posting' } },
  {
    after: 2800,
    by: 'person',
    press: 'deny-refund',
    action: decide('refund', 'denied'),
    isAnswered: isAnswered('refund'),
  },
];

const ENDED = restingOf(INITIAL, SCRIPT, reducer);

/** Under reduced motion the round is over: the entries are posted, the refund is turned down and the digest waits. */
export const RESTING: DashboardState = {
  ...ENDED,
  isNavOpen: false,
  spoken: '',
};

export const LOOP_AFTER_MS = 3600;
