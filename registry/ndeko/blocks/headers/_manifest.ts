import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'headers-01',
    title: 'Navbar with a sliding menu panel',
    description:
      'A marketing navbar whose menu panel resizes and slides between Product, Solutions and Resources, with an expanding menu on phones.',
    files: [
      'index.tsx',
      'desktop-nav.tsx',
      'mobile-menu.tsx',
      'brand-mark.tsx',
      'data.ts',
    ],
    previewHeight: 480,
  },
  {
    name: 'headers-02',
    title: 'Minimal floating navbar',
    description:
      'A rounded bar with four links under a highlight that follows the pointer, and a sheet that holds the links on phones.',
    files: [
      'index.tsx',
      'nav-links.tsx',
      'mobile-sheet.tsx',
      'brand-mark.tsx',
      'data.ts',
    ],
    previewHeight: 420,
  },
];
