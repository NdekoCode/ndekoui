import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  EMBED_FAILURE,
  LINKS,
  nodeOf,
  NODES,
  PARAMS,
  type Link,
  type NodeId,
  type Params,
} from './data';
import {
  downstreamOf,
  missingInputOf,
  orderOf,
  refusalOf,
  resultOf,
  signatureOf,
  sourceOf,
  type Result,
} from './pipeline';

/**
 * How a wire came to be: there from the start, let go by a hand where it now sits, or made from a
 * menu. Only the last one draws itself, since the two others are already where they belong.
 */
export type Arrival = 'placed' | 'dropped' | 'drawn';

export type Wire = Link & {
  arrival: Arrival;
};

export type RunStatus =
  'idle' | 'running' | 'done' | 'cached' | 'failed' | 'skipped';

export type NodeRun = {
  status: RunStatus;
  /** What the node last computed. It stays, dimmed, once a setting upstream has changed. */
  result: Result | null;
  /** The signature of that result: the node is served from cache while it still matches. */
  signature: string | null;
  /** Why it failed or was skipped. */
  message: string | null;
};

/** A wire held out of an output: by a pointer, or by the demonstration. `to` is the node it is over. */
export type Wiring = {
  from: NodeId;
  to: NodeId | null;
};

export type Refused = {
  id: number;
  from: NodeId;
  to: NodeId;
  reason: string;
};

/** The node a run has reached. The token tells one run from the next, so a late timer changes nothing. */
export type Run = {
  order: NodeId[];
  at: number;
  token: number;
};

export type GraphState = {
  wires: Wire[];
  params: Params;
  runs: Record<NodeId, NodeRun>;
  run: Run | null;
  runCount: number;
  /** Embed fails the first time it runs, then works. */
  hasEmbedFailed: boolean;
  wiring: Wiring | null;
  refused: Refused | null;
  refusalCount: number;
  /** The last change, said to screen readers. */
  notice: string;
};

export type GraphAction =
  | { type: 'wireStarted'; from: NodeId }
  | { type: 'wireAimed'; to: NodeId | null }
  | { type: 'wireDropped' }
  | { type: 'wireCancelled' }
  | { type: 'connected'; from: NodeId; to: NodeId }
  | { type: 'disconnected'; to: NodeId }
  | { type: 'refusalCleared'; id: number }
  | { type: 'paramsChanged'; params: Partial<Params> }
  | { type: 'ran' }
  | { type: 'phaseEnded'; token: number }
  | { type: 'waited' };

type Beat = SessionStep<GraphState, GraphAction>;

/** A node served from cache shows it for this long before the run moves on. */
export const CACHED_MS = 320;

const NEVER_RUN: NodeRun = {
  status: 'idle',
  result: null,
  signature: null,
  message: null,
};

function placed(link: Link): Wire {
  return { ...link, arrival: 'placed' };
}

/** The documents were loaded before the page opened, so the first run finds them in cache. */
const LOADED: NodeRun = {
  status: 'idle',
  result: resultOf(LINKS, PARAMS, 'load'),
  signature: signatureOf(LINKS, PARAMS, 'load'),
  message: null,
};

export const INITIAL: GraphState = {
  wires: LINKS.map(placed),
  params: PARAMS,
  runs: {
    load: LOADED,
    split: NEVER_RUN,
    embed: NEVER_RUN,
    search: NEVER_RUN,
    answer: NEVER_RUN,
  },
  run: null,
  runCount: 0,
  hasEmbedFailed: false,
  wiring: null,
  refused: null,
  refusalCount: 0,
  notice: '',
};

/** The node of each setting: changing it makes that node, and what it feeds, out of date. */
const NODE_OF_PARAM: Record<keyof Params, NodeId> = {
  chunkSize: 'split',
  model: 'embed',
  topK: 'search',
  prompt: 'answer',
};

const PARAM_KEYS: (keyof Params)[] = ['chunkSize', 'model', 'topK', 'prompt'];

export function isRunning(state: GraphState) {
  return state.run !== null;
}

/** The node the run is on, with how long it stays there. */
export function phaseOf(state: GraphState) {
  const run = state.run;
  if (!run) {
    return null;
  }
  const id = run.order[run.at];
  const isCached = state.runs[id].status === 'cached';
  if (isCached) {
    return { id, token: run.token, ms: CACHED_MS };
  }
  return { id, token: run.token, ms: nodeOf(id).runMs };
}

function withRun(
  state: GraphState,
  id: NodeId,
  patch: Partial<NodeRun>
): GraphState {
  const next = { ...state.runs[id], ...patch };
  return { ...state, runs: { ...state.runs, [id]: next } };
}

