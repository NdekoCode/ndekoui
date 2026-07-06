import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import {
  CONNECTIONS,
  DEMO_INSTRUCTIONS,
  OUTPUT_WORD,
  OUTPUTS_OF,
  shownNameOf,
  STEPS,
  type Connection,
  type FieldId,
  type OutputId,
  type Step,
} from './data';
import {
  canConnect,
  problemsOf,
  stepOf,
  targetOf,
  type Graph,
  type Problem,
} from './graph';
import type { Cell } from './layout';

/**
 * How a wire came to be: there from the start, let go by a hand where it now sits, or made from a
 * menu. Only the last one draws itself, since the two others are already where they belong.
 */
export type Arrival = 'placed' | 'dropped' | 'drawn';

export type Wire = Connection & {
  arrival: Arrival;
};

/** A wire held out of a port: by a pointer, or by the demonstration. `to` is the step it would land on. */
export type Wiring = {
  from: string;
  output: OutputId;
  to: string | null;
};

export type Removed = {
  step: Step;
  index: number;
  wires: Wire[];
};

export type PublishState = 'draft' | 'publishing' | 'live';

export type BuilderState = {
  steps: Step[];
  wires: Wire[];
  selectedId: string | null;
  isInspectorOpen: boolean;
  wiring: Wiring | null;
  /** The step Undo brings back, with the wires it had. */
  removed: Removed | null;
  publish: PublishState;
  /** The last change, said to screen readers. */
  notice: string;
};

export type BuilderAction =
  | { type: 'selected'; id: string | null }
  | { type: 'opened'; id: string }
  | { type: 'closed' }
  | { type: 'renamed'; id: string; name: string }
  | { type: 'fieldChanged'; id: string; field: FieldId; value: string }
  | { type: 'wireStarted'; from: string; output: OutputId }
  | { type: 'wireAimed'; to: string | null }
  | { type: 'wireDropped' }
  | { type: 'wireCancelled' }
  | { type: 'connected'; from: string; output: OutputId; to: string }
  | { type: 'disconnected'; from: string; output: OutputId }
  | { type: 'moved'; id: string; cell: Cell }
  | { type: 'removed'; id: string }
  | { type: 'undone' }
  | { type: 'undoDismissed' }
  | { type: 'publishStarted' }
  | { type: 'publishDone' }
  | { type: 'restored' };

type Beat = SessionStep<BuilderState, BuilderAction>;

function placed(link: Connection): Wire {
  return { ...link, arrival: 'placed' };
}

/** The connection an action names, without the action's own fields. */
function linkOf(action: Connection): Connection {
  return { from: action.from, output: action.output, to: action.to };
}

export const INITIAL: BuilderState = {
  steps: STEPS,
  wires: CONNECTIONS.map(placed),
  selectedId: null,
  isInspectorOpen: false,
  wiring: null,
  removed: null,
  publish: 'draft',
  notice: '',
};

export function graphOf(state: BuilderState): Graph {
  return { steps: state.steps, connections: state.wires };
}

function problemsWordOf(count: number) {
  if (count === 1) {
    return '1 problem';
  }
  return `${count} problems`;
}

function isFromOutput(wire: Wire, from: string, output: OutputId) {
  return wire.from === from && wire.output === output;
}

function touches(wire: Wire, id: string) {
  return wire.from === id || wire.to === id;
}

function selected(state: BuilderState, id: string | null): BuilderState {
  if (id === null) {
    return { ...state, selectedId: null, isInspectorOpen: false };
  }
  if (!stepOf(state.steps, id)) {
    return state;
  }
  return { ...state, selectedId: id };
}

function opened(state: BuilderState, id: string): BuilderState {
  if (!stepOf(state.steps, id)) {
    return state;
  }
  return { ...state, selectedId: id, isInspectorOpen: true };
}

function withStep(
  state: BuilderState,
  id: string,
  change: (step: Step) => Step
): BuilderState {
  const steps = state.steps.map((step) => {
    if (step.id === id) {
      return change(step);
    }
    return step;
  });
  return { ...state, steps, publish: 'draft', notice: '' };
}

function fieldChanged(
  state: BuilderState,
  id: string,
  field: FieldId,
  value: string
) {
  return withStep(state, id, (step) => ({
    ...step,
    values: { ...step.values, [field]: value },
  }));
}

function wireStarted(
  state: BuilderState,
  from: string,
  output: OutputId
): BuilderState {
  const source = stepOf(state.steps, from);
  const hasOutput =
    source !== undefined && OUTPUTS_OF[source.kind].includes(output);
  if (!hasOutput) {
    return state;
  }
  return { ...state, wiring: { from, output, to: null } };
}

