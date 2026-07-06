import { entryOf, seriesAfter, stepOfEntry } from './catalog';
import { changed, copyOf, inserted, removed } from './edits';
import { agentCountOf, placementOf, stepOf, withInside } from './flow';
import type { InsertAt, Step, Workflow } from './model';
import type { BuilderState, Notice } from './session';
import { edited } from './session-history';
import { countOf } from './words';

function namedAs(step: Step, name: string | undefined): Step {
  if (name === undefined) {
    return step;
  }
  return { ...step, name };
}

/** A new step takes the selection, and the inspector opens on its setup. */
function arrived(
  state: BuilderState,
  step: Step,
  spoken: string
): BuilderState {
  return {
    ...state,
    selectedId: step.id,
    arrivedId: step.id,
    tab: 'setup',
    isFollowingRun: false,
    spoken,
  };
}

export function stepAdded(
  state: BuilderState,
  entryId: string,
  at: InsertAt,
  id: string,
  name: string | undefined
): BuilderState {
  const entry = entryOf(entryId);
  if (!entry) {
    return state;
  }
  const agentCount = agentCountOf(state.workflow);
  const series = seriesAfter(agentCount);
  const fresh = stepOfEntry(entry, id, series);
  const step = namedAs(fresh, name);
  let workflow = inserted(state.workflow, at, step);
  let placement = placementOf(state.workflow, at);
  const isPlaceGone = workflow === state.workflow;
  if (isPlaceGone) {
    workflow = inserted(state.workflow, { at: 'end' }, step);
    placement = placementOf(state.workflow, { at: 'end' });
  }
  const next = edited(state, workflow, null);
  return arrived(next, step, `${step.name} added ${placement}`);
}

function removedTextOf(count: number) {
  if (count === 1) {
    return 'Step removed';
  }
  const steps = countOf(count, 'step', 'steps');
  return `${steps} removed`;
}

export function stepRemoved(state: BuilderState, id: string): BuilderState {
  const step = stepOf(state.workflow, id);
  if (!step) {
    return state;
  }
  const gone = withInside(step);
  const workflow = removed(state.workflow, id);
  const next = edited(state, workflow, null);
  const noticeCount = state.noticeCount + 1;
  const notice: Notice = {
    token: noticeCount,
    text: removedTextOf(gone.length),
    canUndo: true,
    restoresId: id,
  };
  return {
    ...next,
    notice,
    noticeCount,
    spoken: `${step.name} removed. Undo is in the tool bar`,
  };
}

/** A copied agent is another agent: it takes the next series colour, never the one of its model. */
function recolored(copy: Step, workflow: Workflow): Step {
  if (copy.kind !== 'agent') {
    return copy;
  }
  const agentCount = agentCountOf(workflow);
  return { ...copy, series: seriesAfter(agentCount) };
}

export function stepDuplicated(
  state: BuilderState,
  id: string,
  copyId: string
): BuilderState {
  const step = stepOf(state.workflow, id);
  if (!step) {
    return state;
  }
  const plainCopy = copyOf(step, copyId);
  const copy = recolored(plainCopy, state.workflow);
  const after: InsertAt = { at: 'after', stepId: id };
  const workflow = inserted(state.workflow, after, copy);
  const next = edited(state, workflow, null);
  return arrived(next, copy, `${copy.name} added after ${step.name}`);
}

export function stepRenamed(
  state: BuilderState,
  id: string,
  name: string
): BuilderState {
  const workflow = changed(state.workflow, id, (step) => ({ ...step, name }));
  const next = edited(state, workflow, null);
  return { ...next, spoken: `Renamed to ${name}` };
}

export function workflowRenamed(
  state: BuilderState,
  name: string
): BuilderState {
  if (name === state.workflow.name) {
    return state;
  }
  const next = edited(state, { ...state.workflow, name }, null);
  return { ...next, spoken: `Workflow renamed to ${name}` };
}
