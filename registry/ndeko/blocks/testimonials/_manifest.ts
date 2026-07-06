import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'testimonials-01',
    title: 'Quote wall',
    description:
      'Sample customer quotes on a masonry wall with one phrase of each in the brand ink: pick a theme and a marker sweeps under the phrases that say it while the other quotes step back to muted text.',
    files: ['index.tsx', 'theme-picker.tsx', 'quote-card.tsx', 'data.ts'],
    previewHeight: 1000,
  },
  {
    name: 'testimonials-02',
    title: 'Quote carousel',
    description:
      'One sample quote at a time: the bar under the current quote fills while it waits and the next one slides in from the side it comes from, held under the pointer, by keyboard focus and off screen, with Pause, arrows and keyed dots.',
    files: [
      'index.tsx',
      'carousel-controls.tsx',
      'quote-slide.tsx',
      'use-slide-clock.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'testimonials-03',
    title: 'One large quote',
    description:
      'One sample quote set large on the featured card, with the person, their role and their company: the phrase it praises is a button whose chevron turns as the feature it speaks of unfolds under the quote.',
    files: ['index.tsx', 'feature-note.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'testimonials-04',
    title: 'Quote stage',
    description:
      'A large drawn portrait beside one big sample quote, switched with tabs, arrows and the progress row under the tabs: the row fills up to the person picked while their portrait and quote crossfade in, and an optional autoplay waits under the pointer and off screen.',
    files: [
      'index.tsx',
      'portrait-stack.tsx',
      'person-tabs.tsx',
      'story-quote.tsx',
      'data.ts',
    ],
    previewHeight: 880,
  },
  {
    name: 'testimonials-05',
    title: 'Quotes with results',
    description:
      'One customer at a time on the featured card over a wall of short sample quotes with their result chips: pick a quote, or let the block turn every few seconds, and the quote writes itself in word by word while the illustrative figure beside it rolls to that customer’s result.',
    files: ['index.tsx', 'featured-result.tsx', 'wall-card.tsx', 'data.ts'],
    previewHeight: 980,
  },
];
