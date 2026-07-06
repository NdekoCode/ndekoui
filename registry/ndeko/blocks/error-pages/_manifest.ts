import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'error-pages-01',
    title: 'Page not found',
    description:
      'A calm 404 with a search that suggests pages as you type, the typed words marked, popular pages and Go home: on the folded map above, the trail that stops at the fold draws itself on to a pin as soon as a page matches.',
    files: [
      'index.tsx',
      'page-search.tsx',
      'trail-map.tsx',
      'session.ts',
      'match.ts',
      'data.ts',
    ],
    previewHeight: 840,
  },
  {
    name: 'error-pages-02',
    title: 'Server error',
    description:
      'A 500 with Try again, the status of the service and an error ID that copies with a check: Try again morphs into Retrying while the lights of the failing server run, falls back with a nudge the first time and turns them green on the second.',
    files: ['index.tsx', 'server-stack.tsx', 'session.ts', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'error-pages-03',
    title: 'Maintenance',
    description:
      'A maintenance page with what is affected and a form that checks the address, saves it and folds into a confirmation with a drawn check: the time left counts down in large figures whose minutes roll down as each one passes, over a line that fills toward the end of the window.',
    files: [
      'index.tsx',
      'maintenance-clock.tsx',
      'notify-form.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 980,
  },
];
