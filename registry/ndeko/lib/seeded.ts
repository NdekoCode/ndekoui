const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

/**
 * A number drawn from a text, the same on the server and in the browser, so a picture generated
 * from a name never changes between two renders.
 */
export function hashOf(text: string) {
  let hash = FNV_OFFSET;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    hash ^= code;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** One entry of a list, chosen by the bits of a hash from `shift` upwards. */
export function pickedFrom<Item>(
  items: readonly Item[],
  hash: number,
  shift = 0
) {
  const bits = hash >>> shift;
  const index = bits % items.length;
  return items[index];
}
