import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import { LANES, TRIAGE_TAKES, type Lane, type SubjectId } from './data';

export type TriageState = {
  lanes: Record<Lane, SubjectId[]>;
  lastMove: string;
};

export type TriageAction =
  | { type: 'sorted'; id: SubjectId; lane: Lane }
  | { type: 'returned'; id: SubjectId }
  | { type: 'cleared' };

type Step = SessionStep<TriageState, TriageAction>;

export const INITIAL: TriageState = {
  lanes: { keep: [], maybe: [], drop: [] },
  lastMove: '',
};

export const RESTING: TriageState = {
  lanes: {
    keep: ['mug', 'hills', 'bowl'],
    maybe: ['plant', 'window'],
    drop: ['bottles'],
  },
  lastMove: '',
};

export function titleOf(id: SubjectId) {
  const take = TRIAGE_TAKES.find((candidate) => candidate.id === id);
  if (!take) {
    return id;
  }
  return take.title;
}

export function laneLabelOf(lane: Lane) {
  const found = LANES.find((candidate) => candidate.id === lane);
  if (!found) {
    return lane;
  }
  return found.label;
}

export function takesIn(state: TriageState, lane: Lane) {
  const ids = state.lanes[lane];
  return TRIAGE_TAKES.filter((take) => ids.includes(take.id));
}

export function unsortedOf(state: TriageState) {
  const sorted = [
    ...state.lanes.keep,
    ...state.lanes.maybe,
    ...state.lanes.drop,
  ];
  return TRIAGE_TAKES.filter((take) => !sorted.includes(take.id));
}

function withoutTake(lanes: Record<Lane, SubjectId[]>, id: SubjectId) {
  return {
    keep: lanes.keep.filter((taken) => taken !== id),
    maybe: lanes.maybe.filter((taken) => taken !== id),
    drop: lanes.drop.filter((taken) => taken !== id),
  };
}

function sorted(state: TriageState, id: SubjectId, lane: Lane): TriageState {
  const lanes = withoutTake(state.lanes, id);
  lanes[lane] = [...lanes[lane], id];
  const lastMove = `${titleOf(id)} moved to ${laneLabelOf(lane)}`;
  return { lanes, lastMove };
}

export function reducer(state: TriageState, action: TriageAction): TriageState {
  switch (action.type) {
    case 'sorted':
      return sorted(state, action.id, action.lane);
    case 'returned':
      return {
        lanes: withoutTake(state.lanes, action.id),
        lastMove: `${titleOf(action.id)} moved back to unsorted`,
      };
    case 'cleared':
      return INITIAL;
  }
}

export function sortPressKeyOf(id: SubjectId, lane: Lane) {
  return `${id}:${lane}`;
}

const FIRST_SORT_MS = 1400;

const SORT_MS = 950;

function sortStep(after: number, id: SubjectId, lane: Lane): Step {
  return {
    after,
    by: 'demo',
    press: sortPressKeyOf(id, lane),
    action: { type: 'sorted', id, lane },
  };
}

const SCRIPT: Step[] = [
  sortStep(FIRST_SORT_MS, 'mug', 'keep'),
  sortStep(SORT_MS, 'bottles', 'drop'),
  sortStep(SORT_MS, 'plant', 'maybe'),
  sortStep(SORT_MS, 'hills', 'keep'),
  sortStep(SORT_MS, 'window', 'maybe'),
  sortStep(SORT_MS, 'bowl', 'keep'),
];

export const SESSION: SessionConfig<TriageState, TriageAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 2800,
};
