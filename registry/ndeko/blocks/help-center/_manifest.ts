import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'help-center-01',
    title: 'Help center',
    description:
      'A help center with a search hero, topics, popular articles and a person to write to: as you type, suggestions land under the field with your words marked, and the count on every topic rolls down to the articles that match while the topics with none step back.',
    files: [
      'index.tsx',
      'help-search.tsx',
      'session.ts',
      'match.ts',
      'data.ts',
    ],
    previewHeight: 1040,
  },
  {
    name: 'help-center-02',
    title: 'Help article',
    description:
      'A help article with breadcrumbs, numbered steps, a note, related articles and a person to write to: answer Was this helpful and the question turns into a thank-you in the same place, after a short field for what was missing when the answer is No.',
    files: ['index.tsx', 'feedback-card.tsx', 'session.ts', 'data.ts'],
    previewHeight: 1180,
  },
];
