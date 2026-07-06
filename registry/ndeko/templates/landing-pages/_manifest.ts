import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'marketing-07',
    title: 'Shared card launch page',
    description:
      'A Tallypot launch page: group cards in a coverflow that follows the hand and keeps its momentum, a large figure that drops in with one burst of confetti, shapes that pop in as sections arrive, a live feed of who paid what in a split, perks whose meters fill with the group spend, a flap countdown to the launch and a share action.',
    files: [
      'index.tsx',
      'brand-mark.tsx',
      'countdown.tsx',
      'cover-card.tsx',
      'cover-math.ts',
      'coverflow.tsx',
      'data.ts',
      'feed-session.ts',
      'feed.tsx',
      'flap-digit.tsx',
      'goal-figure.tsx',
      'hero.tsx',
      'mobile-sheet.tsx',
      'money.ts',
      'nav-links.tsx',
      'perks-path.ts',
      'perks.tsx',
      'pop-shape.tsx',
      'reveal.tsx',
      'section-link.ts',
      'share-session.ts',
      'share.tsx',
      'site-footer.tsx',
      'site-header.tsx',
    ],
    previewHeight: 2400,
  },
];
