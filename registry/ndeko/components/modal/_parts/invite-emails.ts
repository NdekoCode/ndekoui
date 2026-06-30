import {
  AlertCircleIcon,
  ClockIcon,
  UserIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

/** What sending does to an address: a new invitation, the e-mail again for a pending one, nothing for a member or a typo. */
export type AddressState = 'new' | 'pending' | 'member' | 'invalid';

export type AddressEntry = { email: string; state: AddressState };

export type AddressLook = { color: string; icon: Icon | null; hint: string };

export const ADDRESS_LOOK: Record<AddressState, AddressLook> = {
  new: { color: 'var(--muted-foreground)', icon: null, hint: '' },
  pending: {
    color: 'var(--warning)',
    icon: ClockIcon,
    hint: 'Already invited: they get the e-mail again',
  },
  member: {
    color: 'var(--muted-foreground)',
    icon: UserIcon,
    hint: 'Already in the team: not invited again',
  },
  invalid: {
    color: 'var(--destructive)',
    icon: AlertCircleIcon,
    hint: 'Not a valid e-mail address',
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOKEN_SEPARATORS = /[\s,;<>"'()]+/;

export function isEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

function normalizeAddress(value: string) {
  const trimmed = value.trim();
  return trimmed.toLowerCase();
}

/**
 * The addresses in what was typed or pasted, without repeats. When the text holds an address, the words around it
 * are names copied from a mail client and are left out.
 */
export function splitAddresses(text: string) {
  const tokens = text.split(TOKEN_SEPARATORS);
  const holdsAnAddress = text.includes('@');
  const addresses: string[] = [];
  for (const token of tokens) {
    const address = normalizeAddress(token);
    const isEmpty = address.length === 0;
    const isNameAround = holdsAnAddress && !address.includes('@');
    const isRepeat = addresses.includes(address);
    if (isEmpty || isNameAround || isRepeat) {
      continue;
    }
    addresses.push(address);
  }
  return addresses;
}

export function mergeAddresses(current: string[], added: string[]) {
  const merged = [...current];
  for (const address of added) {
    if (!merged.includes(address)) {
      merged.push(address);
    }
  }
  return merged;
}

export type AddressContext = {
  memberEmails: ReadonlySet<string>;
  pendingEmails: ReadonlySet<string>;
};

export function stateOfAddress(
  email: string,
  context: AddressContext
): AddressState {
  if (!isEmail(email)) {
    return 'invalid';
  }
  if (context.memberEmails.has(email)) {
    return 'member';
  }
  if (context.pendingEmails.has(email)) {
    return 'pending';
  }
  return 'new';
}

export function isSendable(state: AddressState) {
  const isNew = state === 'new';
  const isPending = state === 'pending';
  return isNew || isPending;
}

export function countOf(entries: AddressEntry[], state: AddressState) {
  return entries.filter((entry) => entry.state === state).length;
}
