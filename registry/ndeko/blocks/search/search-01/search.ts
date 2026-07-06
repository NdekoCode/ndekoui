import { PAGES, type IndexedPage, type PageType } from './data';

export type TypeFilter = PageType | 'all';

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
  page: IndexedPage;
  order: number;
  score: number;
};

/** A single letter matches nearly every page, so a word counts from two letters. */
const MIN_WORD_LENGTH = 2;

/** Corrections stay close to what was typed: at most two letters off. */
const MAX_DISTANCE = 2;

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

/** Every word must be on the page; the words in its title count twice. */
function scoreOf(page: IndexedPage, words: string[]) {
  const title = page.title.toLowerCase();
  const text = `${title} ${page.excerpt.toLowerCase()}`;
  const isMatch = words.every((word) => text.includes(word));
  if (!isMatch) {
    return 0;
  }
  const inTitle = words.filter((word) => title.includes(word));
  return 1 + inTitle.length;
}

function byScoreThenOrder(first: Scored, second: Scored) {
  const scoreGap = second.score - first.score;
  if (scoreGap !== 0) {
    return scoreGap;
  }
  return first.order - second.order;
}

export function matchesOf(query: string) {
  const words = wordsOf(query);
  if (words.length === 0) {
    return [];
  }
  const scored = PAGES.map((page, order) => ({
    page,
    order,
    score: scoreOf(page, words),
  }));
  const matching = scored.filter((entry) => entry.score > 0);
  matching.sort(byScoreThenOrder);
  return matching.map((entry) => entry.page);
}

export function ofType(matches: IndexedPage[], type: TypeFilter) {
  if (type === 'all') {
    return matches;
  }
  return matches.filter((page) => page.type === type);
}

export function countOfType(matches: IndexedPage[], type: TypeFilter) {
  return ofType(matches, type).length;
}

function vocabularyOf(pages: IndexedPage[]) {
  const words = new Set<string>();
  for (const page of pages) {
    const text = `${page.title} ${page.excerpt}`.toLowerCase();
    for (const word of text.split(/[^a-z]+/)) {
      if (word.length >= 4) {
        words.add(word);
      }
    }
  }
  return [...words];
}

const VOCABULARY = vocabularyOf(PAGES);

/** How many letters to add, remove or change to turn one word into the other. */
function distanceBetween(first: string, second: string) {
  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= second.length; column += 1) {
      const isSame = first[row - 1] === second[column - 1];
      let cost = 1;
      if (isSame) {
        cost = 0;
      }
      const removal = previous[column] + 1;
      const insertion = current[column - 1] + 1;
      const change = previous[column - 1] + cost;
      current.push(Math.min(removal, insertion, change));
    }
    previous = current;
  }
  return previous[second.length];
}

function closestWordOf(word: string) {
  let best = word;
  let bestDistance = MAX_DISTANCE + 1;
  for (const candidate of VOCABULARY) {
    const distance = distanceBetween(word, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export function correctionOf(query: string) {
  const words = wordsOf(query);
  if (words.length === 0) {
    return null;
  }
  const corrected = words.map(closestWordOf);
  const correction = corrected.join(' ');
  const original = words.join(' ');
  if (correction === original) {
    return null;
  }
  return correction;
}
