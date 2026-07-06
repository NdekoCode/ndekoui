import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { countOf } from '@/registry/ndeko/lib/words';

import {
  AGENT_TASK,
  DEMO_TASK,
  DENIED_NOTE,
  eventsOfDay,
  RUN_COPY,
  RUNS,
  spokenNodeOf,
  STAGE_COUNTS_AFTER,
  STAGE_COUNTS_BEFORE,
  STRIP,
  taskOf,
  TASKS,
  type RunId,
  type RunStatus,
} from './data';
import { layoutNameOf, type LayoutId } from './graph-layouts';

export type Decision = 'approved' | 'denied';

export type RunLive = {
  status: RunStatus;
  note: string;
};

export type CrmState = {
  isLoaded: boolean;
  layout: LayoutId;
  selectedId: string | null;
  taskIds: string[];
  doneTaskIds: string[];
  runs: Record<RunId, RunLive>;
  stageCounts: number[];
  dayIndex: number | null;
  isSidebarOpen: boolean;
  spoken: string;
};

export type CrmAction =
  | { type: 'loaded' }
  | { type: 'layoutSet'; layout: LayoutId }
  | { type: 'nodeSelected'; id: string | null }
  | { type: 'taskToggled'; id: string }
  | { type: 'taskAdded'; id: string }
  | { type: 'runStarted'; id: RunId }
  | { type: 'runFinished'; id: RunId }
  | { type: 'decided'; id: RunId; decision: Decision }
  | { type: 'funnelUpdated' }
  | { type: 'daySelected'; index: number | null }
  | { type: 'sidebar'; isOpen: boolean }
  | { type: 'batch'; actions: CrmAction[] };

type Step = SessionStep<CrmState, CrmAction>;

const MERGE: RunId = 'merge';

function runsOf(): Record<RunId, RunLive> {
  const quiet: RunLive = { status: 'done', note: '' };
  const runs: Record<RunId, RunLive> = {
    enrich: quiet,
    qualify: quiet,
    drafts: quiet,
    merge: quiet,
  };
  for (const seed of RUNS) {
    runs[seed.id] = { status: seed.status, note: seed.note };
  }
  return runs;
}

export const INITIAL: CrmState = {
  isLoaded: false,
  layout: 'cluster',
  selectedId: null,
  taskIds: TASKS.map((task) => task.id),
  doneTaskIds: [],
  runs: runsOf(),
  stageCounts: STAGE_COUNTS_BEFORE,
  dayIndex: null,
  isSidebarOpen: false,
  spoken: '',
};

function spokenSelectionOf(id: string | null) {
  if (id === null) {
    return 'Selection cleared';
  }
  return spokenNodeOf(id);
}

function taskToggled(state: CrmState, id: string): CrmState {
  const task = taskOf(id);
  const isDone = state.doneTaskIds.includes(id);
  if (isDone) {
    const doneTaskIds = state.doneTaskIds.filter((doneId) => doneId !== id);
    return { ...state, doneTaskIds, spoken: `${task.title}, open again` };
  }
  const doneTaskIds = [...state.doneTaskIds, id];
  return { ...state, doneTaskIds, spoken: `${task.title}, done` };
}

function taskAdded(state: CrmState, id: string): CrmState {
  const isKnown = state.taskIds.includes(id);
  if (isKnown) {
    return state;
  }
  const taskIds = [id, ...state.taskIds];
  return { ...state, taskIds };
}

function runPatched(
  state: CrmState,
  id: RunId,
  from: RunStatus,
  to: RunLive
): CrmState {
  const run = state.runs[id];
  if (run.status !== from) {
    return state;
  }
  return { ...state, runs: { ...state.runs, [id]: to } };
}

function runStarted(state: CrmState, id: RunId): CrmState {
  const live: RunLive = { status: 'running', note: RUN_COPY[id].running };
  return runPatched(state, id, 'queued', live);
}

function runFinished(state: CrmState, id: RunId): CrmState {
  const live: RunLive = { status: 'done', note: RUN_COPY[id].done };
  return runPatched(state, id, 'running', live);
}

