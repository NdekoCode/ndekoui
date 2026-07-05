import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  ADDED_SERVER_ID,
  DEMO_ADDRESS,
  DEMO_ADDRESS_FIRST,
  DEMO_NAME,
  FOUND_TOOLS,
  SERVERS,
  type Server,
  type Tool,
  type Transport,
} from './data';

/** Restored is connected a moment ago: the row still shows the button that did it. */
export type ConnectionStatus =
  'connected' | 'expired' | 'reconnecting' | 'restored';

export type ToolSetting = {
  isEnabled: boolean;
  asksFirst: boolean;
};

export type ServerLive = {
  status: ConnectionStatus;
  tools: Record<string, ToolSetting>;
};

export type TestStatus = 'idle' | 'testing' | 'connected' | 'failed';

export type DialogState = {
  isOpen: boolean;
  name: string;
  address: string;
  transport: Transport;
  test: TestStatus;
  failure: string | null;
};

export type McpState = {
  servers: Server[];
  live: Record<string, ServerLive>;
  /** The server whose tools are unfolded. */
  openId: string | null;
  /** The server that asks, in its own row, whether it should be removed. */
  removingId: string | null;
  dialog: DialogState;
  addedCount: number;
};

export type McpAction =
  | { type: 'toggled'; id: string }
  | { type: 'toolEnabled'; id: string; tool: string; isEnabled: boolean }
  | { type: 'toolAsks'; id: string; tool: string; asksFirst: boolean }
  | { type: 'reconnect'; id: string }
  | { type: 'reconnected'; id: string }
  | { type: 'settled'; id: string }
  | { type: 'removeAsked'; id: string }
  | { type: 'removeCancelled' }
  | { type: 'removed'; id: string }
  | { type: 'dialogOpened' }
  | { type: 'dialogClosed' }
  | { type: 'named'; text: string }
  | { type: 'addressed'; text: string }
  | { type: 'transport'; transport: Transport }
  | { type: 'test' }
  | { type: 'tested' }
  | { type: 'added' };

type Step = SessionStep<McpState, McpAction>;

/** A tool that writes asks first until a person decides otherwise. */
function settingOf(tool: Tool): ToolSetting {
  return { isEnabled: true, asksFirst: tool.access === 'write' };
}

function liveOf(server: Server, status: ConnectionStatus): ServerLive {
  const tools: Record<string, ToolSetting> = {};
  for (const tool of server.tools) {
    tools[tool.name] = settingOf(tool);
  }
  return { status, tools };
}

const FIRST_STATUS: Record<string, ConnectionStatus> = {
  linear: 'expired',
};

function initialLive() {
  const live: Record<string, ServerLive> = {};
  for (const server of SERVERS) {
    const status = FIRST_STATUS[server.id] ?? 'connected';
    live[server.id] = liveOf(server, status);
  }
  return live;
}

const EMPTY_DIALOG: DialogState = {
  isOpen: false,
  name: '',
  address: '',
  transport: 'remote',
  test: 'idle',
  failure: null,
};

export const INITIAL: McpState = {
  servers: SERVERS,
  live: initialLive(),
  openId: null,
  removingId: null,
  dialog: EMPTY_DIALOG,
  addedCount: 0,
};

const REMOTE_SHAPE = /^https:\/\/\S+\/mcp\/?$/;

/** What a test connection answers, read from the address alone: nothing is called. */
export function failureOf(dialog: DialogState) {
  const address = dialog.address.trim();
  if (dialog.transport === 'local') {
    if (address === '') {
      return 'Enter the command that starts the server';
    }
    return null;
  }
  if (!address.startsWith('https://')) {
    return 'A remote server needs an address that starts with https://';
  }
  if (!REMOTE_SHAPE.test(address)) {
    return 'No MCP server answered at this address. Most remote servers end in /mcp';
  }
  return null;
}

export function enabledCountOf(live: ServerLive) {
  const settings = Object.values(live.tools);
  const enabled = settings.filter((setting) => setting.isEnabled);
  return enabled.length;
}

function withLive(
  state: McpState,
  id: string,
  change: (live: ServerLive) => ServerLive
): McpState {
  const current = state.live[id];
  if (!current) {
    return state;
  }
  return { ...state, live: { ...state.live, [id]: change(current) } };
}

function withTool(
  state: McpState,
  id: string,
  tool: string,
  patch: Partial<ToolSetting>
) {
  return withLive(state, id, (live) => {
    const setting = { ...live.tools[tool], ...patch };
    return { ...live, tools: { ...live.tools, [tool]: setting } };
  });
}

function withStatus(
  state: McpState,
  id: string,
  from: ConnectionStatus,
  to: ConnectionStatus
) {
  return withLive(state, id, (live) => {
    if (live.status !== from) {
      return live;
    }
    return { ...live, status: to };
  });
}

function toggled(state: McpState, id: string): McpState {
  if (state.openId === id) {
    return { ...state, openId: null };
  }
  return { ...state, openId: id };
}

function removed(state: McpState, id: string): McpState {
  const servers = state.servers.filter((server) => server.id !== id);
  const live = { ...state.live };
  delete live[id];
  let openId = state.openId;
  if (openId === id) {
    openId = null;
  }
  return { ...state, servers, live, openId, removingId: null };
}

