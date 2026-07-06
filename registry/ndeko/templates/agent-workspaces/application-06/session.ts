import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { wordsOf } from '@/registry/ndeko/lib/words';

import {
  ANSWER_USD,
  DEMO_EFFORT,
  DEMO_FILE,
  DEMO_PHOTO,
  DEMO_SKILL,
  DEMO_TOOLS,
  EFFORT_RATE,
  FOLLOW_UP,
  LIVE_ID,
  MAX_ATTACHMENTS,
  MAX_QUEUED,
  NEW_ID,
  QUESTION,
  seedOf,
  STARTING_EFFORT,
  stepSeedOf,
  THOUGHT_USD,
  THOUGHT_WORDS,
  type Attachment,
  type Effort,
  type SeedId,
  type SkillId,
  type StepId,
  type ToolId,
} from './data';

export type TurnStage =
  'thinking' | 'working' | 'asking' | 'answering' | 'done' | 'declined';

export type Decision = 'approved' | 'denied';

export type StepStatus = 'running' | 'waiting' | 'done' | 'skipped';

export type StepRun = {
  id: StepId;
  status: StepStatus;
  startedAt: number;
  endedAt?: number;
};

export type Turn = {
  id: string;
  seedId: SeedId;
  text: string;
  attachments: Attachment[];
  toolIds: ToolId[];
  skillIds: SkillId[];
  effort: Effort;
  stage: TurnStage;
  steps: StepRun[];
  decision: Decision | null;
  startedAt: number;
  thoughtEndedAt?: number;
  endedAt?: number;
};

/** What a message carries when it leaves the composer: settings change after it, so it keeps its own copy. */
export type Outgoing = {
  id: string;
  text: string;
  attachments: Attachment[];
  toolIds: ToolId[];
  skillIds: SkillId[];
  effort: Effort;
};

export type Hint = 'none' | 'attachments' | 'queue';

export type WorkspaceState = {
  activeId: string;
  draft: string;
  attachments: Attachment[];
  toolIds: ToolId[];
  skillIds: SkillId[];
  effort: Effort;
  queue: Outgoing[];
  turns: Turn[];
  newLines: string[];
  sentCount: number;
  hint: Hint;
  refusals: number;
  costUsd: number;
  isSidebarOpen: boolean;
  search: string;
};

export type WorkspaceAction =
  | { type: 'typed'; text: string }
  | { type: 'attached'; attachments: Attachment[] }
  | { type: 'detached'; id: string }
  | { type: 'toolToggled'; id: ToolId }
  | { type: 'skillToggled'; id: SkillId }
  | { type: 'effortSet'; effort: Effort }
  | { type: 'sent' }
  | { type: 'queueRemoved'; id: string }
  | { type: 'thoughtDone'; turn: number }
  | { type: 'stepStarted'; turn: number; id: StepId }
  | { type: 'stepDone'; turn: number; id: StepId }
  | { type: 'asked'; turn: number }
  | { type: 'decided'; decision: Decision }
  | { type: 'answering'; turn: number }
  | { type: 'answered'; turn: number }
  | { type: 'sidebar'; isOpen: boolean }
  | { type: 'searched'; text: string }
  | { type: 'sessionOpened'; id: string }
  | { type: 'newSession' }
  | { type: 'batch'; actions: WorkspaceAction[] };

type Step = SessionStep<WorkspaceState, WorkspaceAction>;

export const INITIAL: WorkspaceState = {
  activeId: LIVE_ID,
  draft: '',
  attachments: [],
  toolIds: [],
  skillIds: [],
  effort: STARTING_EFFORT,
  queue: [],
  turns: [],
  newLines: [],
  sentCount: 0,
  hint: 'none',
  refusals: 0,
  costUsd: 0,
  isSidebarOpen: false,
  search: '',
};

const BUSY_STAGES: TurnStage[] = ['thinking', 'working', 'asking', 'answering'];

const WRITABLE_SESSIONS = [LIVE_ID, NEW_ID];

export function isTurnBusy(turn: Turn | undefined) {
  if (!turn) {
    return false;
  }
  return BUSY_STAGES.includes(turn.stage);
}

export function isBusy(state: WorkspaceState) {
  return isTurnBusy(state.turns.at(-1));
}

export function isReadOnly(state: WorkspaceState) {
  return !WRITABLE_SESSIONS.includes(state.activeId);
}

/**
 * What Send would post now. A person who takes over halfway through the first question sends the
 * whole question, not the half that was typed. Null when there is nothing to send.
 */
export function sendableTextOf(state: WorkspaceState) {
  if (isReadOnly(state)) {
    return null;
  }
  const trimmed = state.draft.trim();
  if (trimmed === '') {
    return null;
  }
  const isFirst = state.turns.length === 0;
  const isLive = state.activeId === LIVE_ID;
  const isUnfinishedDemo = QUESTION.startsWith(trimmed);
  if (isFirst && isLive && isUnfinishedDemo) {
    return QUESTION;
  }
  return trimmed;
}

