import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  CODE_LENGTH,
  PREVIEW_CODE,
  PROVIDERS,
  WORKSPACES,
  type ProviderId,
  type Workspace,
} from './data';

export type AuthStep = 'start' | 'code' | 'workspace' | 'opening' | 'done';

export type AuthState = {
  step: AuthStep;
  email: string;
  emailError: string | null;
  isSending: boolean;
  /** The provider whose button is waiting for the person to come back. */
  connecting: ProviderId | null;
  /** Who the person is signed in as, once they are. */
  account: string;
  code: string;
  codeError: string | null;
  isChecking: boolean;
  isResent: boolean;
  /** Counts the refused entries, so a message that comes back nudges again. */
  attempts: number;
  workspaces: Workspace[];
  pickedId: string | null;
  isCreating: boolean;
  newName: string;
  newNameError: string | null;
  spoken: string;
};

export type AuthAction =
  | { type: 'emailTyped'; value: string }
  | { type: 'codeRequested' }
  | { type: 'codeSent' }
  | { type: 'providerPressed'; id: ProviderId }
  | { type: 'providerReturned'; id: ProviderId }
  | { type: 'codeTyped'; value: string }
  | { type: 'codeSubmitted' }
  | { type: 'codeChecked' }
  | { type: 'resendPressed' }
  | { type: 'resendFaded' }
  | { type: 'restarted' }
  | { type: 'workspacePicked'; id: string }
  | { type: 'opened' }
  | { type: 'createToggled' }
  | { type: 'newNameTyped'; value: string }
  | { type: 'createSubmitted' }
  | { type: 'switchPressed' };

type Step = SessionStep<AuthState, AuthAction>;

/** How long the email with the code takes to leave. */
export const SEND_MS = 900;

/** How long a code takes to be checked. */
export const CHECK_MS = 800;

/** How long a provider takes to send the person back. */
export const PROVIDER_MS = 1100;

/** How long a workspace takes to open. */
export const OPEN_MS = 1400;

/** How long "New code sent" stays on the button. */
export const RESENT_MS = 1600;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const INITIAL: AuthState = {
  step: 'start',
  email: '',
  emailError: null,
  isSending: false,
  connecting: null,
  account: '',
  code: '',
  codeError: null,
  isChecking: false,
  isResent: false,
  attempts: 0,
  workspaces: WORKSPACES,
  pickedId: null,
  isCreating: false,
  newName: '',
  newNameError: null,
  spoken: '',
};

export function workspaceOf(state: AuthState, id: string | null) {
  return state.workspaces.find((workspace) => workspace.id === id);
}

function providerOf(id: ProviderId) {
  return PROVIDERS.find((provider) => provider.id === id);
}

function emailProblemOf(email: string) {
  const trimmed = email.trim();
  if (trimmed === '') {
    return 'Enter your work email';
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Enter an email like name@company.com';
  }
  return null;
}

function moved(state: AuthState, step: AuthStep, spoken: string): AuthState {
  return { ...state, step, spoken };
}

function refused(
  state: AuthState,
  change: Partial<AuthState>,
  problem: string
): AuthState {
  return {
    ...state,
    ...change,
    attempts: state.attempts + 1,
    spoken: problem,
  };
}

function isBusy(state: AuthState) {
  const isWaiting = state.isSending || state.isChecking;
  const isConnecting = state.connecting !== null;
  return isWaiting || isConnecting;
}

function codeRequested(state: AuthState): AuthState {
  const isOnStart = state.step === 'start';
  if (!isOnStart || isBusy(state)) {
    return state;
  }
  const problem = emailProblemOf(state.email);
  if (problem) {
    return refused(state, { emailError: problem }, problem);
  }
  return { ...state, isSending: true, spoken: 'Sending the code' };
}

function codeSent(state: AuthState): AuthState {
  if (!state.isSending) {
    return state;
  }
  const email = state.email.trim();
  const next = { ...state, isSending: false, code: '', codeError: null };
  return moved(next, 'code', `Code sent to ${email}`);
}

function providerPressed(state: AuthState, id: ProviderId): AuthState {
  const isOnStart = state.step === 'start';
  if (!isOnStart || isBusy(state)) {
    return state;
  }
  const provider = providerOf(id);
  if (!provider) {
    return state;
  }
  return { ...state, connecting: id, spoken: `Waiting for ${provider.name}` };
}

function providerReturned(state: AuthState, id: ProviderId): AuthState {
  const provider = providerOf(id);
  const isWaiting = state.connecting === id;
  if (!provider || !isWaiting) {
    return state;
  }
  const next = { ...state, connecting: null, account: provider.account };
  return moved(next, 'workspace', 'Signed in. Pick a workspace');
}

function codeSubmitted(state: AuthState): AuthState {
  const isOnCode = state.step === 'code';
  if (!isOnCode || state.isChecking) {
    return state;
  }
  const isComplete = state.code.length === CODE_LENGTH;
  if (!isComplete) {
    const problem = `Enter the ${CODE_LENGTH} digits from the email`;
    return refused(state, { codeError: problem }, problem);
  }
  return { ...state, isChecking: true, spoken: 'Checking the code' };
}

