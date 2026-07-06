import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const OFFER = {
  product: 'Lumo',
  label: 'Launch offer',
  title: 'Founding members get three perks',
  lead: 'The offer closes when the clock runs out or the spots are claimed, whichever comes first.',
};

const HOUR_MS = 3_600_000;

const MINUTE_MS = 60_000;

const SECOND_MS = 1000;

const OFFER_HOURS_MS = 54 * HOUR_MS;

const OFFER_MINUTES_MS = 41 * MINUTE_MS;

const OFFER_SECONDS_MS = 12 * SECOND_MS;

export const OFFER_LENGTH_MS =
  OFFER_HOURS_MS + OFFER_MINUTES_MS + OFFER_SECONDS_MS;

export type PerkId = 'price' | 'call' | 'credits';

export type Perk = {
  id: PerkId;
  title: string;
  detail: string;
  cap: number;
  claimedAtLoad: number;
  series: SeriesSlot;
};

export const PERKS: Perk[] = [
  {
    id: 'price',
    title: 'Founding price',
    detail: 'Keep $12 a month for as long as you stay, instead of $24',
    cap: 500,
    claimedAtLoad: 396,
    series: 1,
  },
  {
    id: 'call',
    title: 'Setup call',
    detail: 'A 30 minute call with the team to wire your first agent',
    cap: 60,
    claimedAtLoad: 34,
    series: 2,
  },
  {
    id: 'credits',
    title: 'Bonus credits',
    detail: '5,000 credits added to your first month',
    cap: 400,
    claimedAtLoad: 255,
    series: 3,
  },
];

export type Join = { id: PerkId; count: number };

export const JOINS: Join[] = [
  { id: 'price', count: 9 },
  { id: 'credits', count: 14 },
  { id: 'call', count: 2 },
  { id: 'price', count: 11 },
  { id: 'credits', count: 8 },
  { id: 'call', count: 3 },
  { id: 'price', count: 7 },
];

export const DEMO_CLAIM: PerkId = 'call';

export type Claimed = Record<PerkId, number>;

function claimedAtLoadOf() {
  const claimed: Claimed = { price: 0, call: 0, credits: 0 };
  for (const perk of PERKS) {
    claimed[perk.id] = perk.claimedAtLoad;
  }
  return claimed;
}

export const CLAIMED_AT_LOAD = claimedAtLoadOf();

export function perkOf(id: PerkId) {
  const perk = PERKS.find((candidate) => candidate.id === id);
  return perk ?? PERKS[0];
}

export function shareOf(claimed: number, cap: number) {
  if (cap <= 0) {
    return 0;
  }
  const share = claimed / cap;
  return Math.min(1, share);
}
