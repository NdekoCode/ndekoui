import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'legal-01',
    title: 'Policies with a section index',
    description:
      'Terms, privacy and cookies in one page: a rail of documents whose highlight travels, each document crossfading in place with its reading time and a short summary, and an index whose marker follows the section being read.',
    files: ['index.tsx', 'section-index.tsx', 'legal-model.ts', 'data.ts'],
    previewHeight: 900,
  },
];
