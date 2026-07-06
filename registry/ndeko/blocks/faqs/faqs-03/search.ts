import { QUESTIONS, TOPICS, type Question, type TopicFilter } from './data';

export type MarkedPart = {
  key: string;
  text: string;
  isMatch: boolean;
};

export type Hit = {
  question: Question;
  inQuestion: boolean;
  inAnswer: boolean;
};

type Folded = {
  text: string;
  /** For each folded character, where its source character starts and ends in the original text. */
  starts: number[];
  ends: number[];
};

type Range = {
  start: number;
  end: number;
};

type Indexed = {
  question: Question;
  questionText: string;
  answerText: string;
};

const ACCENTS = /\p{M}/gu;

/** One letter matches half the list, so a word counts from two letters. */
const MIN_WORD_LENGTH = 2;

function foldedCharOf(char: string) {
  const decomposed = char.normalize('NFD');
  const bare = decomposed.replace(ACCENTS, '');
  return bare.toLowerCase();
}

export function foldedOf(text: string): Folded {
  const starts: number[] = [];
  const ends: number[] = [];
  let folded = '';
  let position = 0;
  for (const char of text) {
    const part = foldedCharOf(char);
    const end = position + char.length;
    for (let index = 0; index < part.length; index += 1) {
      starts.push(position);
      ends.push(end);
    }
    folded += part;
    position = end;
  }
  return { text: folded, starts, ends };
}

export function wordsOf(query: string) {
  const folded = foldedOf(query).text;
  const pieces = folded.split(/\s+/);
  return pieces.filter((piece) => piece.length >= MIN_WORD_LENGTH);
}

const INDEX: Indexed[] = QUESTIONS.map((question) => ({
  question,
  questionText: foldedOf(question.question).text,
  answerText: foldedOf(question.answer).text,
}));

function holdsWord(entry: Indexed, word: string) {
  const inQuestion = entry.questionText.includes(word);
  const inAnswer = entry.answerText.includes(word);
  return inQuestion || inAnswer;
}

function hitOf(entry: Indexed, words: string[]): Hit | null {
  const holdsEveryWord = words.every((word) => holdsWord(entry, word));
  if (!holdsEveryWord) {
    return null;
  }
  const inQuestion = words.some((word) => entry.questionText.includes(word));
  const inAnswer = words.some((word) => entry.answerText.includes(word));
  return { question: entry.question, inQuestion, inAnswer };
}

export function hitsOf(query: string): Hit[] {
  const words = wordsOf(query);
  const hits: Hit[] = [];
  for (const entry of INDEX) {
    const hit = hitOf(entry, words);
    if (hit) {
      hits.push(hit);
    }
  }
  return hits;
}

export function inTopic(hits: Hit[], topic: TopicFilter) {
  if (topic === 'all') {
    return hits;
  }
  return hits.filter((hit) => hit.question.topic === topic);
}

export function topicCountsOf(hits: Hit[]) {
  const counts: Record<string, number> = {};
  for (const topic of TOPICS) {
    counts[topic.id] = inTopic(hits, topic.id).length;
  }
  return counts;
}

function rangesOfWord(folded: Folded, word: string) {
  const ranges: Range[] = [];
  let from = folded.text.indexOf(word);
  while (from !== -1) {
    const last = from + word.length - 1;
    ranges.push({ start: folded.starts[from], end: folded.ends[last] });
    from = folded.text.indexOf(word, from + word.length);
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
    const previous = merged.at(-1);
    const overlaps = previous !== undefined && range.start <= previous.end;
    if (overlaps) {
      previous.end = Math.max(previous.end, range.end);
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
