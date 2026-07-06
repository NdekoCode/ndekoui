export function wordsOf(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

export function countOf(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

/** "after Track the parcel" as the start of a line: "After Track the parcel". */
export function capitalized(text: string) {
  const first = text.charAt(0);
  const rest = text.slice(1);
  return `${first.toUpperCase()}${rest}`;
}
