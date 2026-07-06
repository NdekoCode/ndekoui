import type { Campaign } from './data';
import type { CampaignTotals } from './period-data';

export type SortKey = 'name' | 'spend' | 'clicks' | 'leads' | 'cost';

export type SortDirection = 'asc' | 'desc';

export type SortColumn = {
  key: SortKey;
  label: string;
  isNumeric: boolean;
};

export const SORT_COLUMNS: SortColumn[] = [
  { key: 'name', label: 'Campaign', isNumeric: false },
  { key: 'spend', label: 'Spend', isNumeric: true },
  { key: 'clicks', label: 'Clicks', isNumeric: true },
  { key: 'leads', label: 'Leads', isNumeric: true },
  { key: 'cost', label: 'Cost per lead', isNumeric: true },
];

/** Names read from A to Z and a lower cost is better, so those two start ascending. The others start with the biggest. */
export function defaultDirectionOf(key: SortKey): SortDirection {
  if (key === 'name' || key === 'cost') {
    return 'asc';
  }
  return 'desc';
}

export function columnOf(key: SortKey) {
  const column = SORT_COLUMNS.find((candidate) => candidate.key === key);
  return column ?? SORT_COLUMNS[0];
}

function numberOf(totals: CampaignTotals, key: SortKey) {
  if (key === 'spend') {
    return totals.spend;
  }
  if (key === 'clicks') {
    return totals.clicks;
  }
  if (key === 'leads') {
    return totals.leads;
  }
  return totals.costPerLead;
}

function directionFactorOf(direction: SortDirection) {
  if (direction === 'asc') {
    return 1;
  }
  return -1;
}

/** The campaigns of one channel in the order a column asks for. Equal values keep the order of their names. */
export function sortedCampaigns(
  members: readonly Campaign[],
  totals: Record<string, CampaignTotals>,
  key: SortKey,
  direction: SortDirection
) {
  const factor = directionFactorOf(direction);
  return [...members].sort((first, second) => {
    if (key === 'name') {
      return first.name.localeCompare(second.name) * factor;
    }
    const gap =
      numberOf(totals[first.id], key) - numberOf(totals[second.id], key);
    if (gap !== 0) {
      return gap * factor;
    }
    return first.name.localeCompare(second.name);
  });
}

export function sortSentenceOf(key: SortKey, direction: SortDirection) {
  const column = columnOf(key);
  const name = column.label.toLowerCase();
  if (key === 'name') {
    return `Sorted by ${name}, ${wordsOfDirection(direction, 'A to Z', 'Z to A')}`;
  }
  return `Sorted by ${name}, ${wordsOfDirection(direction, 'lowest first', 'highest first')}`;
}

function wordsOfDirection(
  direction: SortDirection,
  ascending: string,
  descending: string
) {
  if (direction === 'asc') {
    return ascending;
  }
  return descending;
}
