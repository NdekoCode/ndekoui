import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const MAP_TITLE = 'Live runs';

export type RegionId =
  'us-west' | 'us-east' | 'south-america' | 'europe' | 'india' | 'asia-pacific';

export type Region = {
  id: RegionId;
  name: string;
  place: string;
  latitude: number;
  longitude: number;
};

/** From west to east: the order Tab follows across the map. */
export const REGIONS: Region[] = [
  {
    id: 'us-west',
    name: 'US West',
    place: 'Oregon',
    latitude: 45.6,
    longitude: -121.18,
  },
  {
    id: 'us-east',
    name: 'US East',
    place: 'Virginia',
    latitude: 38.9,
    longitude: -77.04,
  },
  {
    id: 'south-america',
    name: 'South America',
    place: 'São Paulo',
    latitude: -23.55,
    longitude: -46.63,
  },
  {
    id: 'europe',
    name: 'Europe',
    place: 'Frankfurt',
    latitude: 50.11,
    longitude: 8.68,
  },
  {
    id: 'india',
    name: 'India',
    place: 'Mumbai',
    latitude: 19.08,
    longitude: 72.88,
  },
  {
    id: 'asia-pacific',
    name: 'Asia Pacific',
    place: 'Singapore',
    latitude: 1.35,
    longitude: 103.82,
  },
];

export function regionOf(id: RegionId) {
  const region = REGIONS.find((candidate) => candidate.id === id);
  return region ?? REGIONS[0];
}

export type Route = {
  id: string;
  from: RegionId;
  to: RegionId;
};

/** The routes runs are handed along. None crosses the edge of the map. */
export const ROUTES: Route[] = [
  { id: 'us-west:us-east', from: 'us-west', to: 'us-east' },
  { id: 'us-east:europe', from: 'us-east', to: 'europe' },
  { id: 'us-east:south-america', from: 'us-east', to: 'south-america' },
  { id: 'europe:india', from: 'europe', to: 'india' },
  { id: 'india:asia-pacific', from: 'india', to: 'asia-pacific' },
];

function joins(route: Route, first: RegionId, second: RegionId) {
  const isSameWay = route.from === first && route.to === second;
  const isOtherWay = route.from === second && route.to === first;
  return isSameWay || isOtherWay;
}

/** The route between two regions, whichever way it is listed. */
export function routeBetween(first: RegionId, second: RegionId) {
  const route = ROUTES.find((candidate) => joins(candidate, first, second));
  return route ?? null;
}

export function touchesRegion(route: Route, id: RegionId | null) {
  return route.from === id || route.to === id;
}

export type AgentId = 'researcher' | 'writer' | 'coder';

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const AGENTS: Record<AgentId, Agent> = {
  researcher: { name: 'Researcher', series: 2 },
  writer: { name: 'Writer', series: 3 },
  coder: { name: 'Coder', series: 5 },
};

export const AGENT_IDS: AgentId[] = ['researcher', 'writer', 'coder'];

/** Runs live in each region when the map opens. Invented, and marked as illustrative. */
export const RUNS: Record<RegionId, number> = {
  'us-west': 7,
  'us-east': 14,
  'south-america': 5,
  europe: 11,
  india: 6,
  'asia-pacific': 8,
};
