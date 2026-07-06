import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'marketing-06',
    title: 'Docs site',
    description:
      'A Wickerline docs site in one component: a home with one search across every page and three category cards, then pages with the sidebar, a page header, install steps whose package manager rolls the command, callouts, a table of events, an On this page rail and previous and next links. A small router keeps the state, and a search for install opens the page while bun rolls into the command.',
    files: [
      'index.tsx',
      'callout.tsx',
      'code-block.tsx',
      'data.ts',
      'doc-blocks.tsx',
      'doc-page.tsx',
      'docs-header.tsx',
      'docs-nav.tsx',
      'home-page.tsx',
      'inline-text.tsx',
      'install.tsx',
      'on-this-page.tsx',
      'page-footer.tsx',
      'pages.ts',
      'search-field.tsx',
      'search-results.tsx',
      'search.ts',
      'session.ts',
    ],
    previewHeight: 760,
  },
];
