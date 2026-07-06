import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  ANSWER_TOKENS,
  ANSWER_USAGE,
  callSeedOf,
  DEMO_MODEL,
  LIVE_ID,
  modelOf,
  NEW_ID,
  PLAN,
  planSeedOf,
  QUESTION,
  STARTING_MODEL,
  THOUGHT_USAGE,
  THOUGHT_WORDS,
  type CallId,
  type ModelId,
  type StepId,
} from './data';

export type Stage =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'asking'
  | 'answering'
  | 'done'
  | 'declined'
  | 'stopped';

export type Decision = 'approved' | 'denied';

export type StepStatus =
  'upcoming' | 'running' | 'waiting' | 'done' | 'skipped';

export type PlanRun = {
  id: StepId;
  status: StepStatus;
  startedAt?: number;
  endedAt?: number;
};

export type CallStatus = 'running' | 'waiting' | 'done' | 'skipped';

export type CallRun = {
  id: CallId;
  status: CallStatus;
  startedAt: number;
  endedAt?: number;
};

export type Tokens = {
  input: number;
  output: number;
};

export type ChatState = {
  activeId: string;
  draft: string;
  model: ModelId;
  runModel: ModelId;
  question: string | null;
  followUps: string[];
  newLines: string[];
  stage: Stage;
  stoppedFrom: Stage | null;
  decision: Decision | null;
  plan: PlanRun[];
  calls: CallRun[];
  tokens: Tokens;
  costUsd: number;
  startedAt?: number;
  thoughtEndedAt?: number;
  endedAt?: number;
  demoLitSource: number | null;
  isPanelOpen: boolean;
  isDetailsSheetOpen: boolean;
  isSidebarCollapsed: boolean;
  isSidebarSheetOpen: boolean;
  search: string;
};

export type ChatAction =
  | { type: 'typed'; text: string }
  | { type: 'sent' }
  | { type: 'modelSet'; model: ModelId }
  | { type: 'thoughtDone' }
  | { type: 'stepStarted'; id: StepId }
  | { type: 'stepDone'; id: StepId }
  | { type: 'asked' }
  | { type: 'decided'; decision: Decision }
  | { type: 'answering' }
  | { type: 'answered' }
  | { type: 'stopped' }
  | { type: 'lit'; source: number | null }
  | { type: 'panel'; isOpen: boolean }
  | { type: 'detailsSheet'; isOpen: boolean }
  | { type: 'sidebarCollapsed'; isCollapsed: boolean }
  | { type: 'sidebarSheet'; isOpen: boolean }
  | { type: 'searched'; text: string }
  | { type: 'chatOpened'; id: string }
  | { type: 'newChat' }
  | { type: 'batch'; actions: ChatAction[] };

type Step = SessionStep<ChatState, ChatAction>;

export const INITIAL: ChatState = {
  activeId: LIVE_ID,
  draft: '',
  model: STARTING_MODEL,
  runModel: STARTING_MODEL,
  question: null,
  followUps: [],
  newLines: [],
  stage: 'idle',
  stoppedFrom: null,
  decision: null,
  plan: [],
  calls: [],
  tokens: { input: 0, output: 0 },
  costUsd: 0,
  demoLitSource: null,
  isPanelOpen: true,
  isDetailsSheetOpen: false,
  isSidebarCollapsed: false,
  isSidebarSheetOpen: false,
  search: '',
};

const BUSY_STAGES: Stage[] = ['thinking', 'working', 'asking', 'answering'];

const OVER_STAGES: Stage[] = ['done', 'declined', 'stopped'];

const WORKING_STAGES: Stage[] = ['working', 'answering'];

export function isBusy(stage: Stage) {
  return BUSY_STAGES.includes(stage);
}

export function isOver(stage: Stage) {
  return OVER_STAGES.includes(stage);
}

const WRITABLE_CHATS = [LIVE_ID, NEW_ID];

export function isReadOnly(state: ChatState) {
  return !WRITABLE_CHATS.includes(state.activeId);
}

