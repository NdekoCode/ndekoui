import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  CASES,
  FIRST_REGRESSION,
  SECOND_REGRESSION,
  type EvalCase,
  type Outcome,
} from './data';

export type RunPhase = 'idle' | 'running' | 'done';

export type Verdict = 'accepted' | 'blocked';

export type ShipStatus = 'idle' | 'busy' | 'done';

export type Filter = 'all' | 'failing' | 'regressions';

export type CellStatus = 'none' | 'queued' | 'running' | Outcome;

export type EvalState = {
  phase: RunPhase;
  /** How many cases the candidate has finished, in the order of the list. */
  landed: number;
  filter: Filter;
  openId: string | null;
  verdicts: Record<string, Verdict>;
  ship: ShipStatus;
};

export type EvalAction =
  | { type: 'run' }
  | { type: 'landed' }
  | { type: 'filter'; filter: Filter }
  | { type: 'opened'; id: string }
  | { type: 'closed' }
  | { type: 'verdict'; id: string; verdict: Verdict }
  | { type: 'ship' }
  | { type: 'shipped' };

type Step = SessionStep<EvalState, EvalAction>;

/** How many cases run at the same time. */
const CONCURRENCY = 2;

export const INITIAL: EvalState = {
  phase: 'idle',
  landed: 0,
  filter: 'all',
  openId: null,
  verdicts: {},
  ship: 'idle',
};

function indexOfCase(id: string) {
  return CASES.findIndex((candidate) => candidate.id === id);
}

function hasLanded(state: EvalState, id: string) {
  const index = indexOfCase(id);
  return index < state.landed;
}

/** A change a person accepted counts as a pass: the expected answer follows the new reply. */
export function candidateStatusOf(state: EvalState, id: string): CellStatus {
  if (state.phase === 'idle') {
    return 'none';
  }
  const index = indexOfCase(id);
  if (index < state.landed) {
    if (state.verdicts[id] === 'accepted') {
      return 'pass';
    }
    return CASES[index].candidate.outcome;
  }
  const isRunning = index < state.landed + CONCURRENCY;
  if (isRunning) {
    return 'running';
  }
  return 'queued';
}

function isRegressionCase(entry: EvalCase) {
  const passedBefore = entry.production.outcome === 'pass';
  const failsNow = entry.candidate.outcome === 'fail';
  return passedBefore && failsNow;
}

export function isRegression(state: EvalState, id: string) {
  const index = indexOfCase(id);
  const entry = CASES[index];
  return hasLanded(state, id) && isRegressionCase(entry);
}

export function regressionsOf(state: EvalState) {
  return CASES.filter((entry) => isRegression(state, entry.id));
}

export function undecidedCountOf(state: EvalState) {
  const regressions = regressionsOf(state);
  const undecided = regressions.filter(
    (entry) => state.verdicts[entry.id] === undefined
  );
  return undecided.length;
}

export function blockedCountOf(state: EvalState) {
  const regressions = regressionsOf(state);
  const blocked = regressions.filter(
    (entry) => state.verdicts[entry.id] === 'blocked'
  );
  return blocked.length;
}

export function canShip(state: EvalState) {
  const isDone = state.phase === 'done';
  const undecided = undecidedCountOf(state);
  const blocked = blockedCountOf(state);
  const isClear = undecided + blocked === 0;
  return isDone && isClear;
}

export function isFailing(state: EvalState, entry: EvalCase) {
  const status = candidateStatusOf(state, entry.id);
  const candidateFails = status === 'fail' || status === 'flaky';
  const productionFails = entry.production.outcome === 'fail';
  return candidateFails || productionFails;
}

export function matchesFilter(state: EvalState, entry: EvalCase) {
  if (state.filter === 'failing') {
    return isFailing(state, entry);
  }
  if (state.filter === 'regressions') {
    return isRegression(state, entry.id);
  }
  return true;
}

function passCountOf(outcomes: CellStatus[]) {
  const passes = outcomes.filter((outcome) => outcome === 'pass');
  return passes.length;
}

export type PassRate = {
  passed: number;
  total: number;
  percent: number;
};

function rateOf(passed: number, total: number): PassRate {
  if (total === 0) {
    return { passed, total, percent: 0 };
  }
  const share = passed / total;
  const percent = Math.round(share * 100);
  return { passed, total, percent };
}

