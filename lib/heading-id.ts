/** The anchor of a heading: the same one the docs pages give it, so a link can land on it. */
export function headingIdOf(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}