/** The answer shows from its first word, and stays when the run was stopped halfway through it. */
export function showsAnswerOf(state: ChatState) {
  if (state.stage === 'stopped') {
    return state.stoppedFrom === 'answering';
  }
  const answerStages: Stage[] = ['answering', 'done'];
  return answerStages.includes(state.stage);
}

export type RequestView =
  'none' | 'asking' | 'reading' | 'read' | 'denied' | 'unanswered';

export function requestViewOf(state: ChatState): RequestView {
  if (state.stage === 'asking') {
    return 'asking';
  }
  if (state.decision === 'denied') {
    return 'denied';
  }
  if (state.decision === 'approved') {
    const call = state.calls.find((candidate) => candidate.id === 'rates');
    if (call?.status === 'done') {
      return 'read';
    }
    return 'reading';
  }
  if (state.stoppedFrom === 'asking') {
    return 'unanswered';
  }
  return 'none';
}

function trimmedQuestionOf(draft: string) {
  const trimmed = draft.trim();
  if (trimmed === '') {
    return null;
  }
  const isUnfinishedDemo = QUESTION.startsWith(trimmed);
  if (isUnfinishedDemo) {
    return QUESTION;
  }
  return trimmed;
}

/**
 * What Send would post now: the first question of the live chat (a person who takes over halfway
 * through the demonstration question sends the whole of it), a follow-up once the run is over, a
 * line in a new chat. Null while the agent works or when there is nothing to send.
 */
export function sendableTextOf(state: ChatState) {
  if (isReadOnly(state)) {
    return null;
  }
  if (state.activeId === NEW_ID) {
    const line = state.draft.trim();
    if (line === '') {
      return null;
    }
    return line;
  }
  if (state.question === null) {
    return trimmedQuestionOf(state.draft);
  }
  const text = state.draft.trim();
  const canFollowUp = isOver(state.stage) && text !== '';
  if (canFollowUp) {
    return text;
  }
  return null;
}

function sent(state: ChatState, now: number): ChatState {
  const text = sendableTextOf(state);
  if (text === null) {
    return state;
  }
  if (state.activeId === NEW_ID) {
    return { ...state, draft: '', newLines: [...state.newLines, text] };
  }
  if (state.question === null) {
    return {
      ...state,
      draft: '',
      question: text,
      runModel: state.model,
      stage: 'thinking',
      startedAt: now,
    };
  }
  return { ...state, draft: '', followUps: [...state.followUps, text] };
}

function costOf(model: ModelId, tokens: Tokens) {
  const total = tokens.input + tokens.output;
  const thousands = total / 1000;
  return thousands * modelOf(model).usdPerThousandTokens;
}

function withUsage(state: ChatState, usage: Tokens): ChatState {
  const tokens = {
    input: state.tokens.input + usage.input,
    output: state.tokens.output + usage.output,
  };
  const costUsd = state.costUsd + costOf(state.runModel, usage);
  return { ...state, tokens, costUsd };
}

function thoughtDone(state: ChatState, now: number): ChatState {
  if (state.stage !== 'thinking') {
    return state;
  }
  const plan: PlanRun[] = PLAN.map((seed) => ({
    id: seed.id,
    status: 'upcoming',
  }));
  const thought: ChatState = {
    ...state,
    plan,
    stage: 'working',
    thoughtEndedAt: now,
  };
  return withUsage(thought, THOUGHT_USAGE);
}

function planRunOf(state: ChatState, id: StepId) {
  return state.plan.find((run) => run.id === id);
}

function hasCall(state: ChatState, id: CallId) {
  return state.calls.some((call) => call.id === id);
}

function patchedPlan(
  state: ChatState,
  id: StepId,
  change: (run: PlanRun) => PlanRun
) {
  return state.plan.map((run) => {
    if (run.id !== id) {
      return run;
    }
    return change(run);
  });
}

function patchedCalls(
  state: ChatState,
  id: CallId,
  change: (call: CallRun) => CallRun
) {
  return state.calls.map((call) => {
    if (call.id !== id) {
      return call;
    }
    return change(call);
  });
}

