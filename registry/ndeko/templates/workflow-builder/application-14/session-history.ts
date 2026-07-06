import { stepOf } from './flow';
import type { Workflow } from './model';
import { reconciledRun } from './run';
import type { BuilderState } from './session';

const HISTORY_DEPTH = 50;

function pastAfter(state: BuilderState, continuesEdit: boolean) {
  if (continuesEdit) {
    return state.past;
  }
  const grown = [...state.past, state.workflow];
  return grown.slice(-HISTORY_DEPTH);
}

function selectedIn(workflow: Workflow, id: string | null) {
  const step = stepOf(workflow, id);
  if (!step) {
    return null;
  }
  return step.id;
}

/**
 * Every change to the flow goes through here, so Undo can walk each of them back. Edits that carry
 * the same key continue one another: a text typed key by key is one step of the history.
 */
export function edited(
  state: BuilderState,
  workflow: Workflow,
  editKey: string | null
): BuilderState {
  if (workflow === state.workflow) {
    return state;
  }
  const continuesEdit = editKey !== null && editKey === state.lastEditKey;
  return {
    ...state,
    workflow,
    past: pastAfter(state, continuesEdit),
    future: [],
    lastEditKey: editKey,
    arrivedId: null,
    notice: null,
    selectedId: selectedIn(workflow, state.selectedId),
    run: reconciledRun(state.run, workflow),
  };
}

/** A walk through the history shows the flow as it was: what was selected stays so only if it is still there. */
function walkedTo(
  state: BuilderState,
  workflow: Workflow,
  past: Workflow[],
  future: Workflow[]
): BuilderState {
  const restoredId = state.notice?.restoresId ?? state.selectedId;
  return {
    ...state,
    workflow,
    past,
    future,
    lastEditKey: null,
    arrivedId: null,
    notice: null,
    selectedId: selectedIn(workflow, restoredId),
    run: reconciledRun(state.run, workflow),
  };
}

export function undone(state: BuilderState): BuilderState {
  const previous = state.past.at(-1);
  if (!previous) {
    return state;
  }
  const past = state.past.slice(0, -1);
  const future = [state.workflow, ...state.future];
  const walked = walkedTo(state, previous, past, future);
  return { ...walked, spoken: 'Undone' };
}

export function redone(state: BuilderState): BuilderState {
  const next = state.future[0];
  if (!next) {
    return state;
  }
  const past = [...state.past, state.workflow];
  const future = state.future.slice(1);
  const walked = walkedTo(state, next, past, future);
  return { ...walked, spoken: 'Redone' };
}
