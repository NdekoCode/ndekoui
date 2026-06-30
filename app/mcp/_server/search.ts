import {
  prepareRecords,
  rankRecords,
  type SearchRecord,
} from '@/app/_site/site-search/search-score';
import type {
  SearchEntry,
  SearchKind,
} from '@/app/_site/site-search/search-types';

import { loadCatalogue, type CatalogueEntry, type ItemKind } from './catalogue';

type SearchIndex = {
  records: SearchRecord[];
  entriesByName: Map<string, CatalogueEntry>;
};

let searchIndexPromise: Promise<SearchIndex> | null = null;

/** The site's scorer knows five kinds; library items borrow the primitive one, so they rank by their words only. */
function scorerKindOf(kind: ItemKind): SearchKind {
  if (kind === 'lib') {
    return 'primitive';
  }
  return kind;
}

function searchEntryOf(entry: CatalogueEntry): SearchEntry {
  return {
    kind: scorerKindOf(entry.kind),
    name: entry.name,
    title: entry.title,
    group: entry.categoryName,
    description: entry.description,
    href: entry.previewUrl ?? '',
  };
}

async function buildSearchIndex(): Promise<SearchIndex> {
  const catalogue = await loadCatalogue();
  const searchEntries = catalogue.map(searchEntryOf);
  const records = prepareRecords(searchEntries);
  const entriesByName = new Map<string, CatalogueEntry>();
  for (const entry of catalogue) {
    entriesByName.set(entry.name, entry);
  }
  return { records, entriesByName };
}

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = buildSearchIndex().catch((error: unknown) => {
      searchIndexPromise = null;
      throw error;
    });
  }
  return searchIndexPromise;
}

function matchesKind(entry: CatalogueEntry, kind: ItemKind | undefined) {
  if (!kind) {
    return true;
  }
  return entry.kind === kind;
}

export async function searchCatalogue(
  query: string,
  kind: ItemKind | undefined,
  limit: number
) {
  const index = await loadSearchIndex();
  const ranked = rankRecords(index.records, query);
  const matches: CatalogueEntry[] = [];
  for (const result of ranked) {
    const entry = index.entriesByName.get(result.record.entry.name);
    if (!entry) {
      continue;
    }
    if (!matchesKind(entry, kind)) {
      continue;
    }
    matches.push(entry);
  }
  const shown = matches.slice(0, limit);
  return { total: matches.length, shown };
}
