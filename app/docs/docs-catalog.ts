import { docsExamples } from './_generated';

/** Every docs example that has a full page, built ahead with its share card. */
export function docsViewParamsOf() {
  return docsExamples.map((entry) => ({
    slug: entry.slug,
    example: entry.example,
  }));
}

export function docsExampleOf(slug: string, example: string) {
  return docsExamples.find(
    (entry) => entry.slug === slug && entry.example === example
  );
}