function codeChecked(state: AuthState): AuthState {
  if (!state.isChecking) {
    return state;
  }
  const isRight = state.code === PREVIEW_CODE;
  if (!isRight) {
    const problem =
      'That code does not match. Check the latest email or send a new one';
    const change = { isChecking: false, code: '', codeError: problem };
    return refused(state, change, problem);
  }
  const next = { ...state, isChecking: false, account: state.email.trim() };
  return moved(next, 'workspace', 'Signed in. Pick a workspace');
}

/** The code being checked stays: clearing it would fail a check of the right code. */
function resendPressed(state: AuthState): AuthState {
  if (state.isChecking) {
    return state;
  }
  return {
    ...state,
    isResent: true,
    code: '',
    codeError: null,
    spoken: 'A new code is on its way',
  };
}

function workspacePicked(state: AuthState, id: string): AuthState {
  const workspace = workspaceOf(state, id);
  const isOnList = state.step === 'workspace';
  if (!workspace || !isOnList) {
    return state;
  }
  const next = { ...state, pickedId: id, isCreating: false };
  return moved(next, 'opening', `Opening ${workspace.name}`);
}

function opened(state: AuthState): AuthState {
  const workspace = workspaceOf(state, state.pickedId);
  const isOpening = state.step === 'opening';
  if (!workspace || !isOpening) {
    return state;
  }
  return moved(state, 'done', `You are in ${workspace.name}`);
}

function slugOf(name: string) {
  const lowered = name.toLowerCase();
  const joined = lowered.replace(/[^a-z0-9]+/g, '-');
  return joined.replace(/^-|-$/g, '');
}

function newNameProblemOf(state: AuthState, name: string) {
  if (name === '') {
    return 'Name the workspace, for example after your team';
  }
  const lowered = name.toLowerCase();
  const isTaken = state.workspaces.some(
    (workspace) => workspace.name.toLowerCase() === lowered
  );
  if (isTaken) {
    return `You are already in ${name}. Pick it above`;
  }
  return null;
}

/** A workspace made here has one member, the person, and opens straight away. */
function createSubmitted(state: AuthState): AuthState {
  const name = state.newName.trim();
  const problem = newNameProblemOf(state, name);
  if (problem) {
    return refused(state, { newNameError: problem }, problem);
  }
  const id = `${slugOf(name)}-${state.workspaces.length + 1}`;
  const workspace: Workspace = { id, name, members: 1 };
  const next = {
    ...state,
    workspaces: [...state.workspaces, workspace],
    pickedId: id,
    isCreating: false,
    newName: '',
  };
  return moved(next, 'opening', `Creating and opening ${name}`);
}

export function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'emailTyped':
      return { ...state, email: action.value, emailError: null };
    case 'codeRequested':
      return codeRequested(state);
    case 'codeSent':
      return codeSent(state);
    case 'providerPressed':
      return providerPressed(state, action.id);
    case 'providerReturned':
      return providerReturned(state, action.id);
    case 'codeTyped':
      return { ...state, code: action.value, codeError: null };
    case 'codeSubmitted':
      return codeSubmitted(state);
    case 'codeChecked':
      return codeChecked(state);
    case 'resendPressed':
      return resendPressed(state);
    case 'resendFaded':
      return { ...state, isResent: false };
    case 'restarted':
      return { ...INITIAL, email: state.email, spoken: 'Sign in again' };
    case 'workspacePicked':
      return workspacePicked(state, action.id);
    case 'opened':
      return opened(state);
    case 'createToggled':
      return {
        ...state,
        isCreating: !state.isCreating,
        newName: '',
        newNameError: null,
      };
    case 'newNameTyped':
      return { ...state, newName: action.value, newNameError: null };
    case 'createSubmitted':
      return createSubmitted(state);
    case 'switchPressed':
      return moved(state, 'workspace', 'Pick a workspace');
  }
}

const KEY_MS = 45;

const DIGIT_MS = 130;

const EMAIL = 'dana@tidewell.example';

function emailSteps(startAfter: number): Step[] {
  const prefixes = prefixesOf(EMAIL);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'emailTyped', value },
  }));
}

function codeSteps(startAfter: number): Step[] {
  const prefixes = prefixesOf(PREVIEW_CODE);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, DIGIT_MS),
    by: 'demo',
    action: { type: 'codeTyped', value },
  }));
}

/**
 * The email, the code it brings, then the workspaces. That is where the page rests under reduced
 * motion: signed in, every workspace and the way to make one in sight.
 */
const TO_WORKSPACES: Step[] = [
  ...emailSteps(1200),
  { after: 450, by: 'demo', press: 'send', action: { type: 'codeRequested' } },
  { after: SEND_MS, action: { type: 'codeSent' } },
  ...codeSteps(1100),
  {
    after: 450,
    by: 'demo',
    press: 'sign-in',
    action: { type: 'codeSubmitted' },
  },
  { after: CHECK_MS, action: { type: 'codeChecked' } },
];

export const SCRIPT: Step[] = [
  ...TO_WORKSPACES,
  {
    after: 1700,
    by: 'demo',
    press: 'workspace-brightmoor',
    action: { type: 'workspacePicked', id: 'brightmoor' },
  },
  { after: OPEN_MS, action: { type: 'opened' } },
];

function endOf(steps: Step[]) {
  let state = INITIAL;
  for (const step of steps) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: AuthState = { ...endOf(TO_WORKSPACES), spoken: '' };

export const LOOP_AFTER_MS = 3000;
