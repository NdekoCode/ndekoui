export function nounOf(count: number, singular: string, plural?: string) {
  if (count === 1) {
    return singular;
  }
  return plural ?? `${singular}s`;
}

export function countOf(count: number, singular: string, plural?: string) {
  const noun = nounOf(count, singular, plural);
  return `${count} ${noun}`;
}

export function wordsOf(phrase: string) {
  const trimmed = phrase.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

export function leadingSpaceOf(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

function needsSpaceBefore(text: string) {
  if (text === '') {
    return false;
  }
  const endsWithSpace = /\s$/.test(text);
  return !endsWithSpace;
}

export function appendWord(text: string, word: string) {
  if (needsSpaceBefore(text)) {
    return `${text} ${word}`;
  }
  return `${text}${word}`;
}