function decided(state: CrmState, id: RunId, decision: Decision): CrmState {
  if (decision === 'approved') {
    const live: RunLive = { status: 'running', note: RUN_COPY[id].running };
    const next = runPatched(state, id, 'waiting', live);
    return { ...next, spoken: 'Allowed. Scout merges the duplicates' };
  }
  const live: RunLive = { status: 'done', note: DENIED_NOTE };
  const next = runPatched(state, id, 'waiting', live);
  return { ...next, spoken: 'Denied. Nothing is merged' };
}

function spokenDayOf(index: number | null) {
  if (index === null) {
    return 'No day selected';
  }
  const day = STRIP[index];
  const events = eventsOfDay(index);
  const count = countOf(events.length, 'event');
  return `${day.spoken}, ${count}`;
}

export function reducer(state: CrmState, action: CrmAction): CrmState {
  switch (action.type) {
    case 'loaded':
      return { ...state, isLoaded: true };
    case 'layoutSet': {
      const name = layoutNameOf(action.layout);
      return { ...state, layout: action.layout, spoken: `${name} layout` };
    }
    case 'nodeSelected': {
      const spoken = spokenSelectionOf(action.id);
      return { ...state, selectedId: action.id, spoken };
    }
    case 'taskToggled':
      return taskToggled(state, action.id);
    case 'taskAdded':
      return taskAdded(state, action.id);
    case 'runStarted':
      return runStarted(state, action.id);
    case 'runFinished':
      return runFinished(state, action.id);
    case 'decided':
      return decided(state, action.id, action.decision);
    case 'funnelUpdated':
      return { ...state, stageCounts: STAGE_COUNTS_AFTER };
    case 'daySelected': {
      const spoken = spokenDayOf(action.index);
      return { ...state, dayIndex: action.index, spoken };
    }
    case 'sidebar':
      return { ...state, isSidebarOpen: action.isOpen };
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = reducer(next, inner);
      }
      return next;
    }
  }
}

export function openTaskCount(state: CrmState) {
  const open = state.taskIds.filter((id) => !state.doneTaskIds.includes(id));
  return open.length;
}

function hasDecided(state: CrmState) {
  return state.runs[MERGE].status !== 'waiting';
}

const DEMO_DECIDES_AFTER_MS = 2000;

const SWITCH_MS = 2600;

function layoutStep(after: number, layout: LayoutId): Step {
  return { after, by: 'demo', action: { type: 'layoutSet', layout } };
}

function frame(after: number, actions: CrmAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

const OPENING: Step[] = [
  { after: 700, action: { type: 'loaded' } },
  layoutStep(1900, 'rings'),
  layoutStep(SWITCH_MS, 'grid'),
  layoutStep(SWITCH_MS, 'orbit'),
  layoutStep(SWITCH_MS, 'radial'),
  {
    after: SWITCH_MS,
    by: 'demo',
    press: 'node-esther',
    action: { type: 'nodeSelected', id: 'esther' },
  },
  layoutStep(SWITCH_MS, 'cluster'),
  frame(2400, [
    { type: 'runFinished', id: 'qualify' },
    { type: 'funnelUpdated' },
    { type: 'runStarted', id: 'drafts' },
  ]),
  {
    after: 1800,
    by: 'demo',
    press: `task-${DEMO_TASK}`,
    action: { type: 'taskToggled', id: DEMO_TASK },
  },
  frame(1800, [
    { type: 'runFinished', id: 'drafts' },
    { type: 'taskAdded', id: AGENT_TASK.id },
  ]),
];

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', id: MERGE, decision: 'approved' },
    isAnswered: hasDecided,
  },
  { after: 1100, action: { type: 'runFinished', id: MERGE } },
  {
    after: 1800,
    by: 'demo',
    press: 'day-3',
    action: { type: 'daySelected', index: 3 },
  },
  {
    after: SWITCH_MS,
    by: 'demo',
    press: 'day-6',
    action: { type: 'daySelected', index: 6 },
  },
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const FINISHED = restingOf(INITIAL, SCRIPT, reducer);

/** Under reduced motion the figures are loaded, the agent's work is done and one person of the graph is open. */
export const RESTING: CrmState = {
  ...FINISHED,
  layout: 'orbit',
  dayIndex: 3,
  spoken: '',
};

export const LOOP_AFTER_MS = 3500;
