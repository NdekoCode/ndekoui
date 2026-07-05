import {
  CHANGE_ORDER,
  type AgentId,
  type ChangeId,
  type ParagraphId,
} from './data';
import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type DocView = 'doc' | 'table';

export type ChangeStatus =
  'hidden' | 'typing' | 'pending' | 'accepted' | 'rejected';

export type CommentStatus = 'hidden' | 'typing' | 'posted' | 'resolved';

export type Pointer = {
  /** The paragraph the agent is on, or null while it is idle and its pointer fades. */
  target: ParagraphId | null;
  action: string;
  spendUsd: number;
};

export type DocState = {
  view: DocView;
  pointers: Record<AgentId, Pointer>;
  changes: Record<ChangeId, ChangeStatus>;
  comment: CommentStatus;
};

export type Decision = 'accepted' | 'rejected';

export type DocAction =
  | { type: 'pointer'; agent: AgentId; pointer: Pointer }
  | { type: 'change'; id: ChangeId; status: ChangeStatus }
  | { type: 'comment'; status: CommentStatus }
  | { type: 'decided'; id: ChangeId; decision: Decision }
  | { type: 'acceptAll' }
  | { type: 'view'; view: DocView }
  | { type: 'batch'; actions: DocAction[] };

type Step = SessionStep<DocState, DocAction>;

const IDLE: Pointer = { target: null, action: 'Idle', spendUsd: 0 };

export const INITIAL: DocState = {
  view: 'doc',
  pointers: { writer: IDLE, reviewer: IDLE },
  changes: { c1: 'hidden', c2: 'hidden' },
  comment: 'hidden',
};

export function pendingIdsOf(state: DocState) {
  return CHANGE_ORDER.filter((id) => state.changes[id] === 'pending');
}

function decided(state: DocState, id: ChangeId, decision: Decision): DocState {
  if (state.changes[id] !== 'pending') {
    return state;
  }
  return { ...state, changes: { ...state.changes, [id]: decision } };
}

function acceptAll(state: DocState): DocState {
  let next = state;
  for (const id of pendingIdsOf(state)) {
    next = decided(next, id, 'accepted');
  }
  return next;
}

export function reducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case 'pointer': {
      const pointers = { ...state.pointers, [action.agent]: action.pointer };
      return { ...state, pointers };
    }
    case 'change': {
      const changes = { ...state.changes, [action.id]: action.status };
      return { ...state, changes };
    }
    case 'comment':
      return { ...state, comment: action.status };
    case 'decided':
      return decided(state, action.id, action.decision);
    case 'acceptAll':
      return acceptAll(state);
    case 'view':
      return { ...state, view: action.view };
    case 'batch': {
      let next = state;
      for (const inner of action.actions) {
        next = reducer(next, inner);
      }
      return next;
    }
  }
}

function frame(after: number, actions: DocAction[]): Step {
  return { after, action: { type: 'batch', actions } };
}

function pointing(
  agent: AgentId,
  target: ParagraphId | null,
  action: string,
  spendUsd: number
): DocAction {
  return { type: 'pointer', agent, pointer: { target, action, spendUsd } };
}

function hasDecidedFirst(state: DocState) {
  return state.changes.c1 !== 'pending';
}

function hasNothingPending(state: DocState) {
  return pendingIdsOf(state).length === 0;
}

/** One character every tick while a suggestion types itself. */
export const TYPE_TICK_MS = 45;

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

export const SCRIPT: Step[] = [
  frame(800, [pointing('writer', 'proposal', 'Reading', 0.004)]),
  frame(1300, [
    pointing('writer', 'proposal', 'Suggesting an edit', 0.007),
    { type: 'change', id: 'c1', status: 'typing' },
  ]),
  frame(2100, [
    { type: 'change', id: 'c1', status: 'pending' },
    pointing('writer', 'proposal', 'Suggested an edit', 0.011),
    pointing('reviewer', 'problem', 'Reading', 0.003),
  ]),
  frame(1200, [
    pointing('reviewer', 'problem', 'Commenting', 0.005),
    { type: 'comment', status: 'typing' },
  ]),
  frame(1600, [
    { type: 'comment', status: 'posted' },
    pointing('reviewer', null, 'Idle', 0.007),
    pointing('writer', 'measure', 'Suggesting an edit', 0.013),
    { type: 'change', id: 'c2', status: 'typing' },
  ]),
  frame(1500, [
    { type: 'change', id: 'c2', status: 'pending' },
    pointing('writer', null, 'Idle', 0.016),
  ]),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'accept-c1',
    action: { type: 'decided', id: 'c1', decision: 'accepted' },
    isAnswered: hasDecidedFirst,
  },
  { after: 1500, by: 'demo', action: { type: 'view', view: 'table' } },
  { after: 2300, by: 'demo', action: { type: 'view', view: 'doc' } },
  {
    after: 1400,
    by: 'person',
    press: 'accept-all',
    action: { type: 'acceptAll' },
    isAnswered: hasNothingPending,
  },
];

function restingOf() {
  let state = INITIAL;
  for (const step of SCRIPT) {
    const isLastStep = step === SCRIPT.at(-1);
    if (!isLastStep) {
      state = reducer(state, step.action);
    }
  }
  return reducer(state, { type: 'view', view: 'doc' });
}

/** Under reduced motion the document rests with one suggestion still to decide, so the tracked change reads. */
export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3400;
