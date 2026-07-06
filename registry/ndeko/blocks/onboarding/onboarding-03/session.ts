import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import {
  indexOfPhase,
  modelOf,
  phaseOf,
  PHASES,
  toolOf,
  TOOLS,
  type ModelId,
  type PhaseId,
  type ToolId,
} from './data';
import { committedInvites } from './invites';
import {
  isRunDone,
  newRun,
  resultOf,
  RUN_MS,
  tickedRun,
  TICK_DELAYS_MS,
  type Run,
} from './run';

export type ConnectStatus = 'idle' | 'connecting' | 'connected';

/** What a hint is about, which is also where the focus goes when an entry is refused. */
export type HintField = 'tools' | 'invites' | 'agentName' | 'job';

export type Hint = {
  field: HintField;
  message: string;
};

export type TextField = 'inviteDraft' | 'agentName' | 'job';

export type WorkspaceState = {
  phase: PhaseId;
  tools: Record<ToolId, ConnectStatus>;
  invites: string[];
  /** What the address box holds before it becomes a chip. */
  inviteDraft: string;
  agentName: string;
  model: ModelId;
  job: string;
  hint: Hint | null;
  /** Counts the refused entries, so a hint that comes back arrives again. */
  attempts: number;
  /** Counts the changes of step. The first step is there when the page loads; the next ones fade in. */
  moves: number;
  run: Run | null;
  spoken: string;
};

export type WorkspaceAction =
  | { type: 'connectPressed'; tool: ToolId }
  | { type: 'connected'; tool: ToolId }
  | { type: 'disconnected'; tool: ToolId }
  | { type: 'typed'; field: TextField; value: string }
  | { type: 'inviteCommitted' }
  | { type: 'inviteRemoved'; address: string }
  | { type: 'modelPicked'; model: ModelId }
  | { type: 'continued' }
  | { type: 'edited'; phase: PhaseId }
  | { type: 'runTicked' }
  | { type: 'ranAgain' };

type Step = SessionStep<WorkspaceState, WorkspaceAction>;

export const TOTAL = PHASES.length;

export const INITIAL: WorkspaceState = {
  phase: 'tools',
  tools: {
    notion: 'idle',
    linear: 'idle',
    github: 'idle',
    googledrive: 'idle',
  },
  invites: [],
  inviteDraft: '',
  agentName: '',
  model: 'claude',
  job: '',
  hint: null,
  attempts: 0,
  moves: 0,
  run: null,
  spoken: '',
};

export function connectedToolsOf(state: WorkspaceState) {
  const connected = TOOLS.filter(
    (tool) => state.tools[tool.id] === 'connected'
  );
  return connected.map((tool) => tool.id);
}

function isConnecting(state: WorkspaceState) {
  return TOOLS.some((tool) => state.tools[tool.id] === 'connecting');
}

function withTool(
  state: WorkspaceState,
  tool: ToolId,
  status: ConnectStatus
): WorkspaceState {
  return { ...state, tools: { ...state.tools, [tool]: status } };
}

function hintCleared(state: WorkspaceState, field: HintField): WorkspaceState {
  if (state.hint?.field !== field) {
    return state;
  }
  return { ...state, hint: null };
}

function connectPressed(state: WorkspaceState, tool: ToolId): WorkspaceState {
  if (state.tools[tool] !== 'idle') {
    return state;
  }
  const next = withTool(state, tool, 'connecting');
  return hintCleared(next, 'tools');
}

function connected(state: WorkspaceState, tool: ToolId): WorkspaceState {
  if (state.tools[tool] !== 'connecting') {
    return state;
  }
  const next = withTool(state, tool, 'connected');
  const cleared = hintCleared(next, 'tools');
  const name = toolOf(tool).name;
  return { ...cleared, spoken: `${name} connected` };
}

function disconnected(state: WorkspaceState, tool: ToolId): WorkspaceState {
  if (state.tools[tool] !== 'connected') {
    return state;
  }
  const next = withTool(state, tool, 'idle');
  return { ...next, spoken: `${toolOf(tool).name} disconnected` };
}

