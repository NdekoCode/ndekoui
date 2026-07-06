import type { NavItem } from './data';

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

/** The pages of a section whose title holds every typed word, or all of them without a search. */
export function itemsMatching(items: NavItem[], words: string[]) {
  if (words.length === 0) {
    return items;
  }
  return items.filter((item) => {
    const title = item.title.toLowerCase();
    return words.every((word) => title.includes(word));
  });
}