function stepStarted(state: ChatState, id: StepId, now: number): ChatState {
  const isWorking = WORKING_STAGES.includes(state.stage);
  const run = planRunOf(state, id);
  const isUpcoming = run?.status === 'upcoming';
  if (!isWorking || !isUpcoming) {
    return state;
  }
  const plan = patchedPlan(state, id, (current) => ({
    ...current,
    status: 'running',
    startedAt: now,
  }));
  const callId = planSeedOf(id).callId;
  if (callId === undefined) {
    return { ...state, plan };
  }
  if (hasCall(state, callId)) {
    return { ...state, plan };
  }
  const call: CallRun = { id: callId, status: 'running', startedAt: now };
  return { ...state, plan, calls: [...state.calls, call] };
}

function stepDone(state: ChatState, id: StepId, now: number): ChatState {
  const isWorking = WORKING_STAGES.includes(state.stage);
  const run = planRunOf(state, id);
  const isRunning = run?.status === 'running';
  if (!isWorking || !isRunning) {
    return state;
  }
  const plan = patchedPlan(state, id, (current) => ({
    ...current,
    status: 'done',
    endedAt: now,
  }));
  const callId = planSeedOf(id).callId;
  if (callId === undefined) {
    return { ...state, plan };
  }
  const calls = patchedCalls(state, callId, (current) => ({
    ...current,
    status: 'done',
    endedAt: now,
  }));
  const seed = callSeedOf(callId);
  const usage = { input: seed.inputTokens, output: seed.outputTokens };
  return withUsage({ ...state, plan, calls }, usage);
}

function asked(state: ChatState): ChatState {
  if (state.stage !== 'working') {
    return state;
  }
  const plan = patchedPlan(state, 'rates', (run) => ({
    ...run,
    status: 'waiting',
  }));
  const calls = patchedCalls(state, 'rates', (call) => ({
    ...call,
    status: 'waiting',
  }));
  return { ...state, stage: 'asking', plan, calls };
}

function skippedRest(state: ChatState, now: number): ChatState {
  const plan = state.plan.map((run) => {
    if (run.status === 'done') {
      return run;
    }
    const skipped: PlanRun = { ...run, status: 'skipped', endedAt: now };
    return skipped;
  });
  const calls = state.calls.map((call) => {
    if (call.status === 'done') {
      return call;
    }
    const skipped: CallRun = { ...call, status: 'skipped', endedAt: now };
    return skipped;
  });
  return { ...state, plan, calls, endedAt: now };
}

function decided(state: ChatState, decision: Decision, now: number): ChatState {
  if (state.stage !== 'asking') {
    return state;
  }
  if (decision === 'denied') {
    const declined: ChatState = { ...state, stage: 'declined', decision };
    return skippedRest(declined, now);
  }
  const plan = patchedPlan(state, 'rates', (run) => ({
    ...run,
    status: 'running',
  }));
  const calls = patchedCalls(state, 'rates', (call) => ({
    ...call,
    status: 'running',
  }));
  return { ...state, stage: 'working', decision, plan, calls };
}

function answering(state: ChatState): ChatState {
  if (state.stage !== 'working') {
    return state;
  }
  return { ...state, stage: 'answering' };
}

function answered(state: ChatState, now: number): ChatState {
  if (state.stage !== 'answering') {
    return state;
  }
  const finished: ChatState = { ...state, stage: 'done', endedAt: now };
  return withUsage(finished, ANSWER_USAGE);
}

function stopped(state: ChatState, now: number): ChatState {
  if (!isBusy(state.stage)) {
    return state;
  }
  const halted = skippedRest(state, now);
  const thoughtEndedAt = state.thoughtEndedAt ?? now;
  return {
    ...halted,
    stage: 'stopped',
    stoppedFrom: state.stage,
    thoughtEndedAt,
  };
}

function newChatTarget(state: ChatState) {
  if (state.question === null) {
    return LIVE_ID;
  }
  return NEW_ID;
}

function chatOpened(state: ChatState, id: string): ChatState {
  return { ...state, activeId: id, isSidebarSheetOpen: false };
}

