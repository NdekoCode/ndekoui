import { INSTALL_SEARCH_TEXT } from './data';
import { PAGES, type Block, type DocPage, type PageId } from './pages';

export type SearchEntry = {
  key: string;
  pageId: PageId;
  headingId: string | null;
  title: string;
  crumb: string;
  text: string;
};

export type SearchResult = {
  entry: SearchEntry;
  snippet: string;
};

export type MarkedPart = {
  key: string;
  text: string;
  isMatch: boolean;
};

type Range = {
  start: number;
  end: number;
};

/** A single letter matches nearly every page, so a word counts from two letters. */
const MIN_WORD_LENGTH = 2;

const MAX_RESULTS = 6;

const SNIPPET_BEFORE = 36;

const SNIPPET_LENGTH = 116;

function plainOf(text: string) {
  return text.replaceAll('`', '');
}

function textOfBlock(block: Block) {
  switch (block.kind) {
    case 'text':
      return plainOf(block.text);
    case 'list':
      return plainOf(block.items.join('. '));
    case 'code':
      return plainOf(block.code);
    case 'callout':
      return plainOf(block.text);
    case 'install':
      return INSTALL_SEARCH_TEXT;
    case 'table': {
      const rows = block.rows.map((row) => row.join(', '));
      return rows.join('. ');
    }
    case 'links': {
      const labels = block.links.map((link) => link.label);
      return labels.join('. ');
    }
  }
}

function entriesOfPage(page: DocPage): SearchEntry[] {
  const pageEntry: SearchEntry = {
    key: page.id,
    pageId: page.id,
    headingId: null,
    title: page.title,
    crumb: page.category,
    text: page.lead,
  };
  const sectionEntries = page.sections.map((section) => {
    const texts = section.blocks.map(textOfBlock);
    const entry: SearchEntry = {
      key: `${page.id}:${section.id}`,
      pageId: page.id,
      headingId: section.id,
      title: section.title,
      crumb: `${page.category} / ${page.title}`,
      text: texts.join(' '),
    };
    return entry;
  });
  return [pageEntry, ...sectionEntries];
}

const ENTRIES = PAGES.flatMap(entriesOfPage);

export function wordsOf(query: string) {
  const lowered = query.toLowerCase();
  const pieces = lowered.split(/\s+/);
  return pieces.filter((piece) => piece.length >= MIN_WORD_LENGTH);
}

function scoreOf(entry: SearchEntry, words: string[]) {
  const title = entry.title.toLowerCase();
  const text = entry.text.toLowerCase();
  let score = 0;
  for (const word of words) {
    const isInTitle = title.includes(word);
    const isInText = text.includes(word);
    if (!isInTitle && !isInText) {
      return 0;
    }
    if (isInTitle) {
      score += 3;
    }
    if (isInText) {
      score += 1;
    }
  }
  return score;
}

function firstMatchOf(lowered: string, words: string[]) {
  let first = -1;
  for (const word of words) {
    const at = lowered.indexOf(word);
    const isFound = at !== -1;
    const isEarlier = first === -1 || at < first;
    if (isFound && isEarlier) {
      first = at;
    }
  }
  return first;
}

function ellipsisIf(isCut: boolean) {
  if (isCut) {
    return '…';
  }
  return '';
}

function snippetOf(text: string, words: string[]) {
  const first = firstMatchOf(text.toLowerCase(), words);
  const wanted = first - SNIPPET_BEFORE;
  const start = Math.max(0, wanted);
  const end = Math.min(text.length, start + SNIPPET_LENGTH);
  const slice = text.slice(start, end).trim();
  const before = ellipsisIf(start > 0);
  const after = ellipsisIf(end < text.length);
  return `${before}${slice}${after}`;
}

type Scored = {
  entry: SearchEntry;
  score: number;
};

function hasScore(scored: Scored) {
  return scored.score > 0;
}

function byScore(first: Scored, second: Scored) {
  return second.score - first.score;
}

export function searchOf(query: string): SearchResult[] {
  const words = wordsOf(query);
  if (words.length === 0) {
    return [];
  }
  const scored = ENTRIES.map((entry) => ({
    entry,
    score: scoreOf(entry, words),
  }));
  const matching = scored.filter(hasScore).sort(byScore);
  return matching.slice(0, MAX_RESULTS).map(({ entry }) => ({
    entry,
    snippet: snippetOf(entry.text, words),
  }));
}

function rangesOfWord(lowered: string, word: string) {
  const ranges: Range[] = [];
  let start = lowered.indexOf(word);
  while (start !== -1) {
    const end = start + word.length;
    ranges.push({ start, end });
    start = lowered.indexOf(word, end);
  }
  return ranges;
}

function byStart(first: Range, second: Range) {
  return first.start - second.start;
}

function mergedRanges(ranges: Range[]) {
  const sorted = [...ranges].sort(byStart);
  const merged: Range[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    const overlaps = last !== undefined && range.start <= last.end;
    if (overlaps) {
      last.end = Math.max(last.end, range.end);
      continue;
    }
    merged.push({ ...range });
  }
  return merged;
}

export function markedPartsOf(text: string, words: string[]) {
  const lowered = text.toLowerCase();
  const ranges = words.flatMap((word) => rangesOfWord(lowered, word));
  const parts: MarkedPart[] = [];
  let cursor = 0;
  for (const range of mergedRanges(ranges)) {
    if (range.start > cursor) {
      const plain = text.slice(cursor, range.start);
      parts.push({ key: String(cursor), text: plain, isMatch: false });
    }
    const match = text.slice(range.start, range.end);
    parts.push({ key: String(range.start), text: match, isMatch: true });
    cursor = range.end;
  }
  if (cursor < text.length) {
    const rest = text.slice(cursor);
    parts.push({ key: String(cursor), text: rest, isMatch: false });
  }
  return parts;
}