const HINT_OF_FIELD: Record<TextField, HintField> = {
  inviteDraft: 'invites',
  agentName: 'agentName',
  job: 'job',
};

function typed(
  state: WorkspaceState,
  field: TextField,
  value: string
): WorkspaceState {
  const next = { ...state, [field]: value };
  return hintCleared(next, HINT_OF_FIELD[field]);
}

function refused(state: WorkspaceState, hint: Hint): WorkspaceState {
  return {
    ...state,
    hint,
    attempts: state.attempts + 1,
    spoken: hint.message,
  };
}

/** What the address box holds becomes addresses. What cannot be one stays in the box, with the reason. */
function inviteCommitted(state: WorkspaceState): WorkspaceState {
  const committed = committedInvites(state.invites, state.inviteDraft);
  const next = {
    ...state,
    invites: committed.invites,
    inviteDraft: committed.draft,
  };
  if (committed.error !== undefined) {
    return refused(next, { field: 'invites', message: committed.error });
  }
  return hintCleared(next, 'invites');
}

function inviteRemoved(state: WorkspaceState, address: string): WorkspaceState {
  const invites = state.invites.filter((candidate) => candidate !== address);
  return { ...state, invites };
}

function entered(state: WorkspaceState, phase: PhaseId): WorkspaceState {
  const index = indexOfPhase(phase);
  const title = phaseOf(phase).title;
  return {
    ...state,
    phase,
    hint: null,
    moves: state.moves + 1,
    spoken: `Step ${index + 1} of ${TOTAL}: ${title}`,
  };
}

function toolsContinued(state: WorkspaceState): WorkspaceState {
  if (isConnecting(state)) {
    const message = 'Wait for the connection to finish';
    return refused(state, { field: 'tools', message });
  }
  const connectedTools = connectedToolsOf(state);
  if (connectedTools.length === 0) {
    const message = 'Connect at least one tool to continue';
    return refused(state, { field: 'tools', message });
  }
  return entered(state, 'team');
}

/** An address still in the box is read first, so nobody has to press Add before Continue. */
function teamContinued(state: WorkspaceState): WorkspaceState {
  const committed = inviteCommitted(state);
  const hasBadAddress = committed.hint?.field === 'invites';
  if (hasBadAddress) {
    return committed;
  }
  if (committed.invites.length === 0) {
    const message = 'Add at least one address to continue';
    return refused(committed, { field: 'invites', message });
  }
  return entered(committed, 'agent');
}

/** The agent is created and starts its first job at once, with the first two tools that are connected. */
function agentContinued(state: WorkspaceState, now: number): WorkspaceState {
  if (state.agentName.trim() === '') {
    const message = 'Give the agent a name';
    return refused(state, { field: 'agentName', message });
  }
  if (state.job.trim() === '') {
    const message = 'Say what its job is, in one sentence';
    return refused(state, { field: 'job', message });
  }
  const connected = connectedToolsOf(state);
  const tools = connected.slice(0, 2);
  const next = entered(state, 'watch');
  const model = modelOf(state.model).name;
  const name = state.agentName.trim();
  const spoken = `${name} is created on ${model} and starts its first job`;
  return { ...next, run: newRun(tools, now), spoken };
}

function continued(state: WorkspaceState, now: number): WorkspaceState {
  if (state.phase === 'tools') {
    return toolsContinued(state);
  }
  if (state.phase === 'team') {
    return teamContinued(state);
  }
  if (state.phase === 'agent') {
    return agentContinued(state, now);
  }
  return state;
}

/** Edit goes back to a step that is done. The first run belongs to the agent as it was: it leaves. */
function edited(state: WorkspaceState, phase: PhaseId): WorkspaceState {
  const isBehind = indexOfPhase(phase) < indexOfPhase(state.phase);
  if (!isBehind) {
    return state;
  }
  return entered({ ...state, run: null }, phase);
}

