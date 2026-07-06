import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'marketing-04',
    title: 'Changelog page',
    description:
      'A Loomboard changelog: the navbar with Changelog marked, dated releases with their kind of change and a Load more that adds the next ones, and a footer with a newsletter field.',
    files: [
      'index.tsx',
      'site-header.tsx',
      'desktop-nav.tsx',
      'mobile-menu.tsx',
      'brand-mark.tsx',
      'changelog.tsx',
      'release-entry.tsx',
      'site-footer.tsx',
      'newsletter-form.tsx',
      'data.ts',
    ],
    previewHeight: 1700,
  },
];
