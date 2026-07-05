import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  DEMO_INSTRUCTIONS,
  DEMO_QUESTION,
  FIRST_FILES,
  INSTRUCTIONS_LIMIT,
  LIVE_CONFIG,
  LIVE_VERSION,
  modelOf,
  REPLY_WITH_REFUND,
  REPLY_WITHOUT_ORDERS,
  REPLY_WITHOUT_REFUND,
  SAMPLE_FILES,
  SAMPLES,
  TOOLS,
  type AgentConfig,
  type KnowledgeFile,
  type ModelId,
  type Sample,
  type ToolId,
} from './data';

export type View = 'configure' | 'test';

export type LiveFile = KnowledgeFile & {
  /** From 0 to 100 while it uploads; 100 once it is indexed. */
  progress: number;
};

export type ChatTurn = {
  id: number;
  role: 'person' | 'agent';
  text: string;
  /** The tool the agent used before it answered. */
  tool?: string;
};

export type SampleStatus = 'queued' | 'running' | 'pass' | 'fail';

export type PublishStatus = 'idle' | 'pending' | 'failed' | 'done';

export type BuilderState = {
  /** What the live version runs with: the draft is compared with it. */
  live: AgentConfig;
  liveVersion: number;
  name: string;
  view: View;
  modelId: ModelId;
  instructions: string;
  tools: Record<ToolId, boolean>;
  files: LiveFile[];
  draft: string;
  turns: ChatTurn[];
  isAnswering: boolean;
  isReviewOpen: boolean;
  samples: SampleStatus[];
  publish: PublishStatus;
  attempts: number;
};

export type BuilderAction =
  | { type: 'named'; text: string }
  | { type: 'view'; view: View }
  | { type: 'model'; id: ModelId }
  | { type: 'instructed'; text: string }
  | { type: 'toolSet'; id: ToolId; isOn: boolean }
  | { type: 'fileAdded' }
  | { type: 'fileProgress'; id: string; progress: number }
  | { type: 'fileRemoved'; id: string }
  | { type: 'chatTyped'; text: string }
  | { type: 'chatSent' }
  | { type: 'answered' }
  | { type: 'reviewOpened' }
  | { type: 'reviewClosed' }
  | { type: 'sampleRan' }
  | { type: 'publish' }
  | { type: 'publishSettled' };

type Step = SessionStep<BuilderState, BuilderAction>;

const QUEUED: SampleStatus[] = SAMPLES.map(() => 'queued');

function indexedOf(file: KnowledgeFile): LiveFile {
  return { ...file, progress: 100 };
}

export const INITIAL: BuilderState = {
  live: LIVE_CONFIG,
  liveVersion: LIVE_VERSION,
  name: LIVE_CONFIG.name,
  view: 'configure',
  modelId: LIVE_CONFIG.modelId,
  instructions: LIVE_CONFIG.instructions,
  tools: LIVE_CONFIG.tools,
  files: FIRST_FILES.map(indexedOf),
  draft: '',
  turns: [],
  isAnswering: false,
  isReviewOpen: false,
  samples: QUEUED,
  publish: 'idle',
  attempts: 0,
};

export function isIndexed(file: LiveFile) {
  return file.progress >= 100;
}

export function nextSampleFileOf(state: BuilderState) {
  return SAMPLE_FILES.find((sample) => {
    const isAdded = state.files.some((file) => file.id === sample.id);
    return !isAdded;
  });
}

function onOffOf(isOn: boolean) {
  if (isOn) {
    return 'on';
  }
  return 'off';
}

function filesWordOf(count: number) {
  if (count === 1) {
    return '1 file';
  }
  return `${count} files`;
}

function instructionChangeOf(before: string, after: string) {
  const difference = after.length - before.length;
  if (difference > 0) {
    return `Instructions: ${difference} characters added`;
  }
  if (difference < 0) {
    return `Instructions: ${Math.abs(difference)} characters removed`;
  }
  return 'Instructions: reworded';
}

function fileChangesOf(before: string[], files: LiveFile[]) {
  const after = files.map((file) => file.id);
  const added = after.filter((id) => !before.includes(id));
  const removed = before.filter((id) => !after.includes(id));
  const changes: string[] = [];
  if (added.length > 0) {
    changes.push(`Knowledge: ${filesWordOf(added.length)} added`);
  }
  if (removed.length > 0) {
    changes.push(`Knowledge: ${filesWordOf(removed.length)} removed`);
  }
  return changes;
}

