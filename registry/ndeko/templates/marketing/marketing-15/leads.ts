import { LEADS, type Lead, type StageFilter } from './data';

export type SortKey = 'value' | 'touch';

export type SortDirection = 'asc' | 'desc';

export type LeadsView = {
  stage: StageFilter;
  sortKey: SortKey | null;
  direction: SortDirection;
};

const MONEY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function valueOf(lead: Lead) {
  return MONEY_FORMAT.format(lead.valueCents / 100);
}

function signOf(direction: SortDirection) {
  if (direction === 'asc') {
    return 1;
  }
  return -1;
}

function measureOf(lead: Lead, key: SortKey) {
  if (key === 'value') {
    return lead.valueCents;
  }
  return lead.touchedDaysAgo;
}

function isInStage(lead: Lead, stage: StageFilter) {
  if (stage === 'all') {
    return true;
  }
  return lead.stage === stage;
}

export function visibleLeadsOf(view: LeadsView) {
  const inStage = LEADS.filter((lead) => isInStage(lead, view.stage));
  const key = view.sortKey;
  if (key === null) {
    return inStage;
  }
  const sign = signOf(view.direction);
  return [...inStage].sort((first, second) => {
    const gap = measureOf(first, key) - measureOf(second, key);
    return gap * sign;
  });
}

function firstDirectionOf(key: SortKey): SortDirection {
  if (key === 'value') {
    return 'desc';
  }
  return 'asc';
}

function flippedOf(direction: SortDirection): SortDirection {
  if (direction === 'asc') {
    return 'desc';
  }
  return 'asc';
}

export function sortedBy(view: LeadsView, key: SortKey): LeadsView {
  if (view.sortKey === key) {
    return { ...view, direction: flippedOf(view.direction) };
  }
  return { ...view, sortKey: key, direction: firstDirectionOf(key) };
}

export function ariaSortOf(view: LeadsView, key: SortKey) {
  if (view.sortKey !== key) {
    return 'none' as const;
  }
  if (view.direction === 'asc') {
    return 'ascending' as const;
  }
  return 'descending' as const;
}
