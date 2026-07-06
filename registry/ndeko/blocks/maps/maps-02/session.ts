import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import {
  AGENTS,
  regionOf,
  REGIONS,
  RUNS,
  type AgentId,
  type RegionId,
} from './data';

/** A run on its way from one region to another, drawn as a light along their route. */
export type Flight = {
  id: string;
  agentId: AgentId;
  from: RegionId;
  to: RegionId;
};

export type MapState = {
  /** Runs live in each region. A run in flight belongs to none until it lands. */
  runs: Record<RegionId, number>;
  flights: Flight[];
  /** The last flight that landed in each region: a ring answers it there. */
  landings: Partial<Record<RegionId, string>>;
  /** The marker pinned open, with its routes lit. */
  selectedId: RegionId | null;
  /** The last change, said to screen readers. */
  notice: string;
};

export type MapAction =
  | { type: 'departed'; flight: Flight }
  | { type: 'landed'; id: string }
  | { type: 'started'; region: RegionId }
  | { type: 'finished'; region: RegionId }
  | { type: 'toggled'; id: RegionId }
  | { type: 'cleared' };

type Step = SessionStep<MapState, MapAction>;

/** How long a light takes along its route. The run lands when it arrives. */
export const FLIGHT_MS = 1400;

export const INITIAL: MapState = {
  runs: RUNS,
  flights: [],
  landings: {},
  selectedId: null,
  notice: '',
};

export function runsWordOf(count: number) {
  if (count === 1) {
    return '1 run';
  }
  return `${count} runs`;
}

/** Europe, Frankfurt: 12 runs now. */
export function pinnedLineOf(id: RegionId, runs: number) {
  const region = regionOf(id);
  const count = runsWordOf(runs);
  return `${region.name}, ${region.place}: ${count} now`;
}

export function handoffLineOf(flight: Flight) {
  const agent = AGENTS[flight.agentId].name;
  const from = regionOf(flight.from).name;
  const to = regionOf(flight.to).name;
  return `${agent} handed a run from ${from} to ${to}`;
}

function withRuns(
  runs: Record<RegionId, number>,
  id: RegionId,
  change: number
): Record<RegionId, number> {
  const shifted = runs[id] + change;
  const count = Math.max(0, shifted);
  return { ...runs, [id]: count };
}

function withRegionRuns(
  state: MapState,
  id: RegionId,
  change: number
): MapState {
  const runs = withRuns(state.runs, id, change);
  return { ...state, runs };
}

function departed(state: MapState, flight: Flight): MapState {
  const isFlying = state.flights.some(
    (candidate) => candidate.id === flight.id
  );
  if (isFlying) {
    return state;
  }
  const runs = withRuns(state.runs, flight.from, -1);
  return { ...state, runs, flights: [...state.flights, flight] };
}

function landed(state: MapState, id: string): MapState {
  const flight = state.flights.find((candidate) => candidate.id === id);
  if (!flight) {
    return state;
  }
  const runs = withRuns(state.runs, flight.to, 1);
  const flights = state.flights.filter((candidate) => candidate.id !== id);
  const landings = { ...state.landings, [flight.to]: flight.id };
  const notice = handoffLineOf(flight);
  return { ...state, runs, flights, landings, notice };
}

function toggled(state: MapState, id: RegionId): MapState {
  if (state.selectedId === id) {
    return { ...state, selectedId: null, notice: '' };
  }
  const notice = pinnedLineOf(id, state.runs[id]);
  return { ...state, selectedId: id, notice };
}

export function reducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'departed':
      return departed(state, action.flight);
    case 'landed':
      return landed(state, action.id);
    case 'started':
      return withRegionRuns(state, action.region, 1);
    case 'finished':
      return withRegionRuns(state, action.region, -1);
    case 'toggled':
      return toggled(state, action.id);
    case 'cleared':
      return { ...state, selectedId: null, notice: '' };
  }
}

/** Every live run, those in flight included: a hand-off moves a run, it does not end it. */
export function totalRunsOf(state: MapState) {
  let total = state.flights.length;
  for (const region of REGIONS) {
    total += state.runs[region.id];
  }
  return total;
}

function flightOf(
  id: string,
  agentId: AgentId,
  from: RegionId,
  to: RegionId
): Flight {
  return { id, agentId, from, to };
}

function departs(after: number, flight: Flight): Step {
  return { after, action: { type: 'departed', flight } };
}

function lands(after: number, flight: Flight): Step {
  return { after, action: { type: 'landed', id: flight.id } };
}

/** The demonstration pins a marker open, or closes the one it pinned. */
function points(after: number, id: RegionId): Step {
  return {
    after,
    by: 'demo',
    press: `marker-${id}`,
    action: { type: 'toggled', id },
  };
}

const EAST_TO_EUROPE = flightOf(
  'east-europe',
  'researcher',
  'us-east',
  'europe'
);

const EUROPE_TO_INDIA = flightOf('europe-india', 'coder', 'europe', 'india');

const WEST_TO_EAST = flightOf('west-east', 'writer', 'us-west', 'us-east');

const INDIA_TO_ASIA = flightOf(
  'india-asia',
  'researcher',
  'india',
  'asia-pacific'
);

const EAST_TO_SOUTH = flightOf(
  'east-south',
  'coder',
  'us-east',
  'south-america'
);

const SOUTH_TO_EAST = flightOf(
  'south-east',
  'writer',
  'south-america',
  'us-east'
);

/**
 * Two flights overlap once, and every run that leaves a region is made up by one that arrives or
 * starts there, so the map ends the round as it began it.
 */
export const SCRIPT: Step[] = [
  departs(1400, EAST_TO_EUROPE),
  lands(FLIGHT_MS, EAST_TO_EUROPE),
  points(600, 'europe'),
  departs(1200, EUROPE_TO_INDIA),
  departs(700, WEST_TO_EAST),
  lands(700, EUROPE_TO_INDIA),
  lands(700, WEST_TO_EAST),
  points(900, 'india'),
  departs(1100, INDIA_TO_ASIA),
  lands(FLIGHT_MS, INDIA_TO_ASIA),
  departs(800, EAST_TO_SOUTH),
  lands(FLIGHT_MS, EAST_TO_SOUTH),
  departs(700, SOUTH_TO_EAST),
  lands(FLIGHT_MS, SOUTH_TO_EAST),
  { after: 600, action: { type: 'finished', region: 'asia-pacific' } },
  { after: 800, action: { type: 'started', region: 'us-west' } },
  points(800, 'india'),
];

/** Under reduced motion every route is drawn and still, with Europe pinned open to show its routes. */
export const RESTING: MapState = { ...INITIAL, selectedId: 'europe' };

export const LOOP_AFTER_MS = 2000;
