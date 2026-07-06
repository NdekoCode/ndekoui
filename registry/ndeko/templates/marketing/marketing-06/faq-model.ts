import { QUESTIONS, TOPICS, type Question, type TopicId } from './faq-data';

export type TopicFilter = 'all' | TopicId;

export type MarkedPart = {
  key: string;
  text: string;
  isMatch: boolean;
};

type Range = {
  start: number;
  end: number;
};

/** A single letter matches nearly every question, so a word counts from two letters. */
const MIN_WORD_LENGTH = 2;

function foldedUnitOf(unit: string) {
  const stripped = unit.normalize('NFD').replace(/\p{M}/gu, '');
  const lowered = stripped.toLowerCase();
  if (lowered.length === 1) {
    return lowered;
  }
  return unit.toLowerCase().charAt(0);
}

/** Lower case and without accents, one letter for each letter, so a position in the folded text is a position in the original. */
export function foldedOf(text: string) {
  const units = text.split('');
  return units.map(foldedUnitOf).join('');
}

export function wordsOf(query: string) {
  const folded = foldedOf(query);
  const pieces = folded.split(/\s+/);
  return pieces.filter((piece) => piece.length >= MIN_WORD_LENGTH);
}

function holdsEveryWord(question: Question, words: string[]) {
  const text = foldedOf(`${question.question} ${question.answer}`);
  return words.every((word) => text.includes(word));
}

function isOfTopic(question: Question, topic: TopicFilter) {
  if (topic === 'all') {
    return true;
  }
  return question.topic === topic;
}

export function questionsOf(words: string[], topic: TopicFilter) {
  return QUESTIONS.filter((question) => {
    const isInTopic = isOfTopic(question, topic);
    const isFound = holdsEveryWord(question, words);
    return isInTopic && isFound;
  });
}

export type TopicCount = {
  id: TopicFilter;
  label: string;
  count: number;
};

export function topicCountsOf(words: string[]): TopicCount[] {
  const all: TopicCount = {
    id: 'all',
    label: 'All',
    count: questionsOf(words, 'all').length,
  };
  const topics = TOPICS.map((topic) => ({
    id: topic.id,
    label: topic.label,
    count: questionsOf(words, topic.id).length,
  }));
  return [all, ...topics];
}

function rangesOfWord(folded: string, word: string) {
  const ranges: Range[] = [];
  let start = folded.indexOf(word);
  while (start !== -1) {
    const end = start + word.length;
    ranges.push({ start, end });
    start = folded.indexOf(word, end);
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
  const folded = foldedOf(text);
  const ranges = words.flatMap((word) => rangesOfWord(folded, word));
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

export function anchorOf(questionId: string) {
  return `faq-${questionId}`;
}

const ANCHOR_PREFIX = 'faq-';

export function questionIdOfHash(hash: string) {
  const name = hash.replace(/^#/, '');
  if (!name.startsWith(ANCHOR_PREFIX)) {
    return null;
  }
  const id = name.slice(ANCHOR_PREFIX.length);
  const isKnown = QUESTIONS.some((question) => question.id === id);
  if (!isKnown) {
    return null;
  }
  return id;
}
