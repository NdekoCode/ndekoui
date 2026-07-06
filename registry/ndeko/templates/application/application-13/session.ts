import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  DEMO_ATTACHMENT,
  DEMO_SUGGESTION,
  EMPTY_PROMPT_HINT,
  FULL_HINT,
  MAX_ATTACHMENTS,
  RUNS,
  RUNS_SHOWN,
  SESSIONS,
  STARTING_AGENT,
  TITLE_WORDS,
  WAITING_RUN,
  type AgentId,
  type Attachment,
  type ModeId,
  type ModelId,
  type PastSession,
  type RunSeed,
  type RunStatus,
} from './data';
import { wordsOf } from './words';

/** A place in the field of glyphs, as a share of its width and of its height. */
export type Point = {
  x: number;
  y: number;
};

export type Decision = 'approved' | 'denied';

export type Hint = 'none' | 'empty' | 'full';

export type Run = {
  id: string;
  agentId: AgentId;
  title: string;
  status: RunStatus;
  startedAt: number;
  endedAt?: number;
  costUsd: number;
  request?: string;
  note?: string;
};

export type StartState = {
  draft: string;
  attachments: Attachment[];
  model: ModelId;
  mode: ModeId;
  runs: Run[];
  sessions: PastSession[];
  sentCount: number;
  hint: Hint;
  refusals: number;
  spoken: string;
  demoLens: Point | null;
  demoRipples: number;
  isSidebarOpen: boolean;
};

export type StartAction =
  | { type: 'typed'; text: string }
  | { type: 'picked'; prompt: string }
  | { type: 'attached'; attachments: Attachment[] }
  | { type: 'detached'; id: string }
  | { type: 'modelSet'; model: ModelId }
  | { type: 'modeSet'; mode: ModeId }
  | { type: 'sent' }
  | { type: 'runStarted'; id: string }
  | { type: 'runFinished'; id: string }
  | { type: 'decided'; id: string; decision: Decision }
  | { type: 'lens'; point: Point | null }
  | { type: 'rippled' }
  | { type: 'sidebar'; isOpen: boolean };

type Step = SessionStep<StartState, StartAction>;

const MINUTE_MS = 60_000;

const LOADED_AT = Date.now();

function since(minutes: number) {
  const elapsed = minutes * MINUTE_MS;
  return LOADED_AT - elapsed;
}

function endedAtOf(seed: RunSeed) {
  if (seed.endedMinutesAgo === undefined) {
    return undefined;
  }
  return since(seed.endedMinutesAgo);
}

function runOf(seed: RunSeed): Run {
  return {
    id: seed.id,
    agentId: seed.agentId,
    title: seed.title,
    status: seed.status,
    startedAt: since(seed.startedMinutesAgo),
    endedAt: endedAtOf(seed),
    costUsd: seed.costUsd,
    request: seed.request,
    note: seed.failure,
  };
}

export const INITIAL: StartState = {
  draft: '',
  attachments: [],
  model: 'claude-sonnet',
  mode: 'ask',
  runs: RUNS.map(runOf),
  sessions: SESSIONS,
  sentCount: 0,
  hint: 'none',
  refusals: 0,
  spoken: '',
  demoLens: null,
  demoRipples: 0,
  isSidebarOpen: false,
};

export function sentRunIdOf(count: number) {
  return `sent-${count}`;
}

const FIRST_SENT_RUN = sentRunIdOf(1);

function refused(state: StartState, hint: Hint, spoken: string): StartState {
  const refusals = state.refusals + 1;
  return { ...state, hint, refusals, spoken };
}

function attached(state: StartState, added: Attachment[]): StartState {
  const room = MAX_ATTACHMENTS - state.attachments.length;
  const accepted = added.slice(0, room);
  const attachments = [...state.attachments, ...accepted];
  const hasOverflow = added.length > room;
  if (hasOverflow) {
    return refused({ ...state, attachments }, 'full', FULL_HINT);
  }
  return { ...state, attachments, hint: 'none' };
}

function detached(state: StartState, id: string): StartState {
  const attachments = state.attachments.filter((file) => file.id !== id);
  return { ...state, attachments, hint: 'none' };
}

function shortTitleOf(text: string) {
  const words = wordsOf(text);
  const kept = words.slice(0, TITLE_WORDS);
  return kept.join(' ');
}

/** A sent prompt becomes the newest run and the newest session. The list of runs keeps to the latest ones. */
function sent(state: StartState, now: number): StartState {
  const text = state.draft.trim();
  if (text === '') {
    return refused(state, 'empty', EMPTY_PROMPT_HINT);
  }
  const sentCount = state.sentCount + 1;
  const id = sentRunIdOf(sentCount);
  const title = shortTitleOf(text);
  const run: Run = {
    id,
    agentId: STARTING_AGENT,
    title: text,
    status: 'queued',
    startedAt: now,
    costUsd: 0,
  };
  const session: PastSession = { id, day: 'Today', title, prompt: text };
  const runs = [run, ...state.runs];
  const latestRuns = runs.slice(0, RUNS_SHOWN);
  const spoken = `Session started: ${title}`;
  return {
    ...state,
    draft: '',
    attachments: [],
    runs: latestRuns,
    sessions: [session, ...state.sessions],
    sentCount,
    hint: 'none',
    spoken,
  };
}