/** A change makes a node and everything it feeds wait for the next run. Their last results stay. */
function staleFrom(state: GraphState, id: NodeId): GraphState {
  let next = state;
  for (const reached of downstreamOf(state.wires, id)) {
    next = withRun(next, reached, { status: 'idle', message: null });
  }
  return next;
}

function refusedWith(
  state: GraphState,
  from: NodeId,
  to: NodeId,
  reason: string
): GraphState {
  const id = state.refusalCount + 1;
  return {
    ...state,
    refused: { id, from, to, reason },
    refusalCount: id,
    notice: reason,
  };
}

function linked(
  state: GraphState,
  from: NodeId,
  to: NodeId,
  arrival: Arrival
): GraphState {
  if (isRunning(state)) {
    return state;
  }
  const reason = refusalOf(state.wires, from, to);
  if (reason !== null) {
    return refusedWith(state, from, to, reason);
  }
  const isSame = sourceOf(state.wires, to) === from;
  if (isSame) {
    return state;
  }
  const others = state.wires.filter((wire) => wire.to !== to);
  const rewired = { ...state, wires: [...others, { from, to, arrival }] };
  const next = staleFrom(rewired, to);
  const source = nodeOf(from).title;
  const target = nodeOf(to).title;
  return { ...next, refused: null, notice: `${source} now feeds ${target}` };
}

function wireStarted(state: GraphState, from: NodeId): GraphState {
  if (isRunning(state)) {
    return state;
  }
  return { ...state, wiring: { from, to: null }, refused: null };
}

function wireAimed(state: GraphState, to: NodeId | null): GraphState {
  const wiring = state.wiring;
  if (!wiring || wiring.to === to) {
    return state;
  }
  return { ...state, wiring: { ...wiring, to } };
}

function wireDropped(state: GraphState): GraphState {
  const wiring = state.wiring;
  if (!wiring) {
    return state;
  }
  const released = { ...state, wiring: null };
  if (wiring.to === null) {
    return released;
  }
  return linked(released, wiring.from, wiring.to, 'dropped');
}

function disconnected(state: GraphState, to: NodeId): GraphState {
  const wires = state.wires.filter((wire) => wire.to !== to);
  const hasChanged = wires.length !== state.wires.length;
  if (isRunning(state) || !hasChanged) {
    return state;
  }
  const next = staleFrom({ ...state, wires }, to);
  return { ...next, notice: `Nothing feeds ${nodeOf(to).title} now` };
}

function paramsChanged(
  state: GraphState,
  changes: Partial<Params>
): GraphState {
  if (isRunning(state)) {
    return state;
  }
  const params = { ...state.params, ...changes };
  let next: GraphState = { ...state, params, notice: '' };
  for (const key of PARAM_KEYS) {
    const hasChanged = params[key] !== state.params[key];
    if (hasChanged) {
      next = staleFrom(next, NODE_OF_PARAM[key]);
    }
  }
  return next;
}

/** A node cannot run without its input, nor after a node that failed or was itself skipped. */
function blockedReasonOf(state: GraphState, id: NodeId) {
  const missing = missingInputOf(state.wires, id);
  if (missing !== null) {
    return missing;
  }
  const source = sourceOf(state.wires, id);
  if (source === null) {
    return null;
  }
  const status = state.runs[source].status;
  const isHeldUp = status === 'failed' || status === 'skipped';
  if (isHeldUp) {
    return `Waiting on ${nodeOf(source).title}`;
  }
  return null;
}

function startStatusOf(isCached: boolean): RunStatus {
  if (isCached) {
    return 'cached';
  }
  return 'running';
}

function summaryOf(state: GraphState) {
  const failed = NODES.find((node) => state.runs[node.id].status === 'failed');
  if (failed) {
    const message = state.runs[failed.id].message;
    return `${failed.title} failed: ${message}. Retry is available`;
  }
  return 'The run is finished';
}

/**
 * Moves the run to the next node that takes time: one that runs, or one served from cache. The
 * nodes that cannot run are marked skipped on the way. Past the last node the run is over.
 */
function advanced(state: GraphState, run: Run, from: number): GraphState {
  let next = state;
  for (let at = from; at < run.order.length; at += 1) {
    const id = run.order[at];
    const reason = blockedReasonOf(next, id);
    if (reason === null) {
      const signature = signatureOf(next.wires, next.params, id);
      const last = next.runs[id];
      const isCached = last.result !== null && last.signature === signature;
      const started = withRun(next, id, { status: startStatusOf(isCached) });
      return { ...started, run: { ...run, at } };
    }
    next = withRun(next, id, { status: 'skipped', message: reason });
  }
  return { ...next, run: null, notice: summaryOf(next) };
}

