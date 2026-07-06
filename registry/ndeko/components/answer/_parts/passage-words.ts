export type PassagePiece = {
  text: string;
  isMatch: boolean;
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'for',
  'from',
  'get',
  'how',
  'in',
  'is',
  'it',
  'its',
  'much',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'was',
  'we',
  'what',
  'when',
  'will',
  'with',
  'you',
  'your',
]);

const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

const SPACE_RUN = /(\s+)/;

const MIN_WORD_LENGTH = 2;

const PLURAL_FROM_LENGTH = 4;

/** A plural matches its singular: fees finds fee. */
function stemOf(word: string) {
  const isPlural = word.endsWith('s') && word.length >= PLURAL_FROM_LENGTH;
  if (isPlural) {
    return word.slice(0, -1);
  }
  return word;
}

function normalWordOf(word: string) {
  const lower = word.toLowerCase();
  const bare = lower.replace(EDGE_PUNCTUATION, '');
  return stemOf(bare);
}

function isKeyWord(normal: string) {
  const isStopWord = STOP_WORDS.has(normal);
  const isTooShort = normal.length < MIN_WORD_LENGTH;
  return !isStopWord && !isTooShort;
}

export function keyWordsOf(question: string) {
  const keys = new Set<string>();
  for (const word of question.split(/\s+/)) {
    const normal = normalWordOf(word);
    if (isKeyWord(normal)) {
      keys.add(normal);
    }
  }
  return keys;
}

export function passagePiecesOf(passage: string, keys: Set<string>) {
  const pieces: PassagePiece[] = [];
  for (const part of passage.split(SPACE_RUN)) {
    if (part === '') {
      continue;
    }
    const isMatch = keys.has(normalWordOf(part));
    pieces.push({ text: part, isMatch });
  }
  return pieces;
}