function wireAimed(state: BuilderState, to: string | null): BuilderState {
  const wiring = state.wiring;
  if (!wiring) {
    return state;
  }
  let target = to;
  if (to !== null && !canConnect(graphOf(state), wiring.from, to)) {
    target = null;
  }
  if (target === wiring.to) {
    return state;
  }
  return { ...state, wiring: { ...wiring, to: target } };
}

function connectedTo(
  state: BuilderState,
  link: Connection,
  arrival: Arrival
): BuilderState {
  const source = stepOf(state.steps, link.from);
  const target = stepOf(state.steps, link.to);
  if (!source || !target) {
    return state;
  }
  const hasOutput = OUTPUTS_OF[source.kind].includes(link.output);
  const isAllowed = hasOutput && canConnect(graphOf(state), link.from, link.to);
  const isSame = targetOf(state.wires, link.from, link.output) === link.to;
  if (!isAllowed || isSame) {
    return state;
  }
  const others = state.wires.filter(
    (wire) => !isFromOutput(wire, link.from, link.output)
  );
  const word = OUTPUT_WORD[link.output];
  const sourceName = shownNameOf(source);
  const targetName = shownNameOf(target);
  return {
    ...state,
    wires: [...others, { ...link, arrival }],
    publish: 'draft',
    notice: `${sourceName}: ${word} now leads to ${targetName}`,
  };
}

function wireDropped(state: BuilderState): BuilderState {
  const wiring = state.wiring;
  if (!wiring) {
    return state;
  }
  const released = { ...state, wiring: null };
  if (wiring.to === null) {
    return released;
  }
  const link = { from: wiring.from, output: wiring.output, to: wiring.to };
  return connectedTo(released, link, 'dropped');
}

function disconnected(
  state: BuilderState,
  from: string,
  output: OutputId
): BuilderState {
  const source = stepOf(state.steps, from);
  const wires = state.wires.filter((wire) => !isFromOutput(wire, from, output));
  const hasChanged = wires.length !== state.wires.length;
  if (!source || !hasChanged) {
    return state;
  }
  const word = OUTPUT_WORD[output];
  return {
    ...state,
    wires,
    publish: 'draft',
    notice: `${shownNameOf(source)}: ${word} leads nowhere now`,
  };
}

function moved(state: BuilderState, id: string, cell: Cell): BuilderState {
  const step = stepOf(state.steps, id);
  const isSamePlace = step?.level === cell.level && step.lane === cell.lane;
  if (!step || isSamePlace) {
    return state;
  }
  const steps = state.steps.map((candidate) => {
    if (candidate.id === id) {
      return { ...candidate, level: cell.level, lane: cell.lane };
    }
    return candidate;
  });
  return { ...state, steps };
}

function removed(state: BuilderState, id: string): BuilderState {
  const index = state.steps.findIndex((step) => step.id === id);
  const step = state.steps[index];
  if (!step) {
    return state;
  }
  const cut = state.wires.filter((wire) => touches(wire, id));
  const kept = state.wires.filter((wire) => !touches(wire, id));
  const steps = state.steps.filter((candidate) => candidate.id !== id);
  const cleared = { ...state, steps, wires: kept, wiring: null };
  const wasSelected = state.selectedId === id;
  let next: BuilderState = cleared;
  if (wasSelected) {
    next = { ...cleared, selectedId: null, isInspectorOpen: false };
  }
  return {
    ...next,
    removed: { step, index, wires: cut },
    publish: 'draft',
    notice: `${shownNameOf(step)} removed. Undo is available`,
  };
}

/** A wire comes back with its step only where it still fits: its port may have been used since. */
function rewired(state: BuilderState, wire: Wire): BuilderState {
  const isFree = targetOf(state.wires, wire.from, wire.output) === null;
  const fits = isFree && canConnect(graphOf(state), wire.from, wire.to);
  if (!fits) {
    return state;
  }
  return { ...state, wires: [...state.wires, placed(wire)] };
}

function undone(state: BuilderState): BuilderState {
  const lost = state.removed;
  if (!lost) {
    return state;
  }
  const steps = [...state.steps];
  steps.splice(lost.index, 0, lost.step);
  let next: BuilderState = { ...state, steps, removed: null };
  for (const wire of lost.wires) {
    next = rewired(next, wire);
  }
  return {
    ...next,
    selectedId: lost.step.id,
    publish: 'draft',
    notice: `${shownNameOf(lost.step)} is back`,
  };
}