function seedIdFor(turns: Turn[], text: string): SeedId {
  if (turns.length === 0) {
    return 'unpaid';
  }
  const trimmed = text.trim();
  const typed = trimmed.toLowerCase();
  const followUp = FOLLOW_UP.toLowerCase();
  const isFollowUp = typed === followUp;
  const hasShared = turns.some((turn) => turn.seedId === 'share');
  if (isFollowUp && !hasShared) {
    return 'share';
  }
  return 'canned';
}

function openingStageOf(seedId: SeedId): TurnStage {
  const seed = seedOf(seedId);
  if (seed.thought !== undefined) {
    return 'thinking';
  }
  if (seed.steps.length > 0) {
    return 'working';
  }
  return 'done';
}

function startTurn(
  state: WorkspaceState,
  outgoing: Outgoing,
  now: number
): WorkspaceState {
  const seedId = seedIdFor(state.turns, outgoing.text);
  const stage = openingStageOf(seedId);
  const turn: Turn = {
    id: `turn-${state.turns.length + 1}`,
    seedId,
    text: outgoing.text,
    attachments: outgoing.attachments,
    toolIds: outgoing.toolIds,
    skillIds: outgoing.skillIds,
    effort: outgoing.effort,
    stage,
    steps: [],
    decision: null,
    startedAt: now,
  };
  if (stage === 'done') {
    turn.endedAt = now;
  }
  return { ...state, turns: [...state.turns, turn] };
}

/** A turn that ends hands the floor to the first message that waited for it. */
function drainQueue(state: WorkspaceState, now: number): WorkspaceState {
  let next = state;
  while (next.queue.length > 0 && !isBusy(next)) {
    const [head, ...rest] = next.queue;
    next = startTurn({ ...next, queue: rest }, head, now);
  }
  return next;
}

function refused(state: WorkspaceState, hint: Hint): WorkspaceState {
  const refusals = state.refusals + 1;
  return { ...state, hint, refusals };
}

function outgoingOf(state: WorkspaceState, text: string): Outgoing {
  return {
    id: `message-${state.sentCount + 1}`,
    text,
    attachments: state.attachments,
    toolIds: state.toolIds,
    skillIds: state.skillIds,
    effort: state.effort,
  };
}

function cleared(state: WorkspaceState): WorkspaceState {
  const sentCount = state.sentCount + 1;
  return { ...state, draft: '', attachments: [], hint: 'none', sentCount };
}

function sent(state: WorkspaceState, now: number): WorkspaceState {
  const text = sendableTextOf(state);
  if (text === null) {
    return state;
  }
  if (state.activeId === NEW_ID) {
    const newLines = [...state.newLines, text];
    return { ...cleared(state), newLines };
  }
  const outgoing = outgoingOf(state, text);
  if (!isBusy(state)) {
    return startTurn(cleared(state), outgoing, now);
  }
  if (state.queue.length >= MAX_QUEUED) {
    return refused(state, 'queue');
  }
  return { ...cleared(state), queue: [...state.queue, outgoing] };
}

function attached(state: WorkspaceState, added: Attachment[]): WorkspaceState {
  const room = MAX_ATTACHMENTS - state.attachments.length;
  const accepted = added.slice(0, room);
  const attachments = [...state.attachments, ...accepted];
  const hasOverflow = added.length > room;
  if (hasOverflow) {
    return refused({ ...state, attachments }, 'attachments');
  }
  return { ...state, attachments, hint: 'none' };
}

function toggled<Id extends string>(ids: Id[], id: Id) {
  if (ids.includes(id)) {
    return ids.filter((candidate) => candidate !== id);
  }
  return [...ids, id];
}

function patchedTurn(
  state: WorkspaceState,
  index: number,
  change: (turn: Turn) => Turn
): WorkspaceState {
  const turn = state.turns[index];
  if (!turn) {
    return state;
  }
  const turns = state.turns.map((candidate, position) => {
    if (position !== index) {
      return candidate;
    }
    return change(candidate);
  });
  return { ...state, turns };
}

function patchedSteps(
  turn: Turn,
  id: StepId,
  change: (run: StepRun) => StepRun
) {
  return turn.steps.map((run) => {
    if (run.id !== id) {
      return run;
    }
    return change(run);
  });
}

function stepOf(turn: Turn, id: StepId) {
  return turn.steps.find((run) => run.id === id);
}

function costOf(usd: number, effort: Effort) {
  return usd * EFFORT_RATE[effort];
}

function withCost(state: WorkspaceState, usd: number): WorkspaceState {
  return { ...state, costUsd: state.costUsd + usd };
}

