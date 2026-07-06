import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'docs-01',
    title: 'Docs page',
    description:
      'A docs page in its own frame with a sidebar you can search, sections with their counts, a Copy page split button, installation by command or by hand, callouts, previous and next and an On this page rail that follows the reading; the sidebar becomes a sheet on phones. Pick a package manager and only the words that run the command roll to the new ones.',
    files: [
      'index.tsx',
      'docs-nav.tsx',
      'install.tsx',
      'copy-page.tsx',
      'on-this-page.tsx',
      'page-text.ts',
      'match.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
