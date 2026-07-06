import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import type { ToolId } from './data';

export type ToolsState = {
  connected: ToolId[];
  openId: ToolId | null;
  isConnecting: boolean;
};

export type ToolsAction =
  | { type: 'opened'; id: ToolId }
  | { type: 'closed' }
  | { type: 'connectStarted' }
  | { type: 'connected' }
  | { type: 'disconnected'; id: ToolId };

type Step = SessionStep<ToolsState, ToolsAction>;

export const INITIAL: ToolsState = {
  connected: [],
  openId: null,
  isConnecting: false,
};

export const CONNECT_MS = 800;

function connectStarted(state: ToolsState): ToolsState {
  const { openId } = state;
  if (openId === null) {
    return state;
  }
  const isAlready = state.connected.includes(openId);
  if (isAlready) {
    return state;
  }
  return { ...state, isConnecting: true };
}

function connected(state: ToolsState): ToolsState {
  const { openId } = state;
  if (openId === null || !state.isConnecting) {
    return state;
  }
  const next = [...state.connected, openId];
  return { ...state, connected: next, isConnecting: false };
}

export function reducer(state: ToolsState, action: ToolsAction): ToolsState {
  switch (action.type) {
    case 'opened':
      return { ...state, openId: action.id, isConnecting: false };
    case 'closed':
      return { ...state, openId: null, isConnecting: false };
    case 'connectStarted':
      return connectStarted(state);
    case 'connected':
      return connected(state);
    case 'disconnected': {
      const rest = state.connected.filter((id) => id !== action.id);
      return { ...state, connected: rest };
    }
  }
}

const DEMO_TOOLS: ToolId[] = ['gmail', 'github', 'notion', 'stripe'];

function connecting(id: ToolId, firstAfter: number): Step[] {
  return [
    {
      after: firstAfter,
      by: 'demo',
      press: `tool-${id}`,
      action: { type: 'opened', id },
    },
    {
      after: 1500,
      by: 'demo',
      press: 'connect',
      action: { type: 'connectStarted' },
    },
    { after: 2600, by: 'demo', action: { type: 'closed' } },
  ];
}

/**
 * Four tools are opened and connected one after the other, so the rows fill in with colour as the
 * round goes on.
 */
export const SCRIPT: Step[] = DEMO_TOOLS.flatMap((id, index) => {
  const isFirst = index === 0;
  let firstAfter = 1400;
  if (isFirst) {
    firstAfter = 2200;
  }
  return connecting(id, firstAfter);
});

/** Under reduced motion three tools are connected and a fourth waits to be. */
export const RESTING: ToolsState = {
  connected: ['gmail', 'github', 'linear'],
  openId: 'notion',
  isConnecting: false,
};

export const LOOP_AFTER_MS = 2800;
