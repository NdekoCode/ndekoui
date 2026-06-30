import type { SearchTab } from './search-kinds';
import {
  countsOfBuckets,
  countsOfRecords,
  type KindBuckets,
  type RankedRecord,
  type SearchRecord,
} from './search-score';
import { SEARCH_KINDS, type SearchKind } from './search-types';

export type ResultSection = {
  kind: SearchKind;
  items: RankedRecord[];
  total: number;
};

export type BrowsePage = { name: string; href: string; count: number };

export type BrowseSection = { name: string; records: SearchRecord[] };

export type TabCounts = Record<SearchTab, number>;

/** Enough to show the best of each kind side by side; the kind's tab holds the rest. */
const ALL_TAB_LIMIT = 4;

/** Past this many rows a longer query finds faster than scrolling. */
export const KIND_TAB_LIMIT = 50;

function sectionOf(kind: SearchKind, buckets: KindBuckets, limit: number) {
  const matches = buckets[kind];
  const items = matches.slice(0, limit);
  return { kind, items, total: matches.length };
}

function hasItems(section: ResultSection) {
  return section.items.length > 0;
}

function bestScoreOf(section: ResultSection) {
  const first = section.items[0];
  if (!first) {
    return 0;
  }
  return first.score;
}

function compareSections(first: ResultSection, second: ResultSection) {
  const firstBest = bestScoreOf(first);
  const secondBest = bestScoreOf(second);
  return secondBest - firstBest;
}

/** In All, the kind holding the best match comes first; a tie keeps the order of the tabs. */
export function sectionsForTab(buckets: KindBuckets, tab: SearchTab) {
  if (tab !== 'all') {
    const section = sectionOf(tab, buckets, KIND_TAB_LIMIT);
    return [section].filter(hasItems);
  }
  const sections = SEARCH_KINDS.map((kind) =>
    sectionOf(kind, buckets, ALL_TAB_LIMIT)
  );
  const filled = sections.filter(hasItems);
  return filled.sort(compareSections);
}

export function tabCountsOf(
  records: SearchRecord[],
  ranked: RankedRecord[],
  buckets: KindBuckets,
  hasQuery: boolean
): TabCounts {
  if (hasQuery) {
    const matchCounts = countsOfBuckets(buckets);
    return { all: ranked.length, ...matchCounts };
  }
  const totals = countsOfRecords(records);
  return { all: records.length, ...totals };
}

function recordsOfKind(records: SearchRecord[], kind: SearchKind) {
  return records.filter((record) => record.entry.kind === kind);
}

export function browsePagesOf(records: SearchRecord[], kind: SearchKind) {
  const pages: BrowsePage[] = [];
  const pagesByHref = new Map<string, BrowsePage>();
  for (const record of recordsOfKind(records, kind)) {
    const href = record.entry.groupHref;
    if (!href) {
      continue;
    }
    const known = pagesByHref.get(href);
    if (known) {
      known.count += 1;
      continue;
    }
    const page = { name: record.entry.group, href, count: 1 };
    pagesByHref.set(href, page);
    pages.push(page);
  }
  return pages;
}

export function browseSectionsOf(records: SearchRecord[], kind: SearchKind) {
  const sections: BrowseSection[] = [];
  const sectionsByName = new Map<string, BrowseSection>();
  for (const record of recordsOfKind(records, kind)) {
    const name = record.entry.group;
    const known = sectionsByName.get(name);
    if (known) {
      known.records.push(record);
      continue;
    }
    const section = { name, records: [record] };
    sectionsByName.set(name, section);
    sections.push(section);
  }
  return sections;
}
