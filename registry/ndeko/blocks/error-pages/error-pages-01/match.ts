import type { SitePage } from './data';

export type MarkedPart = {
  key: string;
  text: string;
  isMatch: boolean;
};

type Range = {
  start: number;
  end: number;
};

type Scored = {
  page: SitePage;
  order: number;
  score: number;
};

/** A single letter matches half the site, so a word counts from two letters. */
const MIN_WORD_LENGTH = 2;

export function wordsOf(query: string) {
  const lowered = query.toLowerCase();
  const pieces = lowered.split(/\s+/);
  return pieces.filter((piece) => piece.length >= MIN_WORD_LENGTH);
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

function rangesOf(text: string, words: string[]) {
  const lowered = text.toLowerCase();
  const ranges = words.flatMap((word) => rangesOfWord(lowered, word));
  return mergedRanges(ranges);
}

export function markedPartsOf(text: string, words: string[]) {
  const parts: MarkedPart[] = [];
  let cursor = 0;
  for (const range of rangesOf(text, words)) {
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

function scoreOf(page: SitePage, words: string[]) {
  const lowered = page.title.toLowerCase();
  const found = words.filter((word) => lowered.includes(word));
  return found.length;
}

function byScoreThenOrder(first: Scored, second: Scored) {
  const scoreGap = second.score - first.score;
  if (scoreGap !== 0) {
    return scoreGap;
  }
  return first.order - second.order;
}

/** Pages whose title holds the most typed words come first; ties keep the order of the site. */
export function suggestionsOf(
  pages: readonly SitePage[],
  query: string,
  limit: number
) {
  const words = wordsOf(query);
  if (words.length === 0) {
    return [];
  }
  const scored = pages.map((page, order) => ({
    page,
    order,
    score: scoreOf(page, words),
  }));
  const matching = scored.filter((entry) => entry.score > 0);
  matching.sort(byScoreThenOrder);
  const best = matching.slice(0, limit);
  return best.map((entry) => entry.page);
}
