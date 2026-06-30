import {
  SEARCH_KINDS,
  type SearchEntry,
  type SearchKind,
} from './search-types';

type SearchField = 'title' | 'name' | 'group' | 'kind' | 'description';

type FieldScores = { prefix: number; wordStart: number; substring: number };

type PreparedText = { text: string; words: string[] };

type PreparedQuery = { text: string; tokens: string[] };

export type SearchRecord = {
  id: string;
  entry: SearchEntry;
  fields: Record<SearchField, PreparedText>;
};

export type RankedRecord = { record: SearchRecord; score: number };

export type KindBuckets = Record<SearchKind, RankedRecord[]>;

export type KindCounts = Record<SearchKind, number>;

const SEARCH_FIELDS: SearchField[] = [
  'title',
  'name',
  'group',
  'kind',
  'description',
];

/** The weakest title match still outranks the strongest description match. */
const FIELD_SCORES: Record<SearchField, FieldScores> = {
  title: { prefix: 100, wordStart: 80, substring: 40 },
  name: { prefix: 90, wordStart: 70, substring: 30 },
  group: { prefix: 60, wordStart: 50, substring: 20 },
  kind: { prefix: 45, wordStart: 45, substring: 0 },
  description: { prefix: 25, wordStart: 20, substring: 5 },
};

const KIND_TERMS: Record<SearchKind, string> = {
  primitive: 'primitive primitives',
  component: 'component components',
  block: 'block blocks',
  template: 'template templates',
  motion: 'motion animation',
};

const EXACT_TITLE_BONUS = 60;

const TITLE_PHRASE_BONUS = 30;

/** A single letter inside a word matches almost everything, so it only counts at a word start. */
const SHORTEST_INNER_TOKEN = 2;

const COMBINING_MARKS = /[̀-ͯ]/g;

const SEPARATORS = /[^a-z0-9]+/g;

export function normalizeSearchText(value: string) {
  const decomposed = value.normalize('NFD');
  const withoutMarks = decomposed.replace(COMBINING_MARKS, '');
  const lowered = withoutMarks.toLowerCase();
  const spaced = lowered.replace(SEPARATORS, ' ');
  return spaced.trim();
}

function isFilled(value: string) {
  return value.length > 0;
}

function prepareText(value: string): PreparedText {
  const text = normalizeSearchText(value);
  const words = text.split(' ');
  return { text, words };
}

function prepareQuery(query: string): PreparedQuery {
  const text = normalizeSearchText(query);
  const words = text.split(' ');
  const tokens = words.filter(isFilled);
  return { text, tokens };
}

export function hasSearchTerms(query: string) {
  const prepared = prepareQuery(query);
  return prepared.tokens.length > 0;
}

function searchIdOf(entry: SearchEntry) {
  return `${entry.kind}:${entry.name}`;
}

function prepareRecord(entry: SearchEntry): SearchRecord {
  return {
    id: searchIdOf(entry),
    entry,
    fields: {
      title: prepareText(entry.title),
      name: prepareText(entry.name),
      group: prepareText(entry.group),
      kind: prepareText(KIND_TERMS[entry.kind]),
      description: prepareText(entry.description),
    },
  };
}

export function prepareRecords(entries: SearchEntry[]) {
  const records: SearchRecord[] = [];
  const seenIds = new Set<string>();
  for (const entry of entries) {
    const record = prepareRecord(entry);
    if (seenIds.has(record.id)) {
      continue;
    }
    seenIds.add(record.id);
    records.push(record);
  }
  return records;
}

function matchScoreOf(field: PreparedText, token: string, scores: FieldScores) {
  if (field.text.startsWith(token)) {
    return scores.prefix;
  }
  const startsAWord = field.words.some((word) => word.startsWith(token));
  if (startsAWord) {
    return scores.wordStart;
  }
  const isLongEnough = token.length >= SHORTEST_INNER_TOKEN;
  const containsToken = field.text.includes(token);
  if (isLongEnough && containsToken) {
    return scores.substring;
  }
  return 0;
}

function tokenScoreOf(record: SearchRecord, token: string) {
  let best = 0;
  for (const field of SEARCH_FIELDS) {
    const scores = FIELD_SCORES[field];
    const score = matchScoreOf(record.fields[field], token, scores);
    best = Math.max(best, score);
  }
  return best;
}

function phraseBonusOf(record: SearchRecord, query: PreparedQuery) {
  const title = record.fields.title.text;
  if (title === query.text) {
    return EXACT_TITLE_BONUS;
  }
  if (title.startsWith(query.text)) {
    return TITLE_PHRASE_BONUS;
  }
  return 0;
}

function scoreOf(record: SearchRecord, query: PreparedQuery) {
  let total = 0;
  for (const token of query.tokens) {
    const tokenScore = tokenScoreOf(record, token);
    if (tokenScore === 0) {
      return 0;
    }
    total += tokenScore;
  }
  const bonus = phraseBonusOf(record, query);
  return total + bonus;
}

function compareRanked(first: RankedRecord, second: RankedRecord) {
  const byScore = second.score - first.score;
  if (byScore !== 0) {
    return byScore;
  }
  const firstLength = first.record.entry.title.length;
  const secondLength = second.record.entry.title.length;
  return firstLength - secondLength;
}

export function rankRecords(records: SearchRecord[], query: string) {
  const prepared = prepareQuery(query);
  const ranked: RankedRecord[] = [];
  if (prepared.tokens.length === 0) {
    return ranked;
  }
  for (const record of records) {
    const score = scoreOf(record, prepared);
    if (score > 0) {
      ranked.push({ record, score });
    }
  }
  ranked.sort(compareRanked);
  return ranked;
}

function emptyBuckets(): KindBuckets {
  return { primitive: [], component: [], block: [], template: [], motion: [] };
}

export function bucketsOf(ranked: RankedRecord[]) {
  const buckets = emptyBuckets();
  for (const item of ranked) {
    const kind = item.record.entry.kind;
    buckets[kind].push(item);
  }
  return buckets;
}

export function countsOfBuckets(buckets: KindBuckets) {
  const counts = emptyCounts();
  for (const kind of SEARCH_KINDS) {
    counts[kind] = buckets[kind].length;
  }
  return counts;
}

function emptyCounts(): KindCounts {
  return { primitive: 0, component: 0, block: 0, template: 0, motion: 0 };
}

export function countsOfRecords(records: SearchRecord[]) {
  const counts = emptyCounts();
  for (const record of records) {
    const kind = record.entry.kind;
    counts[kind] += 1;
  }
  return counts;
}
