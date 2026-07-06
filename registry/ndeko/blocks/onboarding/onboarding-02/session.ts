import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  EMPTY_FIELDS,
  indexOfStep,
  stepOf,
  STEPS,
  type Fields,
  type RoleId,
  type SourceId,
  type StepId,
} from './data';
import {
  committedInvites,
  errorsOf,
  firstErrorOf,
  slugOf,
  type Errors,
  type FieldName,
} from './validate';

export type FinishStatus = 'idle' | 'creating' | 'created';

export type WizardState = {
  step: StepId;
  /** The furthest step reached: the stepper lets a person go back to any step up to it. */
  furthest: number;
  fields: Fields;
  errors: Errors;
  /** Counts the refused entries, so a message that comes back arrives again. */
  attempts: number;
  /** Counts the changes of step. The first step is there when the page loads; the next ones fade in. */
  moves: number;
  skipped: StepId[];
  /** True after Edit on the review: the step then leads straight back to the review. */
  isReturning: boolean;
  finish: FinishStatus;
  spoken: string;
};

/** The fields a person types into. */
export type TextField = 'name' | 'slug' | 'connection' | 'inviteDraft';

export type WizardAction =
  | { type: 'typed'; field: TextField; value: string }
  | { type: 'sourcePicked'; source: SourceId }
  | { type: 'rolePicked'; role: RoleId }
  | { type: 'inviteCommitted' }
  | { type: 'inviteRemoved'; address: string }
  | { type: 'nextPressed' }
  | { type: 'skipPressed' }
  | { type: 'backPressed' }
  | { type: 'jumped'; step: StepId }
  | { type: 'finishPressed' }
  | { type: 'created' }
  | { type: 'restarted' };

type Step = SessionStep<WizardState, WizardAction>;

export const TOTAL = STEPS.length;

const REVIEW_INDEX = indexOfStep('review');

export const INITIAL: WizardState = {
  step: 'workspace',
  furthest: 0,
  fields: EMPTY_FIELDS,
  errors: {},
  attempts: 0,
  moves: 0,
  skipped: [],
  isReturning: false,
  finish: 'idle',
  spoken: '',
};

function withoutError(errors: Errors, field: FieldName): Errors {
  const next = { ...errors };
  delete next[field];
  return next;
}

/** The address follows the name until a person writes it themselves. */
function nameTyped(state: WizardState, value: string): WizardState {
  const errors = withoutError(state.errors, 'name');
  if (state.fields.isSlugEdited) {
    return { ...state, errors, fields: { ...state.fields, name: value } };
  }
  const fields = { ...state.fields, name: value, slug: slugOf(value) };
  return { ...state, fields, errors: withoutError(errors, 'slug') };
}

function typed(
  state: WizardState,
  field: TextField,
  value: string
): WizardState {
  if (field === 'name') {
    return nameTyped(state, value);
  }
  if (field === 'slug') {
    const fields = { ...state.fields, slug: value, isSlugEdited: true };
    return { ...state, fields, errors: withoutError(state.errors, 'slug') };
  }
  if (field === 'connection') {
    const fields = { ...state.fields, connection: value };
    const errors = withoutError(state.errors, 'connection');
    return { ...state, fields, errors };
  }
  const fields = { ...state.fields, inviteDraft: value };
  return { ...state, fields, errors: withoutError(state.errors, 'invites') };
}

function refused(state: WizardState, errors: Errors): WizardState {
  const first = firstErrorOf(errors);
  return {
    ...state,
    errors,
    attempts: state.attempts + 1,
    spoken: first?.message ?? '',
  };
}

/** What the address box holds becomes addresses. What cannot be one stays in the box, with the reason. */
function inviteCommitted(state: WizardState): WizardState {
  const committed = committedInvites(state.fields);
  const fields = {
    ...state.fields,
    invites: committed.invites,
    inviteDraft: committed.inviteDraft,
  };
  const next = { ...state, fields };
  if (committed.error !== undefined) {
    return refused(next, { invites: committed.error });
  }
  return { ...next, errors: withoutError(state.errors, 'invites') };
}

function inviteRemoved(state: WizardState, address: string): WizardState {
  const invites = state.fields.invites.filter(
    (candidate) => candidate !== address
  );
  return { ...state, fields: { ...state.fields, invites } };
}

function entered(state: WizardState, step: StepId): WizardState {
  const index = indexOfStep(step);
  const title = stepOf(step).title;
  return {
    ...state,
    step,
    furthest: Math.max(state.furthest, index),
    errors: {},
    moves: state.moves + 1,
    spoken: `Step ${index + 1} of ${TOTAL}: ${title}`,
  };
}

/** Next leads to the step after this one, or straight back to the review a person came from. */
function advanced(state: WizardState): WizardState {
  if (state.isReturning) {
    return entered({ ...state, isReturning: false }, 'review');
  }
  const next = STEPS[indexOfStep(state.step) + 1];
  if (!next) {
    return state;
  }
  return entered(state, next.id);
}

export type Check = {
  state: WizardState;
  /** The first field that keeps the step from being left, if any. */
  refusedField: FieldName | null;
};

/**
 * What Next finds when it looks at the step: an address still in the box is read first, then the
 * fields of the step are checked. The buttons use it to know where the focus goes.
 */
export function checkOf(state: WizardState): Check {
  let checked = state;
  if (state.step === 'team') {
    checked = inviteCommitted(state);
    const hasBadAddress = checked.errors.invites !== undefined;
    if (hasBadAddress) {
      return { state: checked, refusedField: 'invites' };
    }
  }
  const errors = errorsOf(checked.step, checked.fields);
  const first = firstErrorOf(errors);
  if (first) {
    return { state: refused(checked, errors), refusedField: first.field };
  }
  return { state: checked, refusedField: null };
}

