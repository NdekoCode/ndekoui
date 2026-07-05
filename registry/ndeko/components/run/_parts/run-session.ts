import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import {
  reduceRun,
  type RunEvent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';

/** Events that land together, the way a backend sends them in one message: one render for all of them. */
export type RunBatch = { events: RunEvent[] };

export type RunStep = SessionStep<RunSnapshot, RunBatch>;

/** The clock a resting state is built on. Any start works: only the gaps between its times show. */
const RESTING_EPOCH_MS = 1000;

export function batchOf(...events: RunEvent[]): RunBatch {
  return { events };
}

export function batch(after: number, ...events: RunEvent[]): RunStep {
  return { after, action: { events } };
}

export function applyBatchAt(
  run: RunSnapshot,
  action: RunBatch,
  now: number
): RunSnapshot {
  let next = run;
  for (const event of action.events) {
    next = reduceRun(next, event, now);
  }
  return next;
}

/** Times are stamped when a batch lands, as a backend would stream it. */
export function reduceBatch(run: RunSnapshot, action: RunBatch) {
  return applyBatchAt(run, action, Date.now());
}

/**
 * The state a script ends on, with its times spread the way the script spreads them. It is what a
 * piece shows under reduced motion, where nothing plays.
 */
export function restingOf<State, Action>(
  initial: State,
  script: readonly SessionStep<State, Action>[],
  applyAt: (state: State, action: Action, now: number) => State
): State {
  let state = initial;
  let now = RESTING_EPOCH_MS;
  for (const step of script) {
    now += step.after;
    state = applyAt(state, step.action, now);
  }
  return state;
}