function runTicked(state: WorkspaceState, now: number): WorkspaceState {
  const run = state.run;
  if (!run || isRunDone(run)) {
    return state;
  }
  const next = tickedRun(run, now);
  if (!isRunDone(next)) {
    return { ...state, run: next };
  }
  return { ...state, run: next, spoken: `First run done. ${resultOf(next)}` };
}

function ranAgain(state: WorkspaceState, now: number): WorkspaceState {
  const run = state.run;
  if (!run || !isRunDone(run)) {
    return state;
  }
  const again = newRun(run.tools, now);
  return { ...state, run: again, spoken: 'The run starts again' };
}

export function applyAt(
  state: WorkspaceState,
  action: WorkspaceAction,
  now: number
): WorkspaceState {
  switch (action.type) {
    case 'connectPressed':
      return connectPressed(state, action.tool);
    case 'connected':
      return connected(state, action.tool);
    case 'disconnected':
      return disconnected(state, action.tool);
    case 'typed':
      return typed(state, action.field, action.value);
    case 'inviteCommitted':
      return inviteCommitted(state);
    case 'inviteRemoved':
      return inviteRemoved(state, action.address);
    case 'modelPicked':
      return { ...state, model: action.model };
    case 'continued':
      return continued(state, now);
    case 'edited':
      return edited(state, action.phase);
    case 'runTicked':
      return runTicked(state, now);
    case 'ranAgain':
      return ranAgain(state, now);
  }
}

/** Times are stamped when an action lands, as a backend would stream them. */
export function reducer(state: WorkspaceState, action: WorkspaceAction) {
  return applyAt(state, action, Date.now());
}

/** How long a tool takes to connect. */
export const CONNECT_MS = 1100;

const KEY_MS = 34;

const FIRST_ADDRESS = 'ines@solwaybooks.example';

const SECOND_ADDRESS = 'tomas@solwaybooks.example';

const AGENT_NAME = 'Morning digest';

const JOB = 'Tell the team what changed overnight';

function typingSteps(
  field: TextField,
  text: string,
  startAfter: number
): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', field, value },
  }));
}

/** The demonstration presses Connect; the tool then connects on its own, whoever pressed. */
function connects(after: number, tool: ToolId): Step[] {
  return [
    {
      after,
      by: 'demo',
      press: `connect-${tool}`,
      action: { type: 'connectPressed', tool },
    },
    { after: CONNECT_MS, action: { type: 'connected', tool } },
  ];
}

function continues(after: number): Step {
  return {
    after,
    by: 'demo',
    press: 'continue',
    action: { type: 'continued' },
  };
}

function adds(after: number): Step {
  return {
    after,
    by: 'demo',
    press: 'add-invite',
    action: { type: 'inviteCommitted' },
  };
}

/**
 * A person does every step, so they are the demonstration's: two tools are connected, two people
 * are invited, the agent gets its name and its job and is created. The first run that follows is
 * not in the script: it plays from its own clock, for the demonstration and for a person alike.
 */
export const SCRIPT: Step[] = [
  ...connects(1300, 'linear'),
  ...connects(700, 'github'),
  continues(900),
  ...typingSteps('inviteDraft', FIRST_ADDRESS, 900),
  adds(350),
  ...typingSteps('inviteDraft', SECOND_ADDRESS, 500),
  adds(350),
  continues(800),
  ...typingSteps('agentName', AGENT_NAME, 900),
  ...typingSteps('job', JOB, 600),
  continues(800),
];

/** The script ends as the first run starts. The run is then taken through its five moments. */
function finishedOf(state: WorkspaceState) {
  let finished = state;
  let now = state.run?.startedAt ?? 0;
  for (const delay of TICK_DELAYS_MS) {
    now += delay;
    finished = applyAt(finished, { type: 'runTicked' }, now);
  }
  return finished;
}

const CREATED = restingOf(INITIAL, SCRIPT, applyAt);

/** Under reduced motion the three steps are done and the first run has ended on its result. */
export const RESTING: WorkspaceState = { ...finishedOf(CREATED), spoken: '' };

/** A round ends once the first run has played and its result has been left to read. */
export const LOOP_AFTER_MS = RUN_MS + 4200;
