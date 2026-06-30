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
  {
    name: 'footers-03',
    title: 'Footer with a wordmark',
    description:
      'Three lists of links beside the brand and a contact address, a back to top button whose arrow travels on hover, and the product name set across the full width at the bottom.',
    files: ['index.tsx', 'back-to-top.tsx', 'brand-mark.tsx', 'data.ts'],
    previewHeight: 600,
  },
  {
    name: 'footers-04',
    title: 'Footer with a folding sitemap',
    description:
      'Five link columns that fold into an accordion on phones, a support address with a copy button that confirms with a check, and a language select.',
    files: [
      'index.tsx',
      'sitemap.tsx',
      'copy-email.tsx',
      'language-select.tsx',
      'brand-mark.tsx',
      'data.ts',
    ],
    previewHeight: 480,
  },
  {
    name: 'footers-05',
    title: 'Footer with a closing call to action',
    description:
      'A last headline with a primary action whose arrow travels on hover, then the brand, one row of links and a link to the status page.',
    files: ['index.tsx', 'brand-mark.tsx', 'data.ts'],
    previewHeight: 360,
  },
];
