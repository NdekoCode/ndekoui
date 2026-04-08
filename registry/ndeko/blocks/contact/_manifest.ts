import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'contact-01',
    title: 'Contact form with validation',
    description:
      'Contact details beside a form that checks each field on submit and as you fix it, shows a sending state and morphs into a confirmation.',
    files: ['index.tsx', 'contact-form.tsx', 'validation.ts', 'data.ts'],
    previewHeight: 820,
  },
];
