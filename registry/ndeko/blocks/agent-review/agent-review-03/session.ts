import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { FIELDS, FLAGGED_IDS, type FieldId, type PageNumber } from './data';

export type ExtractTab = 'fields' | 'json' | 'schema';

export type ReviewStatus = 'pending' | 'confirmed' | 'edited';

export type SaveStatus = 'idle' | 'busy' | 'done';

export type ExtractState = {
  shown: number;
  page: PageNumber;
  tab: ExtractTab;
  /** The field the demonstration points at; a person's own pointer wins over it. */
  pointed: FieldId | null;
  review: Partial<Record<FieldId, ReviewStatus>>;
  edits: Partial<Record<FieldId, string>>;
  save: SaveStatus;
};

export type ExtractAction =
  | { type: 'read' }
  | { type: 'page'; page: PageNumber }
  | { type: 'tab'; tab: ExtractTab }
  | { type: 'pointed'; id: FieldId | null }
  | { type: 'confirmed'; id: FieldId }
  | { type: 'edited'; id: FieldId; value: string }
  | { type: 'saving' }
  | { type: 'saved' };

type Step = SessionStep<ExtractState, ExtractAction>;

export const INITIAL: ExtractState = {
  shown: 0,
  page: 1,
  tab: 'fields',
  pointed: null,
  review: {},
  edits: {},
  save: 'idle',
};

export function reviewOf(state: ExtractState, id: FieldId): ReviewStatus {
  return state.review[id] ?? 'pending';
}

export function pendingIdsOf(state: ExtractState) {
  return FLAGGED_IDS.filter((id) => reviewOf(state, id) === 'pending');
}

export function isReadingDone(state: ExtractState) {
  return state.shown >= FIELDS.length;
}

/** The viewer follows the page the agent is reading. */
function read(state: ExtractState): ExtractState {
  const field = FIELDS[state.shown];
  if (!field) {
    return state;
  }
  return { ...state, shown: state.shown + 1, page: field.page };
}

function saving(state: ExtractState): ExtractState {
  const hasPending = pendingIdsOf(state).length > 0;
  const canSave = isReadingDone(state) && !hasPending;
  if (!canSave || state.save !== 'idle') {
    return state;
  }
  return { ...state, save: 'busy' };
}

function saved(state: ExtractState): ExtractState {
  if (state.save !== 'busy') {
    return state;
  }
  return { ...state, save: 'done' };
}

export function reducer(
  state: ExtractState,
  action: ExtractAction
): ExtractState {
  switch (action.type) {
    case 'read':
      return read(state);
    case 'page':
      return { ...state, page: action.page };
    case 'tab':
      return { ...state, tab: action.tab };
    case 'pointed':
      return { ...state, pointed: action.id };
    case 'confirmed': {
      const review = { ...state.review, [action.id]: 'confirmed' as const };
      return { ...state, review };
    }
    case 'edited': {
      const review = { ...state.review, [action.id]: 'edited' as const };
      const edits = { ...state.edits, [action.id]: action.value };
      return { ...state, review, edits };
    }
    case 'saving':
      return saving(state);
    case 'saved':
      return saved(state);
  }
}

function readSteps(): Step[] {
  return FIELDS.map((_, index) => {
    const after = delayOfRead(index);
    return { after, action: { type: 'read' } };
  });
}

function delayOfRead(index: number) {
  if (index === 0) {
    return 1100;
  }
  return 520;
}

function isReviewed(id: FieldId) {
  return (state: ExtractState) => reviewOf(state, id) !== 'pending';
}

export const SAVE_MS = 900;

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  ...readSteps(),
  { after: 900, by: 'demo', action: { type: 'pointed', id: 'total' } },
  { after: 1700, by: 'demo', action: { type: 'pointed', id: 'payment_terms' } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'confirm-payment_terms',
    action: { type: 'confirmed', id: 'payment_terms' },
    isAnswered: isReviewed('payment_terms'),
  },
  { after: 500, by: 'demo', action: { type: 'pointed', id: 'delivery_date' } },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'confirm-delivery_date',
    action: { type: 'confirmed', id: 'delivery_date' },
    isAnswered: isReviewed('delivery_date'),
  },
  { after: 500, by: 'demo', action: { type: 'pointed', id: null } },
  { after: 1300, by: 'demo', press: 'accept', action: { type: 'saving' } },
  { after: SAVE_MS, action: { type: 'saved' } },
];

function restingOf() {
  let state = INITIAL;
  for (const step of SCRIPT) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3200;