/** Changing a field makes the last test stale: Add waits for a new one. */
function edited(state: McpState, patch: Partial<DialogState>): McpState {
  if (state.dialog.test === 'testing') {
    return state;
  }
  const dialog: DialogState = {
    ...state.dialog,
    ...patch,
    test: 'idle',
    failure: null,
  };
  return { ...state, dialog };
}

function test(state: McpState): McpState {
  const canTest = state.dialog.isOpen && state.dialog.test !== 'testing';
  if (!canTest) {
    return state;
  }
  return { ...state, dialog: { ...state.dialog, test: 'testing' } };
}

function tested(state: McpState): McpState {
  if (state.dialog.test !== 'testing') {
    return state;
  }
  const failure = failureOf(state.dialog);
  if (failure) {
    return { ...state, dialog: { ...state.dialog, test: 'failed', failure } };
  }
  return { ...state, dialog: { ...state.dialog, test: 'connected' } };
}

function nameOf(dialog: DialogState) {
  const trimmed = dialog.name.trim();
  if (trimmed === '') {
    return 'New server';
  }
  return trimmed;
}

function added(state: McpState): McpState {
  if (state.dialog.test !== 'connected') {
    return state;
  }
  const name = nameOf(state.dialog);
  const count = state.addedCount + 1;
  const server: Server = {
    id: `${ADDED_SERVER_ID}-${count}`,
    name,
    transport: state.dialog.transport,
    initial: name.charAt(0).toUpperCase(),
    address: state.dialog.address.trim(),
    tools: FOUND_TOOLS,
  };
  return {
    ...state,
    servers: [...state.servers, server],
    live: { ...state.live, [server.id]: liveOf(server, 'connected') },
    dialog: { ...state.dialog, isOpen: false },
    addedCount: count,
  };
}

export function reducer(state: McpState, action: McpAction): McpState {
  switch (action.type) {
    case 'toggled':
      return toggled(state, action.id);
    case 'toolEnabled':
      return withTool(state, action.id, action.tool, {
        isEnabled: action.isEnabled,
      });
    case 'toolAsks':
      return withTool(state, action.id, action.tool, {
        asksFirst: action.asksFirst,
      });
    case 'reconnect':
      return withStatus(state, action.id, 'expired', 'reconnecting');
    case 'reconnected':
      return withStatus(state, action.id, 'reconnecting', 'restored');
    case 'settled':
      return withStatus(state, action.id, 'restored', 'connected');
    case 'removeAsked':
      return { ...state, removingId: action.id };
    case 'removeCancelled':
      return { ...state, removingId: null };
    case 'removed':
      return removed(state, action.id);
    case 'dialogOpened':
      return { ...state, dialog: { ...EMPTY_DIALOG, isOpen: true } };
    case 'dialogClosed':
      return { ...state, dialog: { ...state.dialog, isOpen: false } };
    case 'named':
      return edited(state, { name: action.text });
    case 'addressed':
      return edited(state, { address: action.text });
    case 'transport':
      return edited(state, { transport: action.transport });
    case 'test':
      return test(state);
    case 'tested':
      return tested(state);
    case 'added':
      return added(state);
  }
}

const CHUNK = 3;

function delayOfChunk(index: number, startAfter: number) {
  if (index === 0) {
    return startAfter;
  }
  return 70;
}

/** The demonstration types from what the field holds to the full text, a few characters at a time. */
function typingSteps(
  from: string,
  to: string,
  startAfter: number,
  write: (text: string) => McpAction
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

function named(text: string): McpAction {
  return { type: 'named', text };
}

function addressed(text: string): McpAction {
  return { type: 'addressed', text };
}

export const RECONNECT_MS = 1500;

export const SETTLE_MS = 1600;

export const TEST_MS = 1200;

export const SCRIPT: Step[] = [
  {
    after: 1300,
    by: 'demo',
    press: 'toggle-github',
    action: { type: 'toggled', id: 'github' },
  },
  {
    after: 1500,
    by: 'demo',
    action: {
      type: 'toolAsks',
      id: 'github',
      tool: 'comment_on_issue',
      asksFirst: false,
    },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'reconnect-linear',
    action: { type: 'reconnect', id: 'linear' },
  },
  { after: RECONNECT_MS, action: { type: 'reconnected', id: 'linear' } },
  { after: SETTLE_MS, action: { type: 'settled', id: 'linear' } },
  { after: 600, by: 'demo', press: 'add', action: { type: 'dialogOpened' } },
  ...typingSteps('', DEMO_NAME, 800, named),
  ...typingSteps('', DEMO_ADDRESS_FIRST, 500, addressed),
  { after: 600, by: 'demo', press: 'test', action: { type: 'test' } },
  { after: TEST_MS, action: { type: 'tested' } },
  ...typingSteps(DEMO_ADDRESS_FIRST, DEMO_ADDRESS, 1700, addressed),
  { after: 600, by: 'demo', press: 'test', action: { type: 'test' } },
  { after: TEST_MS, action: { type: 'tested' } },
  { after: 1700, by: 'demo', press: 'confirm', action: { type: 'added' } },
];

/** Under reduced motion the first server shows its tools and one server waits for a new token. */
export const RESTING: McpState = { ...INITIAL, openId: 'github' };

export const LOOP_AFTER_MS = 3600;
