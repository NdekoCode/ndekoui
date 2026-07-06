import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'marketing-05',
    title: 'Contact page',
    description:
      'A Driftdesk contact page: contact details beside a form that checks each field, shows a sending state and morphs into a confirmation, grouped questions and a compact footer.',
    files: [
      'index.tsx',
      'site-header.tsx',
      'nav-links.tsx',
      'mobile-sheet.tsx',
      'section-link.ts',
      'brand-mark.tsx',
      'contact.tsx',
      'contact-form.tsx',
      'validation.ts',
      'faq.tsx',
      'site-footer.tsx',
      'data.ts',
    ],
    previewHeight: 1900,
  },
];
