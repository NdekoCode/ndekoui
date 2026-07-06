import { ARTICLES, type Article, type CategoryId } from './data';

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
  article: Article;
  order: number;
  score: number;
};

/** A single letter matches half the help center, so a word counts from two letters. */
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

/** Every typed word must be found in the title or in the other words people use for it. */
function scoreOf(article: Article, words: string[]) {
  const title = article.title.toLowerCase();
  const haystack = `${title} ${article.terms}`;
  const isMatch = words.every((word) => haystack.includes(word));
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

/** Articles that hold every typed word, the ones that say it in their title first. */
export function matchesOf(query: string) {
  const words = wordsOf(query);
  if (words.length === 0) {
    return [];
  }
  const scored = ARTICLES.map((article, order) => ({
    article,
    order,
    score: scoreOf(article, words),
  }));
  const matching = scored.filter((entry) => entry.score > 0);
  matching.sort(byScoreThenOrder);
  return matching.map((entry) => entry.article);
}

export function totalIn(category: CategoryId) {
  const inCategory = ARTICLES.filter(
    (article) => article.category === category
  );
  return inCategory.length;
}

export function countIn(matches: Article[], category: CategoryId) {
  const inCategory = matches.filter((article) => article.category === category);
  return inCategory.length;
}