function thoughtDone(
  state: WorkspaceState,
  index: number,
  now: number
): WorkspaceState {
  const turn = state.turns[index];
  if (turn?.stage !== 'thinking') {
    return state;
  }
  const moved = patchedTurn(state, index, (current) => ({
    ...current,
    stage: 'working',
    thoughtEndedAt: now,
  }));
  return withCost(moved, costOf(THOUGHT_USD, turn.effort));
}

function stepStarted(
  state: WorkspaceState,
  index: number,
  id: StepId,
  now: number
): WorkspaceState {
  const turn = state.turns[index];
  if (turn?.stage !== 'working') {
    return state;
  }
  const seed = seedOf(turn.seedId);
  const belongs = seed.steps.some((step) => step.id === id);
  const isKnown = stepOf(turn, id) !== undefined;
  if (!belongs || isKnown) {
    return state;
  }
  return patchedTurn(state, index, (current) => {
    const run: StepRun = { id, status: 'running', startedAt: now };
    return { ...current, steps: [...current.steps, run] };
  });
}

function stepDone(
  state: WorkspaceState,
  index: number,
  id: StepId,
  now: number
): WorkspaceState {
  const turn = state.turns[index];
  const isLive = turn?.stage === 'working' || turn?.stage === 'answering';
  const run = turn && stepOf(turn, id);
  if (!isLive || run?.status !== 'running') {
    return state;
  }
  const moved = patchedTurn(state, index, (current) => ({
    ...current,
    steps: patchedSteps(current, id, (candidate) => ({
      ...candidate,
      status: 'done',
      endedAt: now,
    })),
  }));
  return withCost(moved, costOf(stepSeedOf(id).usd, turn.effort));
}

function asked(state: WorkspaceState, index: number): WorkspaceState {
  const turn = state.turns[index];
  const run = turn && stepOf(turn, 'reminders');
  if (turn?.stage !== 'working' || run?.status !== 'running') {
    return state;
  }
  return patchedTurn(state, index, (current) => ({
    ...current,
    stage: 'asking',
    steps: patchedSteps(current, 'reminders', (candidate) => ({
      ...candidate,
      status: 'waiting',
    })),
  }));
}

function askingIndexOf(state: WorkspaceState) {
  return state.turns.findIndex((turn) => turn.stage === 'asking');
}

function decided(
  state: WorkspaceState,
  decision: Decision,
  now: number
): WorkspaceState {
  const index = askingIndexOf(state);
  if (index < 0) {
    return state;
  }
  if (decision === 'approved') {
    return patchedTurn(state, index, (current) => ({
      ...current,
      stage: 'working',
      decision,
      steps: patchedSteps(current, 'reminders', (candidate) => ({
        ...candidate,
        status: 'running',
      })),
    }));
  }
  const declined = patchedTurn(state, index, (current) => ({
    ...current,
    stage: 'declined',
    decision,
    endedAt: now,
    steps: patchedSteps(current, 'reminders', (candidate) => ({
      ...candidate,
      status: 'skipped',
      endedAt: now,
    })),
  }));
  return drainQueue(declined, now);
}

function answering(state: WorkspaceState, index: number): WorkspaceState {
  const turn = state.turns[index];
  if (turn?.stage !== 'working') {
    return state;
  }
  return patchedTurn(state, index, (current) => ({
    ...current,
    stage: 'answering',
  }));
}

function answered(
  state: WorkspaceState,
  index: number,
  now: number
): WorkspaceState {
  const turn = state.turns[index];
  if (turn?.stage !== 'answering') {
    return state;
  }
  const moved = patchedTurn(state, index, (current) => ({
    ...current,
    stage: 'done',
    endedAt: now,
  }));
  const paid = withCost(moved, costOf(ANSWER_USD, turn.effort));
  return drainQueue(paid, now);
}

function newSessionTarget(state: WorkspaceState) {
  if (state.turns.length === 0) {
    return LIVE_ID;
  }
  return NEW_ID;
}

function sessionOpened(state: WorkspaceState, id: string): WorkspaceState {
  return { ...state, activeId: id, isSidebarOpen: false };
}

