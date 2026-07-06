import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  CODE_LENGTH,
  DEVICES,
  PROVIDERS,
  TODAY,
  type Provider,
  type ProviderId,
  type SignedInDevice,
} from './data';

/** Off, being set up, checking the first code, on, or asking before it goes off. */
export type TwoStep = 'off' | 'setup' | 'verifying' | 'on' | 'confirmingOff';

export type SecurityState = {
  providers: Provider[];
  /** The provider whose Disconnect waits for a confirm, because it is the last way in. */
  confirmingId: ProviderId | null;
  devices: SignedInDevice[];
  isConfirmingAll: boolean;
  twoStep: TwoStep;
  code: string;
  codeError: string | null;
  attempts: number;
  spoken: string;
};

export type SecurityAction =
  | { type: 'connectStarted'; id: ProviderId }
  | { type: 'connected'; id: ProviderId }
  | { type: 'disconnectAsked'; id: ProviderId }
  | { type: 'disconnectConfirmed'; id: ProviderId }
  | { type: 'disconnectCancelled' }
  | { type: 'signedOut'; id: string }
  | { type: 'signOutAllAsked' }
  | { type: 'signOutAllCancelled' }
  | { type: 'signOutAllConfirmed' }
  | { type: 'twoStepSwitched'; isOn: boolean }
  | { type: 'codeTyped'; value: string }
  | { type: 'verifyPressed' }
  | { type: 'verified' }
  | { type: 'turnOffConfirmed' };

type Step = SessionStep<SecurityState, SecurityAction>;

/** How long a provider takes to send the person back once they allowed the link. */
export const CONNECT_MS = 1100;

/** How long the first code takes to be checked. */
export const VERIFY_MS = 900;

export const INITIAL: SecurityState = {
  providers: PROVIDERS,
  confirmingId: null,
  devices: DEVICES,
  isConfirmingAll: false,
  twoStep: 'off',
  code: '',
  codeError: null,
  attempts: 0,
  spoken: '',
};

export function providerOf(state: SecurityState, id: ProviderId) {
  return state.providers.find((provider) => provider.id === id);
}

export function connectedCountOf(state: SecurityState) {
  const connected = state.providers.filter(
    (provider) => provider.status === 'connected'
  );
  return connected.length;
}

export function otherDevicesOf(state: SecurityState) {
  return state.devices.filter((device) => !device.isThisDevice);
}

export function isTwoStepSwitchedOn(twoStep: TwoStep) {
  const isOff = twoStep === 'off';
  const isAsking = twoStep === 'confirmingOff';
  return !isOff && !isAsking;
}

function withProvider(
  state: SecurityState,
  id: ProviderId,
  change: Partial<Provider>
): SecurityState {
  const providers = state.providers.map((provider) => {
    if (provider.id !== id) {
      return provider;
    }
    return { ...provider, ...change };
  });
  return { ...state, providers };
}

function connectStarted(state: SecurityState, id: ProviderId) {
  const provider = providerOf(state, id);
  if (provider?.status !== 'disconnected') {
    return state;
  }
  const next = withProvider(state, id, { status: 'connecting' });
  return {
    ...next,
    confirmingId: null,
    spoken: `Connecting ${provider.name}`,
  };
}

function connected(state: SecurityState, id: ProviderId) {
  const provider = providerOf(state, id);
  if (provider?.status !== 'connecting') {
    return state;
  }
  const next = withProvider(state, id, {
    status: 'connected',
    connectedSince: TODAY,
  });
  return { ...next, spoken: `${provider.name} connected` };
}

function disconnected(state: SecurityState, id: ProviderId): SecurityState {
  const provider = providerOf(state, id);
  if (provider?.status !== 'connected') {
    return state;
  }
  const next = withProvider(state, id, { status: 'disconnected' });
  return {
    ...next,
    confirmingId: null,
    spoken: `${provider.name} disconnected`,
  };
}

/** The last way in is never removed by one press: it asks first. */
function disconnectAsked(state: SecurityState, id: ProviderId) {
  const isLastWay = connectedCountOf(state) === 1;
  if (!isLastWay) {
    return disconnected(state, id);
  }
  const provider = providerOf(state, id);
  if (provider?.status !== 'connected') {
    return state;
  }
  return {
    ...state,
    confirmingId: id,
    spoken: `${provider.name} is your only way to sign in. Confirm to disconnect it`,
  };
}

function signedOut(state: SecurityState, id: string): SecurityState {
  const device = state.devices.find((candidate) => candidate.id === id);
  const canSignOut = device !== undefined && !device.isThisDevice;
  if (!canSignOut) {
    return state;
  }
  const devices = state.devices.filter((candidate) => candidate.id !== id);
  const hasOthersLeft = devices.some((candidate) => !candidate.isThisDevice);
  const isConfirmingAll = state.isConfirmingAll && hasOthersLeft;
  return {
    ...state,
    devices,
    isConfirmingAll,
    spoken: `Signed out of ${device.device}`,
  };
}

