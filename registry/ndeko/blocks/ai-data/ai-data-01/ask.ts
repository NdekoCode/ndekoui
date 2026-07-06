import {
  PLAN_LABEL,
  PLANS,
  REGION_LABEL,
  REGIONS,
  renewsThisQuarter,
  type Account,
  type PlanId,
  type RegionId,
} from './data';

export const ASK_EXAMPLE = 'enterprise in europe over 100 seats';

export const ASK_FAILED_LINE =
  'Nothing to filter in that. Name a plan, a region, seats over or under a number, or what renews this quarter.';

export type Filter =
  | { kind: 'plan'; plans: PlanId[] }
  | { kind: 'region'; regions: RegionId[] }
  | { kind: 'seatsOver'; count: number }
  | { kind: 'seatsUnder'; count: number }
  | { kind: 'renewal' };

export type FilterKind = Filter['kind'];

const PLAN_PHRASES: Record<PlanId, string[]> = {
  starter: ['starter'],
  team: ['team', 'teams'],
  business: ['business'],
  enterprise: ['enterprise', 'enterprises'],
};

const REGION_PHRASES: Record<RegionId, string[]> = {
  europe: ['europe', 'european', 'eu'],
  'north-america': ['north america', 'north american', 'usa', 'canada'],
  'asia-pacific': ['asia pacific', 'asia', 'asian', 'apac'],
  'latin-america': ['latin america', 'latin american', 'latam'],
};

const RENEWAL_PHRASES = [
  'renew',
  'renews',
  'renewing',
  'renewal',
  'renewals',
  'expires',
  'expiring',
];

const OVER = /\b(?:over|above|more than|bigger than|larger than) (\d+)\b/;

const UNDER = /\b(?:under|below|fewer than|less than|smaller than) (\d+)\b/;

/** Lower case words between single spaces, with a space at both ends so a phrase is matched whole. */
function sentenceOf(text: string) {
  const lowered = text.toLowerCase();
  const spaced = lowered.replace(/[^a-z0-9]+/g, ' ');
  const trimmed = spaced.trim();
  return ` ${trimmed} `;
}

function names(sentence: string, phrases: string[]) {
  return phrases.some((phrase) => sentence.includes(` ${phrase} `));
}

function countAfter(sentence: string, bound: RegExp) {
  const match = bound.exec(sentence);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

/**
 * Reads a plain question into filters with a handful of word lists: no model is called.
 * It returns nothing when the question names nothing the table can filter on.
 */
export function filtersOfQuestion(text: string): Filter[] | null {
  const sentence = sentenceOf(text);
  const filters: Filter[] = [];
  const plans = PLANS.filter((plan) => names(sentence, PLAN_PHRASES[plan]));
  if (plans.length > 0) {
    filters.push({ kind: 'plan', plans });
  }
  const regions = REGIONS.filter((region) =>
    names(sentence, REGION_PHRASES[region])
  );
  if (regions.length > 0) {
    filters.push({ kind: 'region', regions });
  }
  const over = countAfter(sentence, OVER);
  if (over !== null) {
    filters.push({ kind: 'seatsOver', count: over });
  }
  const under = countAfter(sentence, UNDER);
  if (under !== null) {
    filters.push({ kind: 'seatsUnder', count: under });
  }
  if (names(sentence, RENEWAL_PHRASES)) {
    filters.push({ kind: 'renewal' });
  }
  if (filters.length === 0) {
    return null;
  }
  return filters;
}

/** A new question adds to what is already asked: it replaces a filter of the same kind and keeps the others in place. */
export function mergedFilters(current: Filter[], asked: Filter[]) {
  const kept = current.map((filter) => {
    const replacement = asked.find(
      (candidate) => candidate.kind === filter.kind
    );
    return replacement ?? filter;
  });
  const currentKinds = current.map((filter) => filter.kind);
  const added = asked.filter((filter) => !currentKinds.includes(filter.kind));
  return [...kept, ...added];
}

function orListOf(labels: string[]) {
  return labels.join(' or ');
}

export function filterLabelOf(filter: Filter) {
  switch (filter.kind) {
    case 'plan': {
      const labels = filter.plans.map((plan) => PLAN_LABEL[plan]);
      return `Plan: ${orListOf(labels)}`;
    }
    case 'region': {
      const labels = filter.regions.map((region) => REGION_LABEL[region]);
      return `Region: ${orListOf(labels)}`;
    }
    case 'seatsOver':
      return `Seats over ${filter.count}`;
    case 'seatsUnder':
      return `Seats under ${filter.count}`;
    case 'renewal':
      return 'Renews this quarter';
  }
}

export function matchesFilter(account: Account, filter: Filter) {
  switch (filter.kind) {
    case 'plan':
      return filter.plans.includes(account.plan);
    case 'region':
      return filter.regions.includes(account.region);
    case 'seatsOver':
      return account.seats > filter.count;
    case 'seatsUnder':
      return account.seats < filter.count;
    case 'renewal':
      return renewsThisQuarter(account);
  }
}
