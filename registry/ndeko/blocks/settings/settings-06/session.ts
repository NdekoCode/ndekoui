import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { LICENSES, NEXT_KEYS, type License, type LicenseId } from './data';

export type LicenseState = {
  licenses: License[];
  revealedIds: LicenseId[];
  copiedId: LicenseId | null;
  /** The license whose Regenerate waits for a confirm, in place under its key. */
  confirmingId: LicenseId | null;
  regeneratingId: LicenseId | null;
  /** Licenses whose key was made since the page loaded: their line says the old key stopped. */
  freshIds: LicenseId[];
  /** Keys made per license since the page loaded. A sign-in counted for an older key is ignored. */
  made: Record<LicenseId, number>;
  spoken: string;
};

export type LicenseAction =
  | { type: 'revealToggled'; id: LicenseId }
  | { type: 'copied'; id: LicenseId }
  | { type: 'copyFaded' }
  | { type: 'copyFailed' }
  | { type: 'regenerateToggled'; id: LicenseId }
  | { type: 'regenerateCancelled' }
  | { type: 'regenerateConfirmed'; id: LicenseId }
  | { type: 'regenerated'; id: LicenseId }
  | { type: 'activated'; id: LicenseId; used: number; round: number };

type Step = SessionStep<LicenseState, LicenseAction>;

/** How long a new key takes to be issued. */
export const REGENERATE_MS = 900;

/** How long Copy shows its check. */
export const COPIED_MS = 1600;

/** The waits between the machines that come back with a new key: a third, two thirds, then all. */
export const RETURN_GAPS_MS = [1500, 1300, 1200];

export const INITIAL: LicenseState = {
  licenses: LICENSES,
  revealedIds: [],
  copiedId: null,
  confirmingId: null,
  regeneratingId: null,
  freshIds: [],
  made: { desktop: 0, server: 0 },
  spoken: '',
};

export function licenseOf(state: LicenseState, id: LicenseId) {
  return state.licenses.find((license) => license.id === id);
}

export function keyTextOf(groups: string[]) {
  return groups.join('-');
}

export function returnsOf(used: number) {
  const first = Math.ceil(used / 3);
  const second = Math.ceil((used * 2) / 3);
  return [first, second, used];
}

function withLicense(
  state: LicenseState,
  id: LicenseId,
  change: Partial<License>
): LicenseState {
  const licenses = state.licenses.map((license) => {
    if (license.id !== id) {
      return license;
    }
    return { ...license, ...change };
  });
  return { ...state, licenses };
}

function revealToggled(state: LicenseState, id: LicenseId): LicenseState {
  const license = licenseOf(state, id);
  if (!license) {
    return state;
  }
  const isRevealed = state.revealedIds.includes(id);
  if (isRevealed) {
    const revealedIds = state.revealedIds.filter((other) => other !== id);
    return {
      ...state,
      revealedIds,
      spoken: `Key for ${license.product} hidden`,
    };
  }
  const revealedIds = [...state.revealedIds, id];
  return { ...state, revealedIds, spoken: `Key for ${license.product} shown` };
}

function regenerateToggled(state: LicenseState, id: LicenseId): LicenseState {
  const isBusy = state.regeneratingId !== null;
  if (isBusy) {
    return state;
  }
  if (state.confirmingId === id) {
    return { ...state, confirmingId: null, spoken: '' };
  }
  return {
    ...state,
    confirmingId: id,
    spoken: 'The old key stops working once a new one is made. Confirm below',
  };
}

function regenerateConfirmed(state: LicenseState, id: LicenseId): LicenseState {
  if (state.confirmingId !== id) {
    return state;
  }
  return {
    ...state,
    confirmingId: null,
    regeneratingId: id,
    spoken: 'Making a new key',
  };
}

function nextGroupsOf(id: LicenseId, made: number) {
  const keys = NEXT_KEYS[id];
  const index = made % keys.length;
  return keys[index];
}

function without(ids: LicenseId[], id: LicenseId) {
  return ids.filter((other) => other !== id);
}

