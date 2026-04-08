import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'footers-01',
    title: 'Footer with categories and a newsletter',
    description:
      'Four lists of links beside the brand and a newsletter field that checks the address, shows its submitting state and morphs into a confirmation.',
    files: ['index.tsx', 'newsletter-form.tsx', 'brand-mark.tsx', 'data.ts'],
    previewHeight: 540,
  },
  {
    name: 'footers-02',
    title: 'Compact footer',
    description:
      'The mark and the copyright, one row of links and the social links, centred and stacked on phones.',
    files: ['index.tsx', 'brand-mark.tsx', 'data.ts'],
    previewHeight: 260,
  },
];
