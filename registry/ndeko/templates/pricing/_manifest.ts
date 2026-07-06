import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'marketing-03',
    title: 'Per-seat pricing page',
    description:
      'A Tallyfold pricing page: one plan whose seat count and monthly total roll to their new value when changed, a grouped table of what it includes, questions on one card and a compact footer.',
    files: [
      'index.tsx',
      'site-header.tsx',
      'nav-links.tsx',
      'mobile-sheet.tsx',
      'section-link.ts',
      'brand-mark.tsx',
      'pricing.tsx',
      'feature-table.tsx',
      'faq.tsx',
      'site-footer.tsx',
      'data.ts',
    ],
    previewHeight: 1800,
  },
];