export const PRODUCTION_RATE = rateOf(
  passCountOf(CASES.map((entry) => entry.production.outcome)),
  CASES.length
);

/** Counted over the cases run so far, so the figure is a pass rate at every moment of the run. */
export function candidateRateOf(state: EvalState) {
  const landed = CASES.slice(0, state.landed);
  const statuses = landed.map((entry) => candidateStatusOf(state, entry.id));
  return rateOf(passCountOf(statuses), landed.length);
}

function run(state: EvalState): EvalState {
  if (state.phase !== 'idle') {
    return state;
  }
  return { ...state, phase: 'running' };
}

function landed(state: EvalState): EvalState {
  if (state.phase !== 'running') {
    return state;
  }
  const count = state.landed + 1;
  if (count < CASES.length) {
    return { ...state, landed: count };
  }
  return { ...state, landed: count, phase: 'done' };
}

function opened(state: EvalState, id: string): EvalState {
  if (state.openId === id) {
    return { ...state, openId: null };
  }
  return { ...state, openId: id };
}

function verdict(state: EvalState, id: string, next: Verdict): EvalState {
  const canDecide = isRegression(state, id) && state.ship === 'idle';
  if (!canDecide) {
    return state;
  }
  return { ...state, verdicts: { ...state.verdicts, [id]: next } };
}

function ship(state: EvalState): EvalState {
  const isReady = canShip(state) && state.ship === 'idle';
  if (!isReady) {
    return state;
  }
  return { ...state, ship: 'busy' };
}

function shipped(state: EvalState): EvalState {
  if (state.ship !== 'busy') {
    return state;
  }
  return { ...state, ship: 'done' };
}

export function reducer(state: EvalState, action: EvalAction): EvalState {
  switch (action.type) {
    case 'run':
      return run(state);
    case 'landed':
      return landed(state);
    case 'filter':
      return { ...state, filter: action.filter };
    case 'opened':
      return opened(state, action.id);
    case 'closed':
      return { ...state, openId: null };
    case 'verdict':
      return verdict(state, action.id, action.verdict);
    case 'ship':
      return ship(state);
    case 'shipped':
      return shipped(state);
  }
}

function hasStarted(state: EvalState) {
  return state.phase !== 'idle';
}

function hasVerdictOn(id: string) {
  return (state: EvalState) => state.verdicts[id] !== undefined;
}

function hasPressedShip(state: EvalState) {
  return state.ship !== 'idle';
}

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

const LAND_EVERY_MS = 340;

const LANDINGS: Step[] = CASES.map(() => ({
  after: LAND_EVERY_MS,
  action: { type: 'landed' },
}));

const RUN_STEP: Step = {
  after: 1400,
  by: 'person',
  press: 'run',
  action: { type: 'run' },
  isAnswered: hasStarted,
};

export const SCRIPT: Step[] = [
  RUN_STEP,
  ...LANDINGS,
  {
    after: 1200,
    by: 'demo',
    action: { type: 'filter', filter: 'regressions' },
  },
  {
    after: 1100,
    by: 'demo',
    press: `case-${FIRST_REGRESSION}`,
    action: { type: 'opened', id: FIRST_REGRESSION },
  },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'accept',
    action: { type: 'verdict', id: FIRST_REGRESSION, verdict: 'accepted' },
    isAnswered: hasVerdictOn(FIRST_REGRESSION),
  },
  {
    after: 1200,
    by: 'demo',
    press: `case-${SECOND_REGRESSION}`,
    action: { type: 'opened', id: SECOND_REGRESSION },
  },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'accept',
    action: { type: 'verdict', id: SECOND_REGRESSION, verdict: 'accepted' },
    isAnswered: hasVerdictOn(SECOND_REGRESSION),
  },
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'ship',
    action: { type: 'ship' },
    isAnswered: hasPressedShip,
  },
  { after: 1300, action: { type: 'shipped' } },
];

/** Under reduced motion the run is over and the first regression is open, still to decide. */
function restingOf() {
  let state = reducer(INITIAL, RUN_STEP.action);
  for (const step of LANDINGS) {
    state = reducer(state, step.action);
  }
  return reducer(state, { type: 'opened', id: FIRST_REGRESSION });
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3800;
