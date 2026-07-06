import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  KEYS,
  SAMPLE_SECRETS,
  TODAY,
  YOU,
  type Access,
  type ApiKey,
  type Environment,
} from './data';

/** Closed, the form, the key being made, then the secret shown once. */
export type CreateStatus = 'closed' | 'editing' | 'creating' | 'revealed';

export type Draft = {
  name: string;
  environment: Environment;
  access: Access;
};

export type Secret = {
  keyId: string;
  name: string;
  value: string;
  isCopied: boolean;
};

export type KeysState = {
  keys: ApiKey[];
  status: CreateStatus;
  draft: Draft;
  nameError: string | null;
  /** Counts the refused entries, so a message that comes back nudges again. */
  attempts: number;
  secret: Secret | null;
  openId: string | null;
  /** The key whose Revoke the demonstration is holding down. */
  holdingId: string | null;
  /** Keys made since the page loaded: the next one takes the next sample secret. */
  made: number;
  spoken: string;
};

export type KeysAction =
  | { type: 'createOpened' }
  | { type: 'createClosed' }
  | { type: 'named'; value: string }
  | { type: 'environmentPicked'; environment: Environment }
  | { type: 'accessPicked'; access: Access }
  | { type: 'createSubmitted' }
  | { type: 'keyCreated' }
  | { type: 'secretCopied' }
  | { type: 'copyFailed' }
  | { type: 'secretHidden' }
  | { type: 'rowToggled'; id: string }
  | { type: 'holdStarted'; id: string }
  | { type: 'revoked'; id: string }
  | { type: 'used'; id: string; cents: number };

type Step = SessionStep<KeysState, KeysAction>;

/** How long the server takes to make a key. */
export const CREATE_MS = 900;

/** The two seconds the Hold pattern asks for. */
export const HOLD_MS = 2000;

const EMPTY_DRAFT: Draft = { name: '', environment: 'live', access: 'full' };

export const INITIAL: KeysState = {
  keys: KEYS,
  status: 'closed',
  draft: EMPTY_DRAFT,
  nameError: null,
  attempts: 0,
  secret: null,
  openId: null,
  holdingId: null,
  made: 0,
  spoken: '',
};

export function maskedKeyOf(environment: Environment, tail: string) {
  return `tw_${environment}_…${tail}`;
}

function keyById(state: KeysState, id: string) {
  return state.keys.find((key) => key.id === id);
}

function isNameTaken(state: KeysState, name: string) {
  const lowered = name.toLowerCase();
  return state.keys.some((key) => key.name.toLowerCase() === lowered);
}

function nameProblemOf(state: KeysState, name: string) {
  if (name === '') {
    return 'Name the key so you can tell where it is used';
  }
  if (isNameTaken(state, name)) {
    return `A key named ${name} already exists`;
  }
  return null;
}

function createOpened(state: KeysState): KeysState {
  if (state.status !== 'closed') {
    return state;
  }
  return {
    ...state,
    status: 'editing',
    draft: EMPTY_DRAFT,
    nameError: null,
    spoken: 'New key form opened',
  };
}

function createClosed(state: KeysState): KeysState {
  if (state.status !== 'editing') {
    return state;
  }
  return { ...state, status: 'closed', nameError: null, spoken: '' };
}

function withDraft(state: KeysState, change: Partial<Draft>): KeysState {
  if (state.status !== 'editing') {
    return state;
  }
  return { ...state, draft: { ...state.draft, ...change } };
}

function named(state: KeysState, value: string): KeysState {
  const next = withDraft(state, { name: value });
  return { ...next, nameError: null };
}

function createSubmitted(state: KeysState): KeysState {
  if (state.status !== 'editing') {
    return state;
  }
  const name = state.draft.name.trim();
  const problem = nameProblemOf(state, name);
  if (problem) {
    return {
      ...state,
      nameError: problem,
      attempts: state.attempts + 1,
      spoken: problem,
    };
  }
  return { ...state, status: 'creating', spoken: 'Creating the key' };
}

function secretSuffixOf(made: number) {
  const index = made % SAMPLE_SECRETS.length;
  return SAMPLE_SECRETS[index];
}

function keyCreated(state: KeysState): KeysState {
  if (state.status !== 'creating') {
    return state;
  }
  const draft = state.draft;
  const made = state.made + 1;
  const suffix = secretSuffixOf(state.made);
  const name = draft.name.trim();
  const key: ApiKey = {
    id: `made-${made}`,
    name,
    environment: draft.environment,
    tail: suffix.slice(-4),
    createdOn: TODAY,
    createdBy: YOU,
    lastUsed: 'never',
    idleDays: null,
    spendCents: 0,
    access: draft.access,
    requests: Array.from({ length: 14 }, () => 0),
  };
  const secret: Secret = {
    keyId: key.id,
    name,
    value: `tw_${draft.environment}_${suffix}`,
    isCopied: false,
  };
  return {
    ...state,
    keys: [key, ...state.keys],
    status: 'revealed',
    secret,
    made,
    spoken: `${name} created. Copy the key now: it is shown once`,
  };
}

