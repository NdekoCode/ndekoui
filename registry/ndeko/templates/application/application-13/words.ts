export function wordsOf(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

export function countOf(count: number, singular: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${singular}s`;
}
