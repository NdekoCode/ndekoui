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