function secretCopied(state: KeysState): KeysState {
  if (!state.secret) {
    return state;
  }
  const secret = { ...state.secret, isCopied: true };
  return { ...state, secret, spoken: 'Key copied' };
}

function secretHidden(state: KeysState): KeysState {
  if (state.status !== 'revealed') {
    return state;
  }
  return {
    ...state,
    status: 'closed',
    secret: null,
    spoken: 'Key hidden. Only its last four characters stay visible',
  };
}

function toggledId(openId: string | null, id: string) {
  if (openId === id) {
    return null;
  }
  return id;
}

type SecretSlot = Pick<KeysState, 'status' | 'secret'>;

/** Revoking a key whose secret is still on screen takes the secret away with it. */
function secretAfterRevokeOf(state: KeysState, id: string): SecretSlot {
  const isShowingIt = state.secret?.keyId === id;
  if (isShowingIt) {
    return { status: 'closed', secret: null };
  }
  return { status: state.status, secret: state.secret };
}

function openIdAfterRevokeOf(openId: string | null, id: string) {
  if (openId === id) {
    return null;
  }
  return openId;
}

function revoked(state: KeysState, id: string): KeysState {
  const key = keyById(state, id);
  if (!key) {
    return state;
  }
  const keys = state.keys.filter((candidate) => candidate.id !== id);
  const slot = secretAfterRevokeOf(state, id);
  return {
    ...state,
    ...slot,
    keys,
    openId: openIdAfterRevokeOf(state.openId, id),
    holdingId: null,
    spoken: `${key.name} revoked. Apps that use it can no longer call the API`,
  };
}

/** Test keys call a sandbox that costs nothing. */
function used(state: KeysState, id: string, cents: number): KeysState {
  const keys = state.keys.map((key) => {
    const isLiveMatch = key.id === id && key.environment === 'live';
    if (!isLiveMatch) {
      return key;
    }
    return {
      ...key,
      spendCents: key.spendCents + cents,
      lastUsed: 'just now',
    };
  });
  return { ...state, keys };
}

export function reducer(state: KeysState, action: KeysAction): KeysState {
  switch (action.type) {
    case 'createOpened':
      return createOpened(state);
    case 'createClosed':
      return createClosed(state);
    case 'named':
      return named(state, action.value);
    case 'environmentPicked':
      return withDraft(state, { environment: action.environment });
    case 'accessPicked':
      return withDraft(state, { access: action.access });
    case 'createSubmitted':
      return createSubmitted(state);
    case 'keyCreated':
      return keyCreated(state);
    case 'secretCopied':
      return secretCopied(state);
    case 'copyFailed':
      return {
        ...state,
        spoken: 'Copy did not work. Select the key and copy it',
      };
    case 'secretHidden':
      return secretHidden(state);
    case 'rowToggled':
      return { ...state, openId: toggledId(state.openId, action.id) };
    case 'holdStarted':
      return { ...state, holdingId: action.id };
    case 'revoked':
      return revoked(state, action.id);
    case 'used':
      return used(state, action.id, action.cents);
  }
}

const KEY_MS = 55;

const TYPED_NAME = 'Analytics export';

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'named', value },
  }));
}

/**
 * A key is made, copied and hidden, then the idle one is opened. That is where the page rests
 * under reduced motion: the idle marker and the Revoke a person would hold.
 */
const BEFORE_REVOKE: Step[] = [
  {
    after: 1200,
    by: 'demo',
    press: 'create',
    action: { type: 'createOpened' },
  },
  ...typingSteps(TYPED_NAME, 500),
  {
    after: 650,
    by: 'demo',
    action: { type: 'accessPicked', access: 'read' },
  },
  {
    after: 700,
    by: 'demo',
    press: 'submit',
    action: { type: 'createSubmitted' },
  },
  { after: CREATE_MS, action: { type: 'keyCreated' } },
  { after: 1500, by: 'demo', press: 'copy', action: { type: 'secretCopied' } },
  { after: 900, action: { type: 'used', id: 'production', cents: 42 } },
  { after: 1100, by: 'demo', press: 'hide', action: { type: 'secretHidden' } },
  {
    after: 1100,
    by: 'demo',
    press: 'row-old-import',
    action: { type: 'rowToggled', id: 'old-import' },
  },
];

export const SCRIPT: Step[] = [
  ...BEFORE_REVOKE,
  {
    after: 1600,
    by: 'demo',
    action: { type: 'holdStarted', id: 'old-import' },
  },
  {
    after: HOLD_MS,
    by: 'demo',
    action: { type: 'revoked', id: 'old-import' },
  },
  { after: 1300, action: { type: 'used', id: 'production', cents: 31 } },
];

function endOf(steps: Step[]) {
  let state = INITIAL;
  for (const step of steps) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: KeysState = { ...endOf(BEFORE_REVOKE), spoken: '' };

export const LOOP_AFTER_MS = 3200;
