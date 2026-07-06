import type { GlobeLocation } from '@/components/core/globe';
import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  AGENTS,
  LOADS,
  regionOf,
  REGIONS,
  type AgentId,
  type Region,
  type RegionId,
  type RegionLoad,
} from './data';
import { isNearCentreOf, regionViewOf, routeViewOf } from './geo';

/** What one run carries while it lives in a region: thousands of tokens a minute and cents an hour. */
export type RunRate = {
  tokens: number;
  cents: number;
};

export type Handoff = {
  id: number;
  agentId: AgentId;
  from: RegionId;
  to: RegionId;
};

/** What the globe turns to: the region picked last, or the route of the hand-off that just happened. */
export type Facing =
  | { kind: 'region'; id: RegionId }
  | { kind: 'route'; from: RegionId; to: RegionId };

export type ActivityState = {
  selectedId: RegionId;
  loads: Record<RegionId, RegionLoad>;
  lastHandoff: Handoff;
  /** The hand-off whose arc still has to draw itself. Null while the arc on the globe is whole. */
  drawingId: number | null;
  facing: Facing;
  nextId: number;
  /** The last change, said to screen readers. */
  notice: string;
};

export type ActivityAction =
  | { type: 'selected'; id: RegionId }
  | { type: 'started'; region: RegionId; rate: RunRate }
  | { type: 'finished'; region: RegionId; rate: RunRate }
  | {
      type: 'handedOff';
      agentId: AgentId;
      from: RegionId;
      to: RegionId;
      rate: RunRate;
    };

type Step = SessionStep<ActivityState, ActivityAction>;

type Sign = 1 | -1;

/** The hand-off a round ends on: a new round starts where the last one stopped, so the loop never shows. */
const LAST_HANDOFF: Handoff = {
  id: 1,
  agentId: 'coder',
  from: 'us-east',
  to: 'europe',
};

export const INITIAL: ActivityState = {
  selectedId: 'us-east',
  loads: LOADS,
  lastHandoff: LAST_HANDOFF,
  drawingId: null,
  facing: { kind: 'route', from: 'us-east', to: 'europe' },
  nextId: LAST_HANDOFF.id + 1,
  notice: '',
};

/** A route reads the same both ways, so a hand-off back along it needs no turn. */
function routeKeyOf(from: RegionId, to: RegionId) {
  const ends = [from, to];
  ends.sort();
  return `route:${ends.join(':')}`;
}

export function facingKeyOf(facing: Facing) {
  if (facing.kind === 'region') {
    return `region:${facing.id}`;
  }
  return routeKeyOf(facing.from, facing.to);
}

export function handoffKeyOf(handoff: Handoff) {
  return routeKeyOf(handoff.from, handoff.to);
}

export function facingLocationOf(facing: Facing): GlobeLocation {
  if (facing.kind === 'region') {
    const region = regionOf(facing.id);
    return regionViewOf(region.location);
  }
  const from = regionOf(facing.from).location;
  const to = regionOf(facing.to).location;
  return routeViewOf(from, to);
}

/**
 * The regions whose marker the globe may draw while it turns from one view to the next: close to
 * the centre of both, so on the front of the sphere and inside the disk the whole way.
 */
export function regionsInViewOf(
  target: GlobeLocation,
  previous: GlobeLocation
): Region[] {
  return REGIONS.filter((region) => {
    const isAhead = isNearCentreOf(region.location, target);
    const wasInView = isNearCentreOf(region.location, previous);
    return isAhead && wasInView;
  });
}

/** US East in front, or: the route from Europe to India in front. */
export function facingLineOf(facing: Facing) {
  if (facing.kind === 'region') {
    const name = regionOf(facing.id).name;
    return `${name} in front`;
  }
  const from = regionOf(facing.from).name;
  const to = regionOf(facing.to).name;
  return `the route from ${from} to ${to} in front`;
}

function shifted(value: number, amount: number, sign: Sign) {
  const change = amount * sign;
  const next = value + change;
  return Math.max(0, next);
}

function loadAfter(load: RegionLoad, rate: RunRate, sign: Sign): RegionLoad {
  return {
    runs: shifted(load.runs, 1, sign),
    tokens: shifted(load.tokens, rate.tokens, sign),
    cents: shifted(load.cents, rate.cents, sign),
  };
}