/** What the draft changes against the live version, one short line per change. */
export function changesOf(state: BuilderState) {
  const live = state.live;
  const changes: string[] = [];
  if (state.name.trim() !== live.name) {
    changes.push(`Name: ${state.name.trim()}`);
  }
  if (state.modelId !== live.modelId) {
    const before = modelOf(live.modelId).name;
    const after = modelOf(state.modelId).name;
    changes.push(`Model: ${before} to ${after}`);
  }
  if (state.instructions !== live.instructions) {
    changes.push(instructionChangeOf(live.instructions, state.instructions));
  }
  for (const tool of TOOLS) {
    const isOn = state.tools[tool.id];
    if (isOn !== live.tools[tool.id]) {
      changes.push(`${tool.name}: switched ${onOffOf(isOn)}`);
    }
  }
  const fileChanges = fileChangesOf(live.fileIds, state.files);
  return [...changes, ...fileChanges];
}

/** A sample passes when the agent has the tool the prompt needs. */
function resultOf(
  sample: Sample,
  tools: Record<ToolId, boolean>
): SampleStatus {
  const hasTool = sample.needs === undefined || tools[sample.needs];
  if (hasTool) {
    return 'pass';
  }
  return 'fail';
}

export function haveSamplesRun(state: BuilderState) {
  return state.samples.every((status) => {
    const hasPassed = status === 'pass';
    const hasFailed = status === 'fail';
    return hasPassed || hasFailed;
  });
}

export function failedSampleCountOf(state: BuilderState) {
  const failed = state.samples.filter((status) => status === 'fail');
  return failed.length;
}

/** One tick of the sample run: the running sample gets its result and the next one starts. */
function sampleRan(state: BuilderState): BuilderState {
  if (!state.isReviewOpen) {
    return state;
  }
  const running = state.samples.indexOf('running');
  const samples = [...state.samples];
  if (running !== -1) {
    samples[running] = resultOf(SAMPLES[running], state.tools);
  }
  const next = samples.indexOf('queued');
  if (next !== -1) {
    samples[next] = 'running';
  }
  return { ...state, samples };
}

function replyOf(tools: Record<ToolId, boolean>): Omit<ChatTurn, 'id'> {
  if (!tools.orders) {
    return { role: 'agent', text: REPLY_WITHOUT_ORDERS };
  }
  if (!tools.refunds) {
    return {
      role: 'agent',
      text: REPLY_WITHOUT_REFUND,
      tool: 'Looked up order SB-20418',
    };
  }
  return {
    role: 'agent',
    text: REPLY_WITH_REFUND,
    tool: 'Looked up order SB-20418, refunded $18.90',
  };
}

function chatSent(state: BuilderState): BuilderState {
  const text = state.draft.trim();
  const canSend = text !== '' && !state.isAnswering;
  if (!canSend) {
    return state;
  }
  const turn: ChatTurn = { id: state.turns.length, role: 'person', text };
  return {
    ...state,
    draft: '',
    turns: [...state.turns, turn],
    isAnswering: true,
  };
}

function answered(state: BuilderState): BuilderState {
  if (!state.isAnswering) {
    return state;
  }
  const reply = replyOf(state.tools);
  const turn: ChatTurn = { id: state.turns.length, ...reply };
  return { ...state, turns: [...state.turns, turn], isAnswering: false };
}

function fileAdded(state: BuilderState): BuilderState {
  const sample = nextSampleFileOf(state);
  if (!sample) {
    return state;
  }
  return { ...state, files: [...state.files, { ...sample, progress: 0 }] };
}

function fileProgress(
  state: BuilderState,
  id: string,
  progress: number
): BuilderState {
  const files = state.files.map((file) => {
    const isAhead = file.id === id && progress > file.progress;
    if (isAhead) {
      return { ...file, progress };
    }
    return file;
  });
  return { ...state, files };
}

export function canPublish(state: BuilderState) {
  const hasChanges = changesOf(state).length > 0;
  const isReady = state.isReviewOpen && haveSamplesRun(state);
  return hasChanges && isReady;
}

function publish(state: BuilderState): BuilderState {
  const canStart = state.publish === 'idle' || state.publish === 'failed';
  if (!canStart || !canPublish(state)) {
    return state;
  }
  return { ...state, publish: 'pending', attempts: state.attempts + 1 };
}

function liveConfigOf(state: BuilderState): AgentConfig {
  return {
    name: state.name.trim(),
    modelId: state.modelId,
    instructions: state.instructions,
    tools: state.tools,
    fileIds: state.files.map((file) => file.id),
  };
}

/** The first attempt of a session fails, so the retry can be seen; the next one goes through. */
function publishSettled(state: BuilderState): BuilderState {
  if (state.publish !== 'pending') {
    return state;
  }
  if (state.attempts === 1) {
    return { ...state, publish: 'failed' };
  }
  return {
    ...state,
    publish: 'done',
    live: liveConfigOf(state),
    liveVersion: state.liveVersion + 1,
  };
}

function reviewOpened(state: BuilderState): BuilderState {
  const isBusy = state.publish === 'pending';
  if (state.isReviewOpen || isBusy) {
    return state;
  }
  return { ...state, isReviewOpen: true, samples: QUEUED, publish: 'idle' };
}

