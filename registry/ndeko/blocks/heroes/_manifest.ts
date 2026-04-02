import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'heroes-01',
    title: 'Split hero',
    description:
      'The title on the left, a short paragraph and two actions on the right, under an announcement link.',
    files: ['index.tsx', 'data.ts'],
    previewHeight: 520,
  },
  {
    name: 'heroes-02',
    title: 'Centered hero with a live board',
    description:
      'A centred title above a planning board drawn from primitives, where one card keeps travelling across the lanes and a rule reacts when it lands in Done.',
    files: ['index.tsx', 'board-stage.tsx', 'data.ts'],
    previewHeight: 920,
  },
  {
    name: 'heroes-03',
    title: 'Hero with an email capture',
    description:
      'A waitlist field that checks the address, shows its submitting state and morphs into a confirmation.',
    files: ['index.tsx', 'waitlist-form.tsx', 'issue-preview.tsx', 'data.ts'],
    previewHeight: 600,
  },
];
