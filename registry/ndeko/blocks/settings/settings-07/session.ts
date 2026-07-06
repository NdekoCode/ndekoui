import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  CARD,
  CARD_BRAND_NAME,
  METERS,
  PLANS,
  RENEWAL_DATE,
  type Card,
  type CardBrand,
  type MeterId,
  type PlanId,
} from './data';

export type DownloadStatus = 'idle' | 'busy' | 'done';

export type CardField = 'number' | 'expiry' | 'cvc';

export type CardDraft = Record<CardField, string>;

export type CardErrors = Partial<Record<CardField, string>>;

export type BillingState = {
  planId: PlanId;
  /** The plan ends with its term instead of renewing. */
  isCancelling: boolean;
  isConfirmingCancel: boolean;
  isChoosingPlan: boolean;
  pickedPlanId: PlanId;
  isSwitchingPlan: boolean;
  used: Record<MeterId, number>;
  card: Card;
  isEditingCard: boolean;
  cardDraft: CardDraft;
  cardErrors: CardErrors;
  /** Counts the refused saves, so a message that comes back nudges again. */
  cardAttempts: number;
  isSavingCard: boolean;
  downloads: Record<string, DownloadStatus>;
  spoken: string;
};

export type BillingAction =
  | { type: 'chooserToggled' }
  | { type: 'planPicked'; planId: PlanId }
  | { type: 'switchPressed' }
  | { type: 'planSwitched' }
  | { type: 'cancelAsked' }
  | { type: 'cancelKept' }
  | { type: 'cancelConfirmed' }
  | { type: 'resumed' }
  | { type: 'usageAdded'; id: MeterId; amount: number }
  | { type: 'cardEditToggled' }
  | { type: 'cardTyped'; field: CardField; value: string }
  | { type: 'cardSavePressed' }
  | { type: 'cardSaved' }
  | { type: 'downloadStarted'; id: string }
  | { type: 'downloadDone'; id: string }
  | { type: 'downloadFaded'; id: string };

type Step = SessionStep<BillingState, BillingAction>;

/** How long a change of plan takes to apply. */
export const SWITCH_MS = 900;

/** How long a new card takes to be checked. */
export const SAVE_CARD_MS = 900;

/** How long an invoice takes to be prepared. */
export const DOWNLOAD_MS = 700;

/** How long Downloaded stays before the button is ready again. */
export const DOWNLOADED_MS = 1600;

const EMPTY_DRAFT: CardDraft = { number: '', expiry: '', cvc: '' };

const FIELD_ORDER: CardField[] = ['number', 'expiry', 'cvc'];

/** The month the sample lives in: a card that ends before it has expired. */
const THIS_YEAR = 26;

const THIS_MONTH = 11;

function usedOf() {
  const used: Record<MeterId, number> = { seats: 0, storage: 0, runs: 0 };
  for (const meter of METERS) {
    used[meter.id] = meter.used;
  }
  return used;
}

export const INITIAL: BillingState = {
  planId: 'team',
  isCancelling: false,
  isConfirmingCancel: false,
  isChoosingPlan: false,
  pickedPlanId: 'team',
  isSwitchingPlan: false,
  used: usedOf(),
  card: CARD,
  isEditingCard: false,
  cardDraft: EMPTY_DRAFT,
  cardErrors: {},
  cardAttempts: 0,
  isSavingCard: false,
  downloads: {},
  spoken: '',
};

export function planOf(planId: PlanId) {
  const plan = PLANS.find((candidate) => candidate.id === planId);
  return plan ?? PLANS[0];
}

/** A plan with fewer seats than the people already in the workspace cannot be picked. */
export function isTooSmall(planId: PlanId, seatsUsed: number) {
  return planOf(planId).seats < seatsUsed;
}

function chooserToggled(state: BillingState): BillingState {
  if (state.isSwitchingPlan) {
    return state;
  }
  return {
    ...state,
    isChoosingPlan: !state.isChoosingPlan,
    pickedPlanId: state.planId,
    isConfirmingCancel: false,
  };
}

function planPicked(state: BillingState, planId: PlanId): BillingState {
  const isBlocked = isTooSmall(planId, state.used.seats);
  if (isBlocked) {
    return state;
  }
  return { ...state, pickedPlanId: planId };
}

function switchPressed(state: BillingState): BillingState {
  const isSamePlan = state.pickedPlanId === state.planId;
  if (isSamePlan) {
    return state;
  }
  const name = planOf(state.pickedPlanId).name;
  return {
    ...state,
    isSwitchingPlan: true,
    spoken: `Switching to the ${name} plan`,
  };
}

/** Picking a plan also answers a pending cancellation: the new plan renews. */
function planSwitched(state: BillingState): BillingState {
  if (!state.isSwitchingPlan) {
    return state;
  }
  const name = planOf(state.pickedPlanId).name;
  return {
    ...state,
    planId: state.pickedPlanId,
    isSwitchingPlan: false,
    isChoosingPlan: false,
    isCancelling: false,
    spoken: `You are on the ${name} plan from now on`,
  };
}

