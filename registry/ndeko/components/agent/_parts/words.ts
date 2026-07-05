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
