import { useSyncExternalStore } from 'react';

import { prepareRecords, type SearchRecord } from './search-score';
import {
  SEARCH_KINDS,
  type SearchEntry,
  type SearchKind,
} from './search-types';

type IndexStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SearchIndexState = {
  status: IndexStatus;
  records: SearchRecord[];
};

const SEARCH_INDEX_URL = '/search-index';

const IDLE: SearchIndexState = { status: 'idle', records: [] };

const LOADING: SearchIndexState = { status: 'loading', records: [] };

const FAILED: SearchIndexState = { status: 'error', records: [] };

/** Kept outside React so the index survives the header remounting between sections. */
let currentState = IDLE;

const listeners = new Set<() => void>();

function publish(nextState: SearchIndexState) {
  currentState = nextState;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function clientSnapshot() {
  return currentState;
}

function serverSnapshot() {
  return IDLE;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isSearchKind(value: unknown): value is SearchKind {
  return SEARCH_KINDS.some((kind) => kind === value);
}

function isOptionalString(value: unknown) {
  const isMissing = value === undefined;
  return isMissing || isString(value);
}

function isSearchEntry(value: unknown): value is SearchEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const hasKind = isSearchKind(candidate.kind);
  const hasName = isString(candidate.name);
  const hasTitle = isString(candidate.title);
  const hasGroup = isString(candidate.group);
  const hasDescription = isString(candidate.description);
  const hasHref = isString(candidate.href);
  const hasGroupHref = isOptionalString(candidate.groupHref);
  const hasTexts = hasName && hasTitle && hasGroup && hasDescription;
  const hasLinks = hasHref && hasGroupHref;
  return hasKind && hasTexts && hasLinks;
}

function entriesOf(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }
  const entries = (payload as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.filter(isSearchEntry);
}

async function fetchSearchEntries() {
  const response = await fetch(SEARCH_INDEX_URL);
  if (!response.ok) {
    throw new Error(`The search index answered ${response.status}`);
  }
  const payload: unknown = await response.json();
  return entriesOf(payload);
}

export async function loadSearchIndex() {
  const isLoading = currentState.status === 'loading';
  const isReady = currentState.status === 'ready';
  if (isLoading || isReady) {
    return;
  }
  publish(LOADING);
  try {
    const entries = await fetchSearchEntries();
    const records = prepareRecords(entries);
    publish({ status: 'ready', records });
  } catch {
    publish(FAILED);
  }
}

export function useSearchIndex() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
