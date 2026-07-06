import { format, parseISO } from 'date-fns';

import { ENTRIES, type ChangeKind, type Entry, type TypeFilter } from './data';

export type MonthGroup = {
  id: string;
  label: string;
  entries: Entry[];
};

const MONTH_PATTERN = 'MMMM yyyy';

const DAY_PATTERN = 'd MMM';

export function monthIdOf(date: string) {
  return date.slice(0, 7);
}

export function monthLabelOf(monthId: string) {
  const parsed = parseISO(`${monthId}-01`);
  return format(parsed, MONTH_PATTERN);
}

export function dayLabelOf(date: string) {
  const parsed = parseISO(date);
  return format(parsed, DAY_PATTERN);
}

function matches(entry: Entry, filter: TypeFilter) {
  if (filter === 'all') {
    return true;
  }
  return entry.kind === filter;
}

/** Entries in the order of the list, grouped by month, the months that hold none left out. */
export function groupsOf(filter: TypeFilter): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const entry of ENTRIES) {
    if (!matches(entry, filter)) {
      continue;
    }
    const id = monthIdOf(entry.date);
    const last = groups.at(-1);
    if (last?.id === id) {
      last.entries.push(entry);
      continue;
    }
    groups.push({ id, label: monthLabelOf(id), entries: [entry] });
  }
  return groups;
}

export function entryCountOf(groups: MonthGroup[]) {
  let total = 0;
  for (const group of groups) {
    total += group.entries.length;
  }
  return total;
}

export function countOfKind(kind: ChangeKind | 'all') {
  if (kind === 'all') {
    return ENTRIES.length;
  }
  const ofKind = ENTRIES.filter((entry) => entry.kind === kind);
  return ofKind.length;
}

export function entryOf(id: string) {
  return ENTRIES.find((entry) => entry.id === id);
}