function patchedRun(
  state: StartState,
  id: string,
  from: RunStatus,
  change: (run: Run) => Run
): StartState {
  const runs = state.runs.map((run) => {
    const isTarget = run.id === id && run.status === from;
    if (!isTarget) {
      return run;
    }
    return change(run);
  });
  return { ...state, runs };
}

/** A run that starts again forgets when it stopped, so its clock counts on from its first start. */
function runStarted(state: StartState, id: string): StartState {
  return patchedRun(state, id, 'queued', (run) => ({
    ...run,
    status: 'running',
    endedAt: undefined,
  }));
}

const DEMO_RUN_USD = 0.094;

function finishedRun(run: Run, now: number): Run {
  const costUsd = run.costUsd + DEMO_RUN_USD;
  return { ...run, status: 'done', endedAt: now, costUsd };
}

function runFinished(state: StartState, id: string, now: number): StartState {
  return patchedRun(state, id, 'running', (run) => finishedRun(run, now));
}

function decided(
  state: StartState,
  id: string,
  decision: Decision,
  now: number
): StartState {
  if (decision === 'approved') {
    const allowed = patchedRun(state, id, 'waiting', (run) => ({
      ...run,
      status: 'queued',
      note: 'Allowed by you',
    }));
    return { ...allowed, spoken: 'Allowed. The run starts again' };
  }
  const stopped = patchedRun(state, id, 'waiting', (run) => ({
    ...run,
    status: 'done',
    endedAt: now,
    note: 'Denied by you, nothing was run',
  }));
  return { ...stopped, spoken: 'Denied. Nothing was run' };
}

function rippled(state: StartState): StartState {
  const demoRipples = state.demoRipples + 1;
  return { ...state, demoRipples };
}

export function applyAt(
  state: StartState,
  action: StartAction,
  now: number
): StartState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text, hint: 'none' };
    case 'picked':
      return { ...state, draft: action.prompt, hint: 'none' };
    case 'attached':
      return attached(state, action.attachments);
    case 'detached':
      return detached(state, action.id);
    case 'modelSet':
      return { ...state, model: action.model };
    case 'modeSet':
      return { ...state, mode: action.mode };
    case 'sent':
      return sent(state, now);
    case 'runStarted':
      return runStarted(state, action.id);
    case 'runFinished':
      return runFinished(state, action.id, now);
    case 'decided':
      return decided(state, action.id, action.decision, now);
    case 'lens':
      return { ...state, demoLens: action.point };
    case 'rippled':
      return rippled(state);
    case 'sidebar':
      return { ...state, isSidebarOpen: action.isOpen };
  }
}

export function reducer(state: StartState, action: StartAction) {
  return applyAt(state, action, Date.now());
}

function hasSent(state: StartState) {
  return state.sentCount > 0;
}

function hasDecided(state: StartState) {
  const run = state.runs.find((candidate) => candidate.id === WAITING_RUN);
  return run?.status !== 'waiting';
}

export const START_MS = 800;

export const RUN_MS = 3000;

const DEMO_DECIDES_AFTER_MS = 2500;

function lens(after: number, point: Point | null): Step {
  return { after, by: 'demo', action: { type: 'lens', point } };
}

function ripple(after: number): Step {
  return { after, by: 'demo', action: { type: 'rippled' } };
}

/** The lens glides the way a pointer would before a person touches anything, then the prompt is filled in. */
const OPENING: Step[] = [
  lens(900, { x: 0.18, y: 0.1 }),
  lens(1200, { x: 0.84, y: 0.13 }),
  lens(1300, { x: 0.9, y: 0.56 }),
  ripple(800),
  lens(1100, { x: 0.5, y: 0.5 }),
  {
    after: 900,
    by: 'demo',
    press: `suggestion-${DEMO_SUGGESTION.id}`,
    action: { type: 'picked', prompt: DEMO_SUGGESTION.prompt },
  },
  {
    after: 1000,
    by: 'demo',
    press: 'attach',
    action: { type: 'attached', attachments: [DEMO_ATTACHMENT] },
  },
  { after: 1000, by: 'demo', action: { type: 'modeSet', mode: 'plan' } },
  {
    after: 900,
    by: 'demo',
    action: { type: 'modelSet', model: 'claude-opus' },
  },
  lens(800, { x: 0.1, y: 0.74 }),
];

const CLOSING: Step[] = [
  {
    after: 1500,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasSent,
  },
  { after: START_MS, action: { type: 'runStarted', id: FIRST_SENT_RUN } },
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', id: WAITING_RUN, decision: 'approved' },
    isAnswered: hasDecided,
  },
  { after: START_MS, action: { type: 'runStarted', id: WAITING_RUN } },
  ripple(700),
  { after: 2200, action: { type: 'runFinished', id: FIRST_SENT_RUN } },
  lens(900, null),
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const FILLED = restingOf(INITIAL, OPENING, applyAt);

/** Where the lens rests when nothing plays: high on the right, in the margin beside the title on a wide page. */
const RESTING_LENS: Point = { x: 0.82, y: 0.12 };

/** Under reduced motion the prompt is filled in and ready to send, and one run waits for an answer. */
export const RESTING: StartState = { ...FILLED, demoLens: RESTING_LENS };

export const LOOP_AFTER_MS = 3200;
