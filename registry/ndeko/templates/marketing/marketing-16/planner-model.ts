import { DIVISIONS, type Division } from './data';

const COMPACT_FORMAT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const BUDGET_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function reachOf(budget: number, division: Division) {
  const thousands = budget / 1000;
  return Math.round(thousands * division.perThousand);
}

export function totalReachOf(budget: number, selectedIds: readonly string[]) {
  let total = 0;
  for (const division of DIVISIONS) {
    if (selectedIds.includes(division.id)) {
      total += reachOf(budget, division);
    }
  }
  return total;
}

export function compactOf(value: number) {
  return COMPACT_FORMAT.format(value);
}

export function budgetTextOf(budget: number) {
  return BUDGET_FORMAT.format(budget);
}

const LARGEST_RATE = Math.max(
  ...DIVISIONS.map((division) => division.perThousand)
);

export function shareOf(budget: number, division: Division, maxBudget: number) {
  const largest = (maxBudget / 1000) * LARGEST_RATE;
  return reachOf(budget, division) / largest;
}