export function applyAt(
  state: ChatState,
  action: ChatAction,
  now: number
): ChatState {
  switch (action.type) {
    case 'typed':
      return { ...state, draft: action.text };
    case 'sent':
      return sent(state, now);
    case 'modelSet':
      return { ...state, model: action.model };
    case 'thoughtDone':
      return thoughtDone(state, now);
    case 'stepStarted':
      return stepStarted(state, action.id, now);
    case 'stepDone':
      return stepDone(state, action.id, now);
    case 'asked':
      return asked(state);
    case 'decided':
      return decided(state, action.decision, now);
    case 'answering':
      return answering(state);
    case 'answered':
      return answered(state, now);
    case 'stopped':
      return stopped(state, now);
    case 'lit':
      return { ...state, demoLitSource: action.source };
    case 'panel':
      return { ...state, isPanelOpen: action.isOpen };
    case 'detailsSheet':
      return { ...state, isDetailsSheetOpen: action.isOpen };
    case 'sidebarCollapsed':
      return { ...state, isSidebarCollapsed: action.isCollapsed };
    case 'sidebarSheet':
      return { ...state, isSidebarSheetOpen: action.isOpen };
    case 'searched':
      return { ...state, search: action.text };
    case 'chatOpened':
      return chatOpened(state, action.id);
    case 'newChat':
      return chatOpened(state, newChatTarget(state));
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = applyAt(next, inner, now);
      }
      return next;
    }
  }
}

export function reducer(state: ChatState, action: ChatAction) {
  return applyAt(state, action, Date.now());
}

function hasAsked(state: ChatState) {
  return state.question !== null;
}

/** Whoever answers the request, or a run that ended before it, leaves the stage `asking`. */
function hasDecided(state: ChatState) {
  return state.stage !== 'asking';
}

export const WORD_MS = 55;

export const ANSWER_WORD_MS = 45;

/** A stream is given a little longer than its words need, so its last word lands before the next step. */
const STREAM_MARGIN_MS = 200;

const KEY_MS = 40;

const DEMO_DECIDES_AFTER_MS = 2500;

const THOUGHT_MS = THOUGHT_WORDS.length * WORD_MS + STREAM_MARGIN_MS;

const ANSWER_MS = ANSWER_TOKENS.length * ANSWER_WORD_MS + STREAM_MARGIN_MS;

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', text: typed },
  }));
}

function frame(after: number, actions: ChatAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function started(id: StepId): ChatAction {
  return { type: 'stepStarted', id };
}

function done(id: StepId): ChatAction {
  return { type: 'stepDone', id };
}

function lit(after: number, source: number | null): Step {
  return { after, by: 'demo', action: { type: 'lit', source } };
}

function detailsSheet(after: number, isOpen: boolean): Step {
  return { after, by: 'demo', action: { type: 'detailsSheet', isOpen } };
}

/** On a narrow page the run details live in a sheet, which the demonstration opens and closes as a person would. */
const OPENING: Step[] = [
  {
    after: 900,
    by: 'demo',
    action: { type: 'modelSet', model: DEMO_MODEL },
  },
  ...typingSteps(QUESTION, 900),
  {
    after: 500,
    by: 'person',
    press: 'send',
    action: { type: 'sent' },
    isAnswered: hasAsked,
  },
  frame(THOUGHT_MS, [{ type: 'thoughtDone' }, started('booking')]),
  detailsSheet(700, true),
  frame(1200, [done('booking'), started('sailings')]),
  frame(1200, [done('sailings'), started('rates')]),
  detailsSheet(500, false),
  frame(700, [{ type: 'asked' }]),
];

const CLOSING: Step[] = [
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasDecided,
  },
  frame(1400, [done('rates'), started('customs')]),
  frame(1200, [done('customs'), started('answer'), { type: 'answering' }]),
  frame(ANSWER_MS, [done('answer'), { type: 'answered' }]),
  lit(800, 1),
  lit(600, 2),
  lit(600, 3),
  lit(600, 4),
  lit(500, null),
];

export const SCRIPT: Step[] = [...OPENING, ...CLOSING];

const ASKED = restingOf(INITIAL, OPENING, applyAt);

/** Under reduced motion the run waits on its request: the steps before it are done and the request to read the rates shows. */
export const RESTING: ChatState = {
  ...ASKED,
  isDetailsSheetOpen: false,
  demoLitSource: null,
};

export const LOOP_AFTER_MS = 3600;
