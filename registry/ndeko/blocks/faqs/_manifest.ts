import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'faqs-01',
    title: 'Grouped questions beside the title',
    description:
      'The title, topic links and a support action on the left, questions grouped by topic on the right, each answer opening with the panel height transition.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 860,
  },
  {
    name: 'faqs-02',
    title: 'Centered questions with a contact line',
    description:
      'A centred heading, the questions on one card and a line that names who answers the rest.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'faqs-03',
    title: 'Searchable questions',
    description:
      'A search that ignores accents and marks its matches in place as you type, topic chips whose counts roll with the words, answers that open where they are with a link to copy, and a person to ask when nothing matches.',
    files: [
      'index.tsx',
      'ask-person.tsx',
      'collapse.tsx',
      'hash.ts',
      'marked-text.tsx',
      'question-row.tsx',
      'search-field.tsx',
      'search.ts',
      'session.ts',
      'topic-chips.tsx',
      'data.ts',
    ],
    previewHeight: 940,
  },
];