function cancelAsked(state: BillingState): BillingState {
  const isPaid = planOf(state.planId).price > 0;
  const canCancel = isPaid && !state.isCancelling;
  if (!canCancel) {
    return state;
  }
  return {
    ...state,
    isConfirmingCancel: true,
    isChoosingPlan: false,
    spoken: 'Confirm below to cancel the subscription',
  };
}

function cancelConfirmed(state: BillingState): BillingState {
  if (!state.isConfirmingCancel) {
    return state;
  }
  const name = planOf(state.planId).name;
  return {
    ...state,
    isCancelling: true,
    isConfirmingCancel: false,
    spoken: `${name} plan cancelled. It stays active until ${RENEWAL_DATE}`,
  };
}

function resumed(state: BillingState): BillingState {
  if (!state.isCancelling) {
    return state;
  }
  const name = planOf(state.planId).name;
  return {
    ...state,
    isCancelling: false,
    spoken: `${name} plan resumed. It renews on ${RENEWAL_DATE}`,
  };
}

function usageAdded(
  state: BillingState,
  id: MeterId,
  amount: number
): BillingState {
  const used = { ...state.used, [id]: state.used[id] + amount };
  return { ...state, used };
}

function cardEditToggled(state: BillingState): BillingState {
  if (state.isSavingCard) {
    return state;
  }
  return {
    ...state,
    isEditingCard: !state.isEditingCard,
    cardDraft: EMPTY_DRAFT,
    cardErrors: {},
  };
}

function cardTyped(
  state: BillingState,
  field: CardField,
  value: string
): BillingState {
  const cardDraft = { ...state.cardDraft, [field]: value };
  const cardErrors = { ...state.cardErrors };
  delete cardErrors[field];
  return { ...state, cardDraft, cardErrors };
}

export function digitsOf(value: string) {
  return value.replace(/\D/g, '');
}

function isAmexStart(digits: string) {
  const isThirtyFour = digits.startsWith('34');
  const isThirtySeven = digits.startsWith('37');
  return isThirtyFour || isThirtySeven;
}

export function brandOf(digits: string): CardBrand | null {
  if (digits.startsWith('4')) {
    return 'visa';
  }
  if (/^(5[1-5]|2[2-7])/.test(digits)) {
    return 'mastercard';
  }
  if (isAmexStart(digits)) {
    return 'americanexpress';
  }
  return null;
}

function numberLengthOf(brand: CardBrand) {
  if (brand === 'americanexpress') {
    return 15;
  }
  return 16;
}

function codeLengthOf(brand: CardBrand | null) {
  if (brand === 'americanexpress') {
    return 4;
  }
  return 3;
}

function numberProblemOf(digits: string, brand: CardBrand | null) {
  if (digits === '') {
    return 'Enter the card number';
  }
  if (!brand) {
    return 'Use a Visa, Mastercard or American Express card';
  }
  const length = numberLengthOf(brand);
  if (digits.length !== length) {
    return `Enter the ${length} digits on the front of the card`;
  }
  return null;
}

function hasEnded(month: number, year: number) {
  const isPastYear = year < THIS_YEAR;
  const isPastMonth = year === THIS_YEAR && month < THIS_MONTH;
  return isPastYear || isPastMonth;
}

function expiryProblemOf(expiry: string) {
  const trimmed = expiry.trim();
  const match = trimmed.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) {
    return 'Enter the date as MM/YY';
  }
  const month = Number(match[1]);
  const year = Number(match[2]);
  const isMonth = month >= 1 && month <= 12;
  if (!isMonth) {
    return 'Enter a month from 01 to 12';
  }
  if (hasEnded(month, year)) {
    return 'This card has expired';
  }
  return null;
}

function codeProblemOf(code: string, brand: CardBrand | null) {
  const length = codeLengthOf(brand);
  const digits = digitsOf(code);
  const trimmed = code.trim();
  const isOnlyDigits = trimmed === digits;
  const isRightLength = digits.length === length;
  const isComplete = isRightLength && isOnlyDigits;
  if (isComplete) {
    return null;
  }
  return `Enter the ${length} digits of the security code`;
}

export function cardErrorsOf(draft: CardDraft): CardErrors {
  const digits = digitsOf(draft.number);
  const brand = brandOf(digits);
  const errors: CardErrors = {};
  const numberProblem = numberProblemOf(digits, brand);
  const expiryProblem = expiryProblemOf(draft.expiry);
  const codeProblem = codeProblemOf(draft.cvc, brand);
  if (numberProblem) {
    errors.number = numberProblem;
  }
  if (expiryProblem) {
    errors.expiry = expiryProblem;
  }
  if (codeProblem) {
    errors.cvc = codeProblem;
  }
  return errors;
}

