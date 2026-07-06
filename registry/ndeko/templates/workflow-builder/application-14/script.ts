import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { restingOf } from '@/registry/ndeko/lib/run-session';

import { pressKeyOf } from './catalog';
import { DEMO_STEP } from './data';
import { nodePressKeyOf } from './flow';
import { samplePressKeyOf } from './samples';
import {
  applyAt,
  INITIAL,
  isCueOpen,
  type BuilderAction,
  type BuilderState,
  type Cue,
} from './session';

type Step = SessionStep<BuilderState, BuilderAction>;

/** The pace a person types at, the default of the library: the script has no need of a faster one. */
const KEY_MS = 42;

export const SAVE_MS = 900;

/** A request that waits on a person is answered by the demonstration after this long. */
const DEMO_DECIDES_AFTER_MS = 2500;

function hasRunOnce(state: BuilderState) {
  return state.run.token >= 1;
}

function hasRunTwice(state: BuilderState) {
  return state.run.token >= 2;
}

function hasNoRequest(state: BuilderState) {
  return state.run.phase !== 'waiting';
}

function typingSteps(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((typed, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: {
      type: 'agentChanged',
      id: DEMO_STEP.id,
      patch: { instructions: typed },
    },
  }));
}

/** The run is played by its own clock. The script waits here until the run reaches the cue. */
function waitFor(cue: Cue): Step {
  return { after: 0, action: { type: 'cuePassed', cue } };
}

function sheet(
  after: number,
  type: 'paletteSheet' | 'inspectorSheet',
  isOpen: boolean
): Step {
  return { after, by: 'demo', action: { type, isOpen } };
}

/**
 * A step is added to the Delivery branch and set up. On a narrow page the palette and the inspector
 * live in sheets, which the demonstration opens and closes as a person would.
 */
const BUILDING: Step[] = [
  {
    after: 1200,
    by: 'demo',
    press: nodePressKeyOf(DEMO_STEP.afterId),
    action: { type: 'selected', id: DEMO_STEP.afterId },
  },
  sheet(450, 'paletteSheet', true),
  {
    after: 800,
    by: 'demo',
    press: pressKeyOf(DEMO_STEP.entryId),
    action: {
      type: 'stepAdded',
      entryId: DEMO_STEP.entryId,
      at: { at: 'after', stepId: DEMO_STEP.afterId },
      id: DEMO_STEP.id,
      name: DEMO_STEP.name,
    },
  },
  sheet(350, 'paletteSheet', false),
  sheet(300, 'inspectorSheet', true),
  ...typingSteps(DEMO_STEP.instructions, 600),
  sheet(500, 'inspectorSheet', false),
  { after: 400, by: 'demo', press: 'save', action: { type: 'saveStarted' } },
  { after: SAVE_MS, action: { type: 'saved' } },
];

/**
 * Two runs: a delivery question that goes through the new step, then a refund that stops on the
 * approval. Starting a run and answering the approval are the steps of a person.
 */
const RUNNING: Step[] = [
  {
    after: 1000,
    by: 'person',
    press: 'run',
    action: { type: 'runStarted', sampleId: 'delivery' },
    isAnswered: hasRunOnce,
  },
  waitFor('reply'),
  sheet(250, 'inspectorSheet', true),
  waitFor('settled'),
  sheet(1000, 'inspectorSheet', false),
  {
    after: 1100,
    by: 'person',
    press: samplePressKeyOf('refund'),
    action: { type: 'runStarted', sampleId: 'refund' },
    isAnswered: hasRunTwice,
  },
  waitFor('settled'),
  {
    after: DEMO_DECIDES_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'decided', decision: 'approved' },
    isAnswered: hasNoRequest,
  },
  waitFor('reply'),
  sheet(250, 'inspectorSheet', true),
  waitFor('settled'),
  sheet(1000, 'inspectorSheet', false),
];

export const SCRIPT: Step[] = [...BUILDING, ...RUNNING];

function cuesOf(steps: Step[]) {
  const cues: Cue[] = [];
  for (const step of steps) {
    if (step.action.type === 'cuePassed') {
      cues.push(step.action.cue);
    }
  }
  return cues;
}

const CUES = cuesOf(SCRIPT);

/** The steps of the system hold while the run has not reached the cue the script waits for. */
export function holdsForRun(state: BuilderState) {
  const cue = CUES[state.cuesPassed] ?? 'settled';
  return !isCueOpen(state, cue);
}

const PLAYED = restingOf(INITIAL, SCRIPT, applyAt);

/** Under reduced motion the flow shows its last run finished: the Refund branch taken, the others skipped, the reply written. */
export const RESTING: BuilderState = {
  ...PLAYED,
  save: { status: 'saved', at: null },
  arrivedId: null,
  notice: null,
  spoken: '',
  isPaletteOpen: false,
  isInspectorOpen: false,
};

export const LOOP_AFTER_MS = 3600;