function reviewClosed(state: BuilderState): BuilderState {
  if (state.publish === 'pending') {
    return state;
  }
  return { ...state, isReviewOpen: false };
}

export function reducer(
  state: BuilderState,
  action: BuilderAction
): BuilderState {
  switch (action.type) {
    case 'named':
      return { ...state, name: action.text };
    case 'view':
      return { ...state, view: action.view };
    case 'model':
      return { ...state, modelId: action.id };
    case 'instructed':
      return {
        ...state,
        instructions: action.text.slice(0, INSTRUCTIONS_LIMIT),
      };
    case 'toolSet':
      return { ...state, tools: { ...state.tools, [action.id]: action.isOn } };
    case 'fileAdded':
      return fileAdded(state);
    case 'fileProgress':
      return fileProgress(state, action.id, action.progress);
    case 'fileRemoved':
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.id),
      };
    case 'chatTyped':
      return { ...state, draft: action.text };
    case 'chatSent':
      return chatSent(state);
    case 'answered':
      return answered(state);
    case 'reviewOpened':
      return reviewOpened(state);
    case 'reviewClosed':
      return reviewClosed(state);
    case 'sampleRan':
      return sampleRan(state);
    case 'publish':
      return publish(state);
    case 'publishSettled':
      return publishSettled(state);
  }
}

const CHUNK = 4;

function delayOfChunk(index: number, startAfter: number) {
  if (index === 0) {
    return startAfter;
  }
  return 60;
}

function typingSteps(
  from: string,
  to: string,
  startAfter: number,
  write: (text: string) => BuilderAction
): Step[] {
  const steps: Step[] = [];
  const last = to.length + CHUNK;
  for (let end = from.length + CHUNK; end < last; end += CHUNK) {
    const text = to.slice(0, end);
    const after = delayOfChunk(steps.length, startAfter);
    steps.push({ after, by: 'demo', action: write(text) });
  }
  return steps;
}

function instructed(text: string): BuilderAction {
  return { type: 'instructed', text };
}

function chatTyped(text: string): BuilderAction {
  return { type: 'chatTyped', text };
}

const DEMO_FILE = SAMPLE_FILES[0];

/** The steps an upload goes through, in percent. */
export const UPLOAD_STEPS = [35, 80, 100];

export const UPLOAD_STEP_MS = 600;

const UPLOAD: Step[] = UPLOAD_STEPS.map((progress) => ({
  after: UPLOAD_STEP_MS,
  action: { type: 'fileProgress', id: DEMO_FILE.id, progress },
}));

export const SAMPLE_MS = 800;

/** One tick starts the first sample, then one tick per result. */
export const SAMPLE_TICKS = SAMPLES.length + 1;

const SAMPLE_RUN: Step[] = Array.from({ length: SAMPLE_TICKS }, () => ({
  after: SAMPLE_MS,
  action: { type: 'sampleRan' },
}));

export const ANSWER_MS = 1100;

export const PUBLISH_MS = 1500;

function isReviewing(state: BuilderState) {
  return state.isReviewOpen;
}

function hasPublishedOnce(state: BuilderState) {
  return state.attempts >= 1;
}

function hasRetried(state: BuilderState) {
  return state.attempts >= 2;
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

const EDITING: Step[] = [
  ...typingSteps(LIVE_CONFIG.instructions, DEMO_INSTRUCTIONS, 1200, instructed),
  {
    after: 900,
    by: 'demo',
    action: { type: 'toolSet', id: 'refunds', isOn: true },
  },
  { after: 900, by: 'demo', action: { type: 'model', id: 'claude-sonnet' } },
  { after: 1000, by: 'demo', press: 'add-file', action: { type: 'fileAdded' } },
  ...UPLOAD,
];

export const SCRIPT: Step[] = [
  ...EDITING,
  { after: 1200, by: 'demo', action: { type: 'view', view: 'test' } },
  ...typingSteps('', DEMO_QUESTION, 800, chatTyped),
  { after: 500, by: 'demo', press: 'send', action: { type: 'chatSent' } },
  { after: ANSWER_MS, action: { type: 'answered' } },
  {
    after: 3600,
    by: 'person',
    press: 'review',
    action: { type: 'reviewOpened' },
    isAnswered: isReviewing,
  },
  ...SAMPLE_RUN,
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'publish',
    action: { type: 'publish' },
    isAnswered: hasPublishedOnce,
  },
  { after: PUBLISH_MS, action: { type: 'publishSettled' } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'publish',
    action: { type: 'publish' },
    isAnswered: hasRetried,
  },
  { after: PUBLISH_MS, action: { type: 'publishSettled' } },
];

/** Under reduced motion the draft is edited and the review is open, its samples run, ready to publish. */
function restingOf() {
  let state = INITIAL;
  for (const step of EDITING) {
    state = reducer(state, step.action);
  }
  state = reducer(state, { type: 'reviewOpened' });
  for (const step of SAMPLE_RUN) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 4200;
