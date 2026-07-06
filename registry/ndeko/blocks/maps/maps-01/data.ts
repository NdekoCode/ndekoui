import type { GlobeLocation } from '@/components/core/globe';
import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const ACTIVITY_TITLE = 'Agent activity';

export type RegionId = 'us-east' | 'europe' | 'india' | 'asia-pacific';

export type Region = {
  id: RegionId;
  name: string;
  place: string;
  location: GlobeLocation;
};

/** Neighbours on the globe sit less than sixty degrees apart, so every arc between them stays above the sphere. */
export const REGIONS: Region[] = [
  {
    id: 'us-east',
    name: 'US East',
    place: 'Virginia',
    location: [38.9, -77.04],
  },
  {
    id: 'europe',
    name: 'Europe',
    place: 'Frankfurt',
    location: [50.11, 8.68],
  },
  {
    id: 'india',
    name: 'India',
    place: 'Mumbai',
    location: [19.08, 72.88],
  },
  {
    id: 'asia-pacific',
    name: 'Asia Pacific',
    place: 'Singapore',
    location: [1.35, 103.82],
  },
];

export function regionOf(id: RegionId) {
  const region = REGIONS.find((candidate) => candidate.id === id);
  return region ?? REGIONS[0];
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

export type RegionLoad = {
  runs: number;
  /** Thousands of tokens a minute. */
  tokens: number;
  /** Cents an hour, so that sums stay exact. */
  cents: number;
};

/** Invented figures. The block marks them as illustrative. */
export const LOADS: Record<RegionId, RegionLoad> = {
  'us-east': { runs: 14, tokens: 182, cents: 940 },
  europe: { runs: 11, tokens: 140, cents: 710 },
  india: { runs: 6, tokens: 71, cents: 360 },
  'asia-pacific': { runs: 8, tokens: 96, cents: 490 },
};
