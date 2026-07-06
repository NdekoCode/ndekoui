import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'blog-01',
    title: 'Blog index',
    description:
      'A blog index with the latest post on a washed card, topic chips with their counts, a search that can come up empty with the way back, and Load more: pick a topic and the thumb travels to it while the cards that stay glide to their new places and the others fade.',
    files: ['index.tsx', 'post-card.tsx', 'cover.tsx', 'session.ts', 'data.ts'],
    previewHeight: 1100,
  },
  {
    name: 'blog-02',
    title: 'Blog post',
    description:
      'A post in its own scrolling frame with Copy link, a Share menu, a quote, previous and next and related posts, and a table of contents that folds into one bar on phones: as you read, a thin line fills along the top and the marker of the contents travels to the heading you reached.',
    files: [
      'index.tsx',
      'article-body.tsx',
      'contents.tsx',
      'post-actions.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