/** Every machine signs in again with the new key, so the places in use start from none. */
function regenerated(state: LicenseState, id: LicenseId): LicenseState {
  const license = licenseOf(state, id);
  const isMaking = state.regeneratingId === id;
  if (!license || !isMaking) {
    return state;
  }
  const groups = nextGroupsOf(id, state.made[id]);
  const next = withLicense(state, id, { groups, used: 0 });
  return {
    ...next,
    regeneratingId: null,
    revealedIds: [...without(state.revealedIds, id), id],
    freshIds: [...without(state.freshIds, id), id],
    made: { ...state.made, [id]: state.made[id] + 1 },
    spoken: `New key for ${license.product}. The old one no longer works`,
  };
}

function activated(
  state: LicenseState,
  id: LicenseId,
  used: number,
  round: number
): LicenseState {
  const license = licenseOf(state, id);
  const isCurrentKey = state.made[id] === round;
  if (!license || !isCurrentKey) {
    return state;
  }
  const capped = Math.min(used, license.limit);
  return withLicense(state, id, { used: capped });
}

export function reducer(
  state: LicenseState,
  action: LicenseAction
): LicenseState {
  switch (action.type) {
    case 'revealToggled':
      return revealToggled(state, action.id);
    case 'copied':
      return { ...state, copiedId: action.id, spoken: 'Key copied' };
    case 'copyFaded':
      return { ...state, copiedId: null };
    case 'copyFailed':
      return {
        ...state,
        spoken: 'Copy did not work. Show the key and copy it by hand',
      };
    case 'regenerateToggled':
      return regenerateToggled(state, action.id);
    case 'regenerateCancelled':
      return { ...state, confirmingId: null, spoken: 'The key stays as it is' };
    case 'regenerateConfirmed':
      return regenerateConfirmed(state, action.id);
    case 'regenerated':
      return regenerated(state, action.id);
    case 'activated':
      return activated(state, action.id, action.used, action.round);
  }
}

const DESKTOP_USED = licenseOf(INITIAL, 'desktop')?.used ?? 0;

const DESKTOP_RETURNS = returnsOf(DESKTOP_USED);

/** The key is hidden again while the last machines are still coming back. */
const HIDE_AFTER_MS = 600;

function desktopReturned(index: number): LicenseAction {
  const used = DESKTOP_RETURNS[index];
  return { type: 'activated', id: 'desktop', used, round: 1 };
}

/**
 * The key is shown and copied, then Regenerate asks first. That is where the page rests under
 * reduced motion: the key in full and the warning that the old one stops.
 */
const BEFORE_CONFIRM: Step[] = [
  {
    after: 1200,
    by: 'demo',
    press: 'reveal-desktop',
    action: { type: 'revealToggled', id: 'desktop' },
  },
  {
    after: 1300,
    by: 'demo',
    press: 'copy-desktop',
    action: { type: 'copied', id: 'desktop' },
  },
  { after: COPIED_MS, action: { type: 'copyFaded' } },
  {
    after: 700,
    by: 'demo',
    press: 'regenerate-desktop',
    action: { type: 'regenerateToggled', id: 'desktop' },
  },
];

export const SCRIPT: Step[] = [
  ...BEFORE_CONFIRM,
  {
    after: 1900,
    by: 'demo',
    press: 'confirm-desktop',
    action: { type: 'regenerateConfirmed', id: 'desktop' },
  },
  { after: REGENERATE_MS, action: { type: 'regenerated', id: 'desktop' } },
  { after: RETURN_GAPS_MS[0], action: desktopReturned(0) },
  { after: RETURN_GAPS_MS[1], action: desktopReturned(1) },
  {
    after: HIDE_AFTER_MS,
    by: 'demo',
    press: 'reveal-desktop',
    action: { type: 'revealToggled', id: 'desktop' },
  },
  { after: RETURN_GAPS_MS[2] - HIDE_AFTER_MS, action: desktopReturned(2) },
];

function endOf(steps: Step[]) {
  let state = INITIAL;
  for (const step of steps) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: LicenseState = { ...endOf(BEFORE_CONFIRM), spoken: '' };

export const LOOP_AFTER_MS = 3200;
