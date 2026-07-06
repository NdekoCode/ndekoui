/** A slug read as a sentence: `apple-style-dock` becomes `Apple style dock`. */
export function sentenceOfSlug(slug: string) {
  const sentence = slug.split('-').join(' ');
  const first = sentence.charAt(0).toUpperCase();
  return `${first}${sentence.slice(1)}`;
}