function withRun(
  state: ActivityState,
  region: RegionId,
  rate: RunRate,
  sign: Sign
): ActivityState {
  const load = loadAfter(state.loads[region], rate, sign);
  return { ...state, loads: { ...state.loads, [region]: load } };
}

export function handoffLineOf(handoff: Handoff) {
  const agent = AGENTS[handoff.agentId].name;
  const from = regionOf(handoff.from).name;
  const to = regionOf(handoff.to).name;
  return `${agent} handed a run from ${from} to ${to}`;
}

function facesRegion(facing: Facing, id: RegionId) {
  if (facing.kind !== 'region') {
    return false;
  }
  return facing.id === id;
}

/** Picking a region turns the globe to it, also when it is already picked and a hand-off turned the globe away. */
function selected(state: ActivityState, id: RegionId): ActivityState {
  const isPicked = state.selectedId === id;
  const isInFront = facesRegion(state.facing, id);
  if (isPicked && isInFront) {
    return state;
  }
  const facing: Facing = { kind: 'region', id };
  const notice = facingLineOf(facing);
  return { ...state, selectedId: id, facing, notice };
}

/** A run leaves one region for another: the globe turns to show both, and the arc draws itself. */
function handedOff(
  state: ActivityState,
  agentId: AgentId,
  from: RegionId,
  to: RegionId,
  rate: RunRate
): ActivityState {
  const left = withRun(state, from, rate, -1);
  const arrived = withRun(left, to, rate, 1);
  const handoff: Handoff = { id: state.nextId, agentId, from, to };
  const facing: Facing = { kind: 'route', from, to };
  const nextId = state.nextId + 1;
  const notice = handoffLineOf(handoff);
  return {
    ...arrived,
    lastHandoff: handoff,
    drawingId: handoff.id,
    facing,
    nextId,
    notice,
  };
}

export function reducer(
  state: ActivityState,
  action: ActivityAction
): ActivityState {
  switch (action.type) {
    case 'selected':
      return selected(state, action.id);
    case 'started':
      return withRun(state, action.region, action.rate, 1);
    case 'finished':
      return withRun(state, action.region, action.rate, -1);
    case 'handedOff':
      return handedOff(
        state,
        action.agentId,
        action.from,
        action.to,
        action.rate
      );
  }
}

export function totalRunsOf(state: ActivityState) {
  let total = 0;
  for (const region of REGIONS) {
    total += state.loads[region.id].runs;
  }
  return total;
}

const SHORT_RUN: RunRate = { tokens: 12, cents: 62 };

const LONG_RUN: RunRate = { tokens: 14, cents: 71 };

const CODE_RUN: RunRate = { tokens: 9, cents: 48 };

/**
 * Two hand-offs and one pick: the globe turns three times a round and rests in between. Every run
 * that starts also ends and every hand-off is answered, so each region is back to its first figures
 * when the round ends, facing the same route.
 */
export const SCRIPT: Step[] = [
  {
    after: 1800,
    action: { type: 'started', region: 'us-east', rate: SHORT_RUN },
  },
  {
    after: 1400,
    action: {
      type: 'handedOff',
      agentId: 'researcher',
      from: 'europe',
      to: 'india',
      rate: LONG_RUN,
    },
  },
  {
    after: 2600,
    action: { type: 'started', region: 'asia-pacific', rate: SHORT_RUN },
  },
  {
    after: 1400,
    action: { type: 'finished', region: 'us-east', rate: SHORT_RUN },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'region-us-east',
    action: { type: 'selected', id: 'us-east' },
  },
  {
    after: 2800,
    action: {
      type: 'handedOff',
      agentId: 'coder',
      from: 'us-east',
      to: 'europe',
      rate: CODE_RUN,
    },
  },
  {
    after: 1600,
    action: { type: 'finished', region: 'europe', rate: CODE_RUN },
  },
  {
    after: 1300,
    action: { type: 'started', region: 'us-east', rate: CODE_RUN },
  },
  {
    after: 1300,
    action: { type: 'finished', region: 'asia-pacific', rate: SHORT_RUN },
  },
  {
    after: 1300,
    action: { type: 'started', region: 'europe', rate: LONG_RUN },
  },
  {
    after: 1300,
    action: { type: 'finished', region: 'india', rate: LONG_RUN },
  },
];

/** Under reduced motion the globe rests on the route from US East to Europe, its arc drawn, as a round begins and ends. */
export const RESTING = INITIAL;

export const LOOP_AFTER_MS = 2400;