function ran(state: GraphState): GraphState {
  if (isRunning(state)) {
    return state;
  }
  let next: GraphState = { ...state, wiring: null, refused: null };
  for (const node of NODES) {
    next = withRun(next, node.id, { status: 'idle', message: null });
  }
  const token = state.runCount + 1;
  const run = { order: orderOf(next.wires), at: 0, token };
  return advanced({ ...next, runCount: token, notice: 'Run started' }, run, 0);
}

function finished(state: GraphState, id: NodeId): GraphState {
  const failsNow = id === 'embed' && !state.hasEmbedFailed;
  if (failsNow) {
    const failed = withRun(state, id, {
      status: 'failed',
      message: EMBED_FAILURE,
    });
    return { ...failed, hasEmbedFailed: true };
  }
  return withRun(state, id, {
    status: 'done',
    result: resultOf(state.wires, state.params, id),
    signature: signatureOf(state.wires, state.params, id),
    message: null,
  });
}

function phaseEnded(state: GraphState, token: number): GraphState {
  const run = state.run;
  if (!run || run.token !== token) {
    return state;
  }
  const id = run.order[run.at];
  let next = state;
  if (state.runs[id].status === 'running') {
    next = finished(state, id);
  }
  return advanced(next, run, run.at + 1);
}

function refusalCleared(state: GraphState, id: number): GraphState {
  if (state.refused?.id !== id) {
    return state;
  }
  return { ...state, refused: null };
}

export function reducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'wireStarted':
      return wireStarted(state, action.from);
    case 'wireAimed':
      return wireAimed(state, action.to);
    case 'wireDropped':
      return wireDropped(state);
    case 'wireCancelled':
      return { ...state, wiring: null };
    case 'connected':
      return linked(state, action.from, action.to, 'drawn');
    case 'disconnected':
      return disconnected(state, action.to);
    case 'refusalCleared':
      return refusalCleared(state, action.id);
    case 'paramsChanged':
      return paramsChanged(state, action.params);
    case 'ran':
      return ran(state);
    case 'phaseEnded':
      return phaseEnded(state, action.token);
    case 'waited':
      return state;
  }
}

export function hasFailure(state: GraphState) {
  return NODES.some((node) => state.runs[node.id].status === 'failed');
}

function hasNoFailure(state: GraphState) {
  return !hasFailure(state);
}

/** Runs to its end at once: what the timers do one node after the other. */
function settled(state: GraphState) {
  let next = state;
  while (next.run) {
    next = phaseEnded(next, next.run.token);
  }
  return next;
}

function holdOutSteps(after: number, from: NodeId, to: NodeId): Beat[] {
  return [
    {
      after,
      by: 'demo',
      press: `out-${from}`,
      action: { type: 'wireStarted', from },
    },
    { after: 520, by: 'demo', action: { type: 'wireAimed', to } },
    { after: 850, by: 'demo', action: { type: 'wireDropped' } },
  ];
}

/** Chunks into a port that takes Vectors: the wire is refused and says why. */
const REFUSED = holdOutSteps(1500, 'split', 'search');

const CONNECTED = holdOutSteps(2700, 'embed', 'search');

const RUN: Beat = {
  after: 1300,
  by: 'demo',
  press: 'run',
  action: { type: 'ran' },
};

/**
 * A step of the system that only waits. The session holds it while a run is going, so what follows
 * comes once the run is over, however long it took.
 */
function runOver(after: number): Beat {
  return { after, action: { type: 'waited' } };
}

/** A failure that waits on a person is retried by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

const RETRY: Beat = {
  after: DECIDE_AFTER_MS,
  by: 'person',
  press: 'retry',
  action: { type: 'ran' },
  isAnswered: hasNoFailure,
};

export const SCRIPT: Beat[] = [
  ...REFUSED,
  ...CONNECTED,
  RUN,
  runOver(200),
  RETRY,
  runOver(600),
];

/**
 * Under reduced motion the editor rests on the second run: every wire in place, two nodes served
 * from cache, three that ran, each with its preview.
 */
function restingOf() {
  let state = INITIAL;
  for (const beat of CONNECTED) {
    state = reducer(state, beat.action);
  }
  const firstRun = settled(ran(state));
  const secondRun = settled(ran(firstRun));
  return { ...secondRun, wires: secondRun.wires.map(placed), notice: '' };
}

export const RESTING = restingOf();

export const LOOP_AFTER_MS = 3800;
