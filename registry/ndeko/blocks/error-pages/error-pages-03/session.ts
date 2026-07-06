import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

export type NotifyStatus = 'idle' | 'saving' | 'confirmed';

export type NotifyState = {
  email: string;
  status: NotifyStatus;
  /** Why the address was refused, shown under the field until it is edited. */
  error: string | null;
  /** Counts the refusals, so the same reason refused twice nudges twice. */
  refusals: number;
  spoken: string;
};

export type NotifyAction =
  | { type: 'typed'; value: string }
  | { type: 'submitted' }
  | { type: 'saved' }
  | { type: 'edited' };

type Step = SessionStep<NotifyState, NotifyAction>;

export const SAVE_MS = 1200;

const ENDING = /\.[^\s.@]{2,}$/;

export const INITIAL: NotifyState = {
  email: '',
  status: 'idle',
  error: null,
  refusals: 0,
  spoken: '',
};

export function errorOf(email: string) {
  const address = email.trim();
  if (address === '') {
    return 'Enter the address we should write to';
  }
  const parts = address.split('@');
  const [name, domain] = parts;
  const hasOneAt = parts.length === 2;
  const hasName = name !== '';
  const hasDomain = domain !== undefined && domain !== '';
  const isShaped = hasOneAt && hasName && hasDomain;
  if (!isShaped) {
    return 'An address has a name, an @ and a domain, like maya@clinic.com';
  }
  if (!ENDING.test(domain)) {
    return 'Add the ending of the address, such as .com';
  }
  return null;
}

function submitted(state: NotifyState): NotifyState {
  if (state.status !== 'idle') {
    return state;
  }
  const error = errorOf(state.email);
  if (error !== null) {
    return {
      ...state,
      error,
      refusals: state.refusals + 1,
      spoken: error,
    };
  }
  return { ...state, status: 'saving', spoken: 'Saving your address' };
}

function saved(state: NotifyState): NotifyState {
  if (state.status !== 'saving') {
    return state;
  }
  const address = state.email.trim();
  return {
    ...state,
    status: 'confirmed',
    spoken: `We will email ${address} when booking opens again`,
  };
}

export function reducer(state: NotifyState, action: NotifyAction): NotifyState {
  switch (action.type) {
    case 'typed':
      return { ...state, email: action.value, error: null };
    case 'submitted':
      return submitted(state);
    case 'saved':
      return saved(state);
    case 'edited':
      return { ...state, status: 'idle', spoken: '' };
  }
}

const KEY_MS = 65;

const FIRST_TRY = 'maya@harbourphysio';

const FIXED = `${FIRST_TRY}.com`;

function typing(text: string, from: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value: `${from}${value}` },
  }));
}

/**
 * A person leaves out the ending of the address and is told so, adds it, and is put on the list.
 * The address is saved on its own once it is sent.
 */
export const SCRIPT: Step[] = [
  ...typing(FIRST_TRY, '', 1600),
  { after: 650, by: 'demo', press: 'notify', action: { type: 'submitted' } },
  ...typing('.com', FIRST_TRY, 1500),
  { after: 600, by: 'demo', press: 'notify', action: { type: 'submitted' } },
];

/** Under reduced motion the address is on the list, with the way back to the form. */
export const RESTING: NotifyState = {
  email: FIXED,
  status: 'confirmed',
  error: null,
  refusals: 1,
  spoken: '',
};

export const LOOP_AFTER_MS = SAVE_MS + 3600;