/** Publish refuses a workflow with problems and opens the first one, so the way on is in view. */
function refused(state: BuilderState, problems: Problem[]): BuilderState {
  const [first] = problems;
  const step = stepOf(state.steps, first.stepId);
  if (!step) {
    return state;
  }
  const count = problemsWordOf(problems.length);
  const name = shownNameOf(step);
  return {
    ...state,
    selectedId: step.id,
    isInspectorOpen: true,
    notice: `${count} to fix before publishing. ${name}: ${first.line}`,
  };
}

function publishStarted(state: BuilderState): BuilderState {
  const problems = problemsOf(graphOf(state));
  if (problems.length > 0) {
    return refused(state, problems);
  }
  if (state.publish !== 'draft') {
    return state;
  }
  return { ...state, publish: 'publishing', removed: null, notice: '' };
}

function publishDone(state: BuilderState): BuilderState {
  if (state.publish !== 'publishing') {
    return state;
  }
  return {
    ...state,
    publish: 'live',
    notice: 'Published. The workflow is live',
  };
}

export function reducer(
  state: BuilderState,
  action: BuilderAction
): BuilderState {
  switch (action.type) {
    case 'selected':
      return selected(state, action.id);
    case 'opened':
      return opened(state, action.id);
    case 'closed':
      return { ...state, isInspectorOpen: false };
    case 'renamed':
      return withStep(state, action.id, (step) => ({
        ...step,
        name: action.name,
      }));
    case 'fieldChanged':
      return fieldChanged(state, action.id, action.field, action.value);
    case 'wireStarted':
      return wireStarted(state, action.from, action.output);
    case 'wireAimed':
      return wireAimed(state, action.to);
    case 'wireDropped':
      return wireDropped(state);
    case 'wireCancelled':
      return { ...state, wiring: null };
    case 'connected':
      return connectedTo(state, linkOf(action), 'drawn');
    case 'disconnected':
      return disconnected(state, action.from, action.output);
    case 'moved':
      return moved(state, action.id, action.cell);
    case 'removed':
      return removed(state, action.id);
    case 'undone':
      return undone(state);
    case 'undoDismissed':
      return { ...state, removed: null };
    case 'publishStarted':
      return publishStarted(state);
    case 'publishDone':
      return publishDone(state);
    case 'restored':
      return { ...INITIAL, notice: 'The sample workflow is back' };
  }
}

/** How long publishing takes before the workflow is live. */
export const PUBLISH_MS = 1400;

const CONNECTING: Beat[] = [
  {
    after: 1700,
    by: 'demo',
    press: 'port-size-no',
    action: { type: 'wireStarted', from: 'size', output: 'no' },
  },
  { after: 520, by: 'demo', action: { type: 'wireAimed', to: 'welcome' } },
  { after: 900, by: 'demo', action: { type: 'wireDropped' } },
];

/** One problem is left, so this press is refused and opens the step that has it. */
const REFUSED: Beat = {
  after: 1500,
  by: 'demo',
  press: 'publish',
  action: { type: 'publishStarted' },
};

/** The text arrives a few letters at a time: the whole builder renders again on each beat. */
const TYPED_LETTERS = 3;

function typedTextsOf(text: string) {
  const prefixes = prefixesOf(text);
  const last = prefixes.length - 1;
  return prefixes.filter((_, index) => {
    const endsGroup = index % TYPED_LETTERS === TYPED_LETTERS - 1;
    return endsGroup || index === last;
  });
}

function typingBeatOf(value: string, index: number): Beat {
  return {
    after: keyDelayOf(index, 1300, 96),
    by: 'demo',
    action: {
      type: 'fieldChanged',
      id: 'enrich',
      field: 'instructions',
      value,
    },
  };
}

const TYPING = typedTextsOf(DEMO_INSTRUCTIONS).map(typingBeatOf);

/** The last step is the system's answer, so it plays even once a person has taken over. */
const PUBLISHING: Beat[] = [
  {
    after: 1100,
    by: 'demo',
    press: 'publish',
    action: { type: 'publishStarted' },
  },
  { after: PUBLISH_MS, action: { type: 'publishDone' } },
];

export const SCRIPT: Beat[] = [
  ...CONNECTING,
  REFUSED,
  ...TYPING,
  ...PUBLISHING,
];

/**
 * Under reduced motion the builder rests on the most telling moment: every wire in place, one
 * problem left and the inspector open on the field that has it.
 */
function restingOf() {
  let state = INITIAL;
  for (const beat of [...CONNECTING, REFUSED]) {
    state = reducer(state, beat.action);
  }
  return { ...state, wires: state.wires.map(placed), notice: '' };
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 4200;
