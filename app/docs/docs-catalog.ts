import { docsExamples } from './_generated';

export function docsExampleOf(slug: string, example: string) {
  return docsExamples.find(
    (entry) => entry.slug === slug && entry.example === example
  );
}
