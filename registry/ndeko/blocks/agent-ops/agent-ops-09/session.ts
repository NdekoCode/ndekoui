import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { ASK_EXAMPLE, wellsOfQuestion } from './ask';
import type { DimensionId, FieldId, MeasureId } from './data';
import {
  EMPTY_WELLS,
  placed,
  removed,
  swapped,
  withAggregation,
  withFilterValue,
  type Aggregation,
  type WellId,
  type Wells,
} from './pivot';

/** A field held over a well: the table already shows what dropping it there gives. */
export type Preview = {
  field: FieldId;
  well: WellId;
};

export type PivotState = {
  wells: Wells;
  preview: Preview | null;
  /** The groups whose rows are folded. */
  collapsed: string[];
  question: string;
  hasAskFailed: boolean;
  /** Counts the drops of each field: a dropped chip lands where it was let go, it does not fly from the list. */
  drops: Partial<Record<FieldId, number>>;
};

export type PivotAction =
  | { type: 'previewed'; preview: Preview | null }
  | { type: 'placed'; field: FieldId; well: WellId; isDrop?: boolean }
  | { type: 'removed'; field: FieldId }
  | { type: 'aggregation'; measure: MeasureId; aggregation: Aggregation }
  | { type: 'filterValue'; field: DimensionId; value: string }
  | { type: 'swapped' }
  | { type: 'cleared' }
  | { type: 'filtersCleared' }
  | { type: 'groupToggled'; key: string }
  | { type: 'questionTyped'; text: string }
  | { type: 'asked' };

type Step = SessionStep<PivotState, PivotAction>;

const FIRST_WELLS: Wells = {
  filters: [],
  columns: [],
  rows: ['agent'],
  values: [{ measure: 'cost', aggregation: 'sum' }],
};

export const INITIAL: PivotState = {
  wells: FIRST_WELLS,
  preview: null,
  collapsed: [],
  question: '',
  hasAskFailed: false,
  drops: {},
};

/** The wells the table is drawn from: the committed ones, or what the held field would give. */
export function shownWellsOf(wells: Wells, preview: Preview | null) {
  if (!preview) {
    return wells;
  }
  return placed(wells, preview.field, preview.well);
}

/** Folded groups belong to the rows they were folded in. */
function withWells(state: PivotState, wells: Wells): PivotState {
  const rowsBefore = state.wells.rows.join(' ');
  const rowsAfter = wells.rows.join(' ');
  if (rowsBefore === rowsAfter) {
    return { ...state, wells, preview: null };
  }
  return { ...state, wells, preview: null, collapsed: [] };
}

function placedIn(
  state: PivotState,
  field: FieldId,
  well: WellId,
  isDrop: boolean
): PivotState {
  const next = withWells(state, placed(state.wells, field, well));
  if (!isDrop) {
    return next;
  }
  const dropCount = state.drops[field] ?? 0;
  return { ...next, drops: { ...state.drops, [field]: dropCount + 1 } };
}

function groupToggled(state: PivotState, key: string): PivotState {
  const isFolded = state.collapsed.includes(key);
  if (isFolded) {
    const collapsed = state.collapsed.filter((candidate) => candidate !== key);
    return { ...state, collapsed };
  }
  return { ...state, collapsed: [...state.collapsed, key] };
}

function asked(state: PivotState): PivotState {
  const wells = wellsOfQuestion(state.question);
  if (!wells) {
    return { ...state, hasAskFailed: true };
  }
  const next = withWells(state, wells);
  return { ...next, hasAskFailed: false };
}

export function reducer(state: PivotState, action: PivotAction): PivotState {
  switch (action.type) {
    case 'previewed':
      return { ...state, preview: action.preview };
    case 'placed':
      return placedIn(state, action.field, action.well, action.isDrop ?? false);
    case 'removed':
      return withWells(state, removed(state.wells, action.field));
    case 'aggregation':
      return withWells(
        state,
        withAggregation(state.wells, action.measure, action.aggregation)
      );
    case 'filterValue':
      return withWells(
        state,
        withFilterValue(state.wells, action.field, action.value)
      );
    case 'swapped':
      return withWells(state, swapped(state.wells));
    case 'cleared':
      return withWells(state, EMPTY_WELLS);
    case 'filtersCleared':
      return withWells(state, { ...state.wells, filters: [] });
    case 'groupToggled':
      return groupToggled(state, action.key);
    case 'questionTyped':
      return { ...state, question: action.text, hasAskFailed: false };
    case 'asked':
      return asked(state);
  }
}

const CHUNK = 3;

function delayOfChunk(index: number) {
  if (index === 0) {
    return 1700;
  }
  return 70;
}

function typingSteps(): Step[] {
  const steps: Step[] = [];
  const last = ASK_EXAMPLE.length + CHUNK;
  for (let end = CHUNK; end < last; end += CHUNK) {
    const text = ASK_EXAMPLE.slice(0, end);
    const after = delayOfChunk(steps.length);
    steps.push({
      after,
      by: 'demo',
      action: { type: 'questionTyped', text },
    });
  }
  return steps;
}

/** How long the demonstration holds a field over a well before it lets go. */
const HOLD_MS = 1000;

/** Holds a field over a well, where the table already regroups, then drops it there. */
function dragSteps(after: number, field: FieldId, well: WellId): Step[] {
  return [
    {
      after,
      by: 'demo',
      press: `field-${field}`,
      action: { type: 'previewed', preview: { field, well } },
    },
    { after: HOLD_MS, by: 'demo', action: { type: 'placed', field, well } },
  ];
}

const BUILDING: Step[] = [
  ...dragSteps(1400, 'day', 'columns'),
  ...dragSteps(1500, 'model', 'rows'),
];

export const SCRIPT: Step[] = [
  ...BUILDING,
  {
    after: 1700,
    by: 'demo',
    press: 'group-Coder',
    action: { type: 'groupToggled', key: 'Coder' },
  },
  ...typingSteps(),
  { after: 500, by: 'demo', press: 'ask', action: { type: 'asked' } },
  { after: 2400, by: 'demo', press: 'swap', action: { type: 'swapped' } },
];

/** Under reduced motion the table rests on cost by agent and model per day, groups open. */
function restingOf() {
  let state = INITIAL;
  for (const step of BUILDING) {
    state = reducer(state, step.action);
  }
  return state;
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3800;