function signOutAllConfirmed(state: SecurityState): SecurityState {
  const others = otherDevicesOf(state);
  const devices = state.devices.filter((device) => device.isThisDevice);
  return {
    ...state,
    devices,
    isConfirmingAll: false,
    spoken: `Signed out of ${devicesWordOf(others.length)}`,
  };
}

export function devicesWordOf(count: number) {
  if (count === 1) {
    return '1 other device';
  }
  return `${count} other devices`;
}

function switchedOn(state: SecurityState): SecurityState {
  if (state.twoStep === 'off') {
    return {
      ...state,
      twoStep: 'setup',
      code: '',
      codeError: null,
      spoken: 'Two-step setup opened',
    };
  }
  if (state.twoStep === 'confirmingOff') {
    return {
      ...state,
      twoStep: 'on',
      spoken: 'Two-step verification stays on',
    };
  }
  return state;
}

/** Leaving the setup unfinished turns it off at once; turning it off once it is on asks first. */
function switchedOff(state: SecurityState): SecurityState {
  if (state.twoStep === 'on') {
    return {
      ...state,
      twoStep: 'confirmingOff',
      spoken: 'Confirm to turn off two-step verification',
    };
  }
  const isSettingUp = state.twoStep === 'setup';
  if (isSettingUp) {
    return { ...state, twoStep: 'off', spoken: 'Two-step setup closed' };
  }
  return state;
}

function twoStepSwitched(state: SecurityState, isOn: boolean) {
  if (isOn) {
    return switchedOn(state);
  }
  return switchedOff(state);
}

function verifyPressed(state: SecurityState): SecurityState {
  if (state.twoStep !== 'setup') {
    return state;
  }
  const isComplete = state.code.length === CODE_LENGTH;
  if (!isComplete) {
    const problem = `Enter the ${CODE_LENGTH} digits your app shows`;
    return {
      ...state,
      codeError: problem,
      attempts: state.attempts + 1,
      spoken: problem,
    };
  }
  return { ...state, twoStep: 'verifying', spoken: 'Checking the code' };
}

function verified(state: SecurityState): SecurityState {
  if (state.twoStep !== 'verifying') {
    return state;
  }
  return {
    ...state,
    twoStep: 'on',
    code: '',
    spoken: 'Two-step verification is on',
  };
}

export function reducer(
  state: SecurityState,
  action: SecurityAction
): SecurityState {
  switch (action.type) {
    case 'connectStarted':
      return connectStarted(state, action.id);
    case 'connected':
      return connected(state, action.id);
    case 'disconnectAsked':
      return disconnectAsked(state, action.id);
    case 'disconnectConfirmed':
      return disconnected(state, action.id);
    case 'disconnectCancelled':
      return { ...state, confirmingId: null, spoken: '' };
    case 'signedOut':
      return signedOut(state, action.id);
    case 'signOutAllAsked':
      return { ...state, isConfirmingAll: true };
    case 'signOutAllCancelled':
      return { ...state, isConfirmingAll: false };
    case 'signOutAllConfirmed':
      return signOutAllConfirmed(state);
    case 'twoStepSwitched':
      return twoStepSwitched(state, action.isOn);
    case 'codeTyped':
      return { ...state, code: action.value, codeError: null };
    case 'verifyPressed':
      return verifyPressed(state);
    case 'verified':
      return verified(state);
    case 'turnOffConfirmed':
      return {
        ...state,
        twoStep: 'off',
        spoken: 'Two-step verification is off',
      };
  }
}

const DIGIT_MS = 130;

const SAMPLE_CODE = '428913';

function codeSteps(startAfter: number): Step[] {
  const prefixes = prefixesOf(SAMPLE_CODE);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, DIGIT_MS),
    by: 'demo',
    action: { type: 'codeTyped', value },
  }));
}

/**
 * The demonstration tries to drop the last way in and keeps it, connects a second account, signs
 * out a device it does not use, then sets up two-step and types the first code. That is where the
 * page rests under reduced motion: every section in use, the code ready to send.
 */
const BEFORE_VERIFY: Step[] = [
  {
    after: 1300,
    by: 'demo',
    press: 'disconnect-google',
    action: { type: 'disconnectAsked', id: 'google' },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'keep-google',
    action: { type: 'disconnectCancelled' },
  },
  {
    after: 900,
    by: 'demo',
    press: 'connect-github',
    action: { type: 'connectStarted', id: 'github' },
  },
  { after: CONNECT_MS, action: { type: 'connected', id: 'github' } },
  {
    after: 1400,
    by: 'demo',
    press: 'sign-out-windows',
    action: { type: 'signedOut', id: 'windows' },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'two-step',
    action: { type: 'twoStepSwitched', isOn: true },
  },
  ...codeSteps(1300),
];

export const SCRIPT: Step[] = [
  ...BEFORE_VERIFY,
  {
    after: 600,
    by: 'demo',
    press: 'verify',
    action: { type: 'verifyPressed' },
  },
  { after: VERIFY_MS, action: { type: 'verified' } },
];

function endOf(steps: Step[]) {
  let state = INITIAL;
  for (const step of steps) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: SecurityState = { ...endOf(BEFORE_VERIFY), spoken: '' };

export const LOOP_AFTER_MS = 3400;
