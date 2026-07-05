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

export function pathPartsOf(path: string) {
  const slash = path.lastIndexOf('/');
  if (slash < 0) {
    return { folder: '', name: path };
  }
  const nameStart = slash + 1;
  const folder = path.slice(0, nameStart);
  const name = path.slice(nameStart);
  return { folder, name };
}