function isEditable(state: WizardState) {
  return state.finish === 'idle';
}

function nextPressed(state: WizardState): WizardState {
  const isOnReview = state.step === 'review';
  if (isOnReview || !isEditable(state)) {
    return state;
  }
  const check = checkOf(state);
  if (check.refusedField !== null) {
    return check.state;
  }
  const skipped = check.state.skipped.filter((step) => step !== state.step);
  return advanced({ ...check.state, skipped });
}

function skipPressed(state: WizardState): WizardState {
  const canSkip = stepOf(state.step).isOptional && isEditable(state);
  if (!canSkip) {
    return state;
  }
  const others = state.skipped.filter((step) => step !== state.step);
  return advanced({ ...state, skipped: [...others, state.step] });
}

function backPressed(state: WizardState): WizardState {
  const previous = STEPS[indexOfStep(state.step) - 1];
  if (!previous || !isEditable(state)) {
    return state;
  }
  return entered(state, previous.id);
}

/**
 * The stepper and the Edit links of the review go to a step that was already reached. Going back is
 * free; going forward checks the step that is left, as Next does. A step opened from the review
 * leads back to it.
 */
function jumped(state: WizardState, step: StepId): WizardState {
  const target = indexOfStep(step);
  const current = indexOfStep(state.step);
  const isReached = target <= state.furthest;
  const isElsewhere = target !== current;
  const isLocked = !isEditable(state);
  if (isLocked || !isReached || !isElsewhere) {
    return state;
  }
  if (target < current) {
    const isReturning = state.step === 'review' || state.isReturning;
    return entered({ ...state, isReturning }, step);
  }
  const check = checkOf(state);
  if (check.refusedField !== null) {
    return check.state;
  }
  const isReturning = check.state.isReturning && target !== REVIEW_INDEX;
  return entered({ ...check.state, isReturning }, step);
}

function finishPressed(state: WizardState): WizardState {
  const isOnReview = state.step === 'review';
  if (!isOnReview || !isEditable(state)) {
    return state;
  }
  return { ...state, finish: 'creating', spoken: 'Creating the workspace' };
}

function created(state: WizardState): WizardState {
  if (state.finish !== 'creating') {
    return state;
  }
  const spoken = `${state.fields.name.trim()} is ready`;
  return { ...state, finish: 'created', spoken };
}

export function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'typed':
      return typed(state, action.field, action.value);
    case 'sourcePicked': {
      const fields = { ...state.fields, source: action.source };
      const errors = withoutError(state.errors, 'source');
      return { ...state, fields, errors };
    }
    case 'rolePicked':
      return { ...state, fields: { ...state.fields, role: action.role } };
    case 'inviteCommitted':
      return inviteCommitted(state);
    case 'inviteRemoved':
      return inviteRemoved(state, action.address);
    case 'nextPressed':
      return nextPressed(state);
    case 'skipPressed':
      return skipPressed(state);
    case 'backPressed':
      return backPressed(state);
    case 'jumped':
      return jumped(state, action.step);
    case 'finishPressed':
      return finishPressed(state);
    case 'created':
      return created(state);
    case 'restarted':
      return { ...INITIAL, spoken: 'A new setup starts' };
  }
}

/** How long the workspace takes to be created. */
export const CREATE_MS = 1300;

const KEY_MS = 45;

const NAME = 'Solway Books';

const ADDRESS = 'ines@solwaybooks.example';

function typingSteps(
  field: TextField,
  text: string,
  startAfter: number
): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', field, value },
  }));
}

function next(after: number): Step {
  return {
    after,
    by: 'demo',
    press: 'next',
    action: { type: 'nextPressed' },
  };
}

/**
 * A person does everything in a wizard, so every step is the demonstration's: it names the
 * workspace, is refused once on the data source and picks one, skips the team, comes back to it
 * from the review with Edit and adds an address. The review that follows is where the wizard rests.
 */
const FILLING: Step[] = [
  ...typingSteps('name', NAME, 1200),
  next(700),
  next(1500),
  {
    after: 1500,
    by: 'demo',
    press: 'source-postgresql',
    action: { type: 'sourcePicked', source: 'postgresql' },
  },
  next(1100),
  { after: 1600, by: 'demo', press: 'skip', action: { type: 'skipPressed' } },
  {
    after: 1900,
    by: 'demo',
    press: 'edit-team',
    action: { type: 'jumped', step: 'team' },
  },
  ...typingSteps('inviteDraft', ADDRESS, 900),
  {
    after: 500,
    by: 'demo',
    press: 'add-invite',
    action: { type: 'inviteCommitted' },
  },
  next(1000),
];

/** The workspace is created on its own once the button is pressed, whoever pressed it. */
export const SCRIPT: Step[] = [
  ...FILLING,
  {
    after: 2000,
    by: 'demo',
    press: 'finish',
    action: { type: 'finishPressed' },
  },
  { after: CREATE_MS, action: { type: 'created' } },
];

function endOf(script: Step[]) {
  let state = INITIAL;
  for (const step of script) {
    state = reducer(state, step.action);
  }
  return state;
}

/** Under reduced motion the review lists the three things the wizard will create. */
export const RESTING: WizardState = { ...endOf(FILLING), spoken: '' };

export const LOOP_AFTER_MS = 3600;