export function firstCardErrorOf(errors: CardErrors) {
  const field = FIELD_ORDER.find((candidate) => Boolean(errors[candidate]));
  return field ?? null;
}

function cardSavePressed(state: BillingState): BillingState {
  const isOpen = state.isEditingCard && !state.isSavingCard;
  if (!isOpen) {
    return state;
  }
  const errors = cardErrorsOf(state.cardDraft);
  const first = firstCardErrorOf(errors);
  if (first) {
    return {
      ...state,
      cardErrors: errors,
      cardAttempts: state.cardAttempts + 1,
      spoken: errors[first] ?? '',
    };
  }
  return { ...state, isSavingCard: true, spoken: 'Checking the card' };
}

/** 08 / 28 is kept as 08/28. */
function compactExpiryOf(expiry: string) {
  const trimmed = expiry.trim();
  return trimmed.replace(/\s/g, '');
}

function cardSaved(state: BillingState): BillingState {
  if (!state.isSavingCard) {
    return state;
  }
  const digits = digitsOf(state.cardDraft.number);
  const brand = brandOf(digits) ?? 'visa';
  const card: Card = {
    ...state.card,
    brand,
    last4: digits.slice(-4),
    expiry: compactExpiryOf(state.cardDraft.expiry),
  };
  return {
    ...state,
    card,
    isSavingCard: false,
    isEditingCard: false,
    cardDraft: EMPTY_DRAFT,
    spoken: `${CARD_BRAND_NAME[brand]} ending in ${card.last4} saved. It pays the next invoice`,
  };
}

function withDownload(
  state: BillingState,
  id: string,
  from: DownloadStatus,
  to: DownloadStatus
): BillingState {
  const current = state.downloads[id] ?? 'idle';
  if (current !== from) {
    return state;
  }
  const downloads = { ...state.downloads, [id]: to };
  return { ...state, downloads };
}

export function reducer(
  state: BillingState,
  action: BillingAction
): BillingState {
  switch (action.type) {
    case 'chooserToggled':
      return chooserToggled(state);
    case 'planPicked':
      return planPicked(state, action.planId);
    case 'switchPressed':
      return switchPressed(state);
    case 'planSwitched':
      return planSwitched(state);
    case 'cancelAsked':
      return cancelAsked(state);
    case 'cancelKept':
      return { ...state, isConfirmingCancel: false, spoken: '' };
    case 'cancelConfirmed':
      return cancelConfirmed(state);
    case 'resumed':
      return resumed(state);
    case 'usageAdded':
      return usageAdded(state, action.id, action.amount);
    case 'cardEditToggled':
      return cardEditToggled(state);
    case 'cardTyped':
      return cardTyped(state, action.field, action.value);
    case 'cardSavePressed':
      return cardSavePressed(state);
    case 'cardSaved':
      return cardSaved(state);
    case 'downloadStarted':
      return withDownload(state, action.id, 'idle', 'busy');
    case 'downloadDone':
      return withDownload(state, action.id, 'busy', 'done');
    case 'downloadFaded':
      return withDownload(state, action.id, 'done', 'idle');
  }
}

const SHOWN_INVOICE = 'TW-2611';

/**
 * Automations keep running while the page is open, an invoice is downloaded, then the
 * subscription is cancelled in place. That is where the page rests under reduced motion: the plan
 * reads Cancels on 30 Nov, with Resume beside it, and the runs meter has turned amber.
 */
const BEFORE_RESUME: Step[] = [
  { after: 1400, action: { type: 'usageAdded', id: 'runs', amount: 90 } },
  {
    after: 1100,
    by: 'demo',
    press: `download-${SHOWN_INVOICE}`,
    action: { type: 'downloadStarted', id: SHOWN_INVOICE },
  },
  {
    after: DOWNLOAD_MS,
    action: { type: 'downloadDone', id: SHOWN_INVOICE },
  },
  {
    after: DOWNLOADED_MS,
    action: { type: 'downloadFaded', id: SHOWN_INVOICE },
  },
  { after: 500, action: { type: 'usageAdded', id: 'runs', amount: 120 } },
  { after: 1400, by: 'demo', press: 'cancel', action: { type: 'cancelAsked' } },
  {
    after: 2000,
    by: 'demo',
    press: 'confirm-cancel',
    action: { type: 'cancelConfirmed' },
  },
];

export const SCRIPT: Step[] = [
  ...BEFORE_RESUME,
  { after: 2600, by: 'demo', press: 'resume', action: { type: 'resumed' } },
];

function endOf(steps: Step[]) {
  let state = INITIAL;
  for (const step of steps) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING: BillingState = { ...endOf(BEFORE_RESUME), spoken: '' };

export const LOOP_AFTER_MS = 3000;
