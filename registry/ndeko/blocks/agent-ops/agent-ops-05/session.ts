import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import type { EditorId, Scope, Transport } from './data';

export type Connection = 'idle' | 'waiting' | 'connected';

export type InstallState = {
  editorId: EditorId;
  transport: Transport;
  scope: Scope;
  connection: Connection;
};

export type InstallAction =
  | { type: 'editor'; id: EditorId }
  | { type: 'transport'; transport: Transport }
  | { type: 'scope'; scope: Scope }
  | { type: 'copied' }
  | { type: 'connected' };

type Step = SessionStep<InstallState, InstallAction>;

export const INITIAL: InstallState = {
  editorId: 'claude-code',
  transport: 'remote',
  scope: 'project',
  connection: 'idle',
};

/** A new config has not been copied yet, so the card stops waiting for the old one. */
function changed(
  state: InstallState,
  patch: Partial<InstallState>
): InstallState {
  return { ...state, ...patch, connection: 'idle' };
}

function connected(state: InstallState): InstallState {
  if (state.connection !== 'waiting') {
    return state;
  }
  return { ...state, connection: 'connected' };
}

export function reducer(
  state: InstallState,
  action: InstallAction
): InstallState {
  switch (action.type) {
    case 'editor':
      return changed(state, { editorId: action.id });
    case 'transport':
      return changed(state, { transport: action.transport });
    case 'scope':
      return changed(state, { scope: action.scope });
    case 'copied':
      return { ...state, connection: 'waiting' };
    case 'connected':
      return connected(state);
  }
}

function hasCopied(state: InstallState) {
  return state.connection !== 'idle';
}

/** How long the editor takes to start the server and list its tools. */
export const CONNECT_MS = 3200;

export const SCRIPT: Step[] = [
  {
    after: 1400,
    by: 'demo',
    action: { type: 'editor', id: 'cursor' },
  },
  {
    after: 1700,
    by: 'demo',
    action: { type: 'transport', transport: 'local' },
  },
  {
    after: 1700,
    by: 'demo',
    action: { type: 'scope', scope: 'everywhere' },
  },
  {
    after: 2200,
    by: 'person',
    press: 'copy',
    action: { type: 'copied' },
    isAnswered: hasCopied,
  },
  { after: CONNECT_MS, action: { type: 'connected' } },
];

/** Under reduced motion the card rests connected, on the config the demonstration ends with. */
export const RESTING: InstallState = {
  editorId: 'cursor',
  transport: 'local',
  scope: 'everywhere',
  connection: 'connected',
};

export const LOOP_AFTER_MS = 3800;