export function applyAt(
  state: WorkspaceState,
  action: WorkspaceAction,
  now: number
): WorkspaceState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text, hint: 'none' };
    case 'attached':
      return attached(state, action.attachments);
    case 'detached': {
      const attachments = state.attachments.filter(
        (file) => file.id !== action.id
      );
      return { ...state, attachments, hint: 'none' };
    }
    case 'toolToggled':
      return { ...state, toolIds: toggled(state.toolIds, action.id) };
    case 'skillToggled':
      return { ...state, skillIds: toggled(state.skillIds, action.id) };
    case 'effortSet':
      return { ...state, effort: action.effort };
    case 'sent':
      return sent(state, now);
    case 'queueRemoved': {
      const queue = state.queue.filter((item) => item.id !== action.id);
      return { ...state, queue, hint: 'none' };
    }
    case 'thoughtDone':
      return thoughtDone(state, action.turn, now);
    case 'stepStarted':
      return stepStarted(state, action.turn, action.id, now);
    case 'stepDone':
      return stepDone(state, action.turn, action.id, now);
    case 'asked':
      return asked(state, action.turn);
    case 'decided':
      return decided(state, action.decision, now);
    case 'answering':
      return answering(state, action.turn);
    case 'answered':
      return answered(state, action.turn, now);
    case 'sidebar':
      return { ...state, isSidebarOpen: action.isOpen };
    case 'searched':
      return { ...state, search: action.text };
    case 'sessionOpened':
      return sessionOpened(state, action.id);
    case 'newSession':
      return sessionOpened(state, newSessionTarget(state));
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: WorkspaceState, action: WorkspaceAction) {
  return applyAt(state, action, Date.now());
}

function hasStarted(state: WorkspaceState) {
  return state.turns.length > 0;
}

function hasDecided(state: WorkspaceState) {
  return askingIndexOf(state) < 0;
}

export const WORD_MS = 55;

export const ANSWER_WORD_MS = 45;

/** A stream is given a little longer than its words need, so its last word lands before the next step. */
const STREAM_MARGIN_MS = 200;

const KEY_MS = 40;

const DEMO_DECIDES_AFTER_MS = 2500;

export const THOUGHT_MS = THOUGHT_WORDS.length * WORD_MS + STREAM_MARGIN_MS;

function streamMsOf(text: string) {
  const count = wordsOf(text).length;
  return count * ANSWER_WORD_MS + STREAM_MARGIN_MS;
}

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', text: typed },
  }));
}

function frame(after: number, actions: WorkspaceAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function started(turn: number, id: StepId): WorkspaceAction {
  return { type: 'stepStarted', turn, id };
}

function done(turn: number, id: StepId): WorkspaceAction {
  return { type: 'stepDone', turn, id };
}

function demoStep(
  after: number,
  action: WorkspaceAction,
  press?: string
): Step {
  return { after, by: 'demo', action, press };
}

function toolSteps(): Step[] {
  return DEMO_TOOLS.map((id, index) => {
    const after = keyDelayOf(index, 800, 450);
    const press = pressOf(index);
    return demoStep(after, { type: 'toolToggled', id }, press);
  });
}

function pressOf(index: number) {
  if (index === 0) {
    return 'tools';
  }
  return undefined;
}

const EFFORT_DRAG: Step[] = [
  demoStep(800, { type: 'effortSet', effort: 4 }, 'effort'),
  demoStep(260, { type: 'effortSet', effort: 5 }),
  demoStep(700, { type: 'effortSet', effort: DEMO_EFFORT }),
];

const OPENING: Step[] = [
  ...typingSteps(QUESTION, 900),
  demoStep(700, { type: 'attached', attachments: [DEMO_PHOTO] }, 'attach'),
  demoStep(900, { type: 'attached', attachments: [DEMO_FILE] }, 'attach'),
  ...toolSteps(),
  demoStep(500, { type: 'skillToggled', id: DEMO_SKILL }),
  ...EFFORT_DRAG,
  {
    after: 900,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasStarted,
  },
  frame(THOUGHT_MS, [{ type: 'thoughtDone', turn: 0 }, started(0, 'invoices')]),
  frame(1100, [done(0, 'invoices'), started(0, 'match')]),
  ...typingSteps(FOLLOW_UP, 500),
  demoStep(600, { type: 'sent' }, 'send'),
  frame(500, [done(0, 'match'), started(0, 'contacts')]),
  frame(1000, [
    done(0, 'contacts'),
    started(0, 'reminders'),
    { type: 'asked', turn: 0 },
  ]),
];

const UNPAID_ANSWER_MS = streamMsOf(seedOf('unpaid').answer);

const SHARE_ANSWER_MS = streamMsOf(seedOf('share').answer);

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  frame(1400, [done(0, 'reminders'), { type: 'answering', turn: 0 }]),
  frame(UNPAID_ANSWER_MS, [{ type: 'answered', turn: 0 }]),
  frame(700, [started(1, 'share')]),
  frame(1200, [done(1, 'share'), { type: 'answering', turn: 1 }]),
  frame(SHARE_ANSWER_MS, [{ type: 'answered', turn: 1 }]),
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const ASKED = restingOf(INITIAL, OPENING, applyAt);

/** Under reduced motion the agent waits on its request, with the composer filled in and a follow-up in the queue. */
export const RESTING: WorkspaceState = {
  ...ASKED,
  isSidebarOpen: false,
};

export const LOOP_AFTER_MS = 3600;
