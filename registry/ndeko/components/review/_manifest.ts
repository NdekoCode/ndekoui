import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'review-01',
    source: 'ndeko',
    title: 'Approval prompt',
    description:
      'Requests stacked under a waiting count, the first open with its preview, where Approve turns into a one-line trace with Undo and the next request slides up.',
  },
  {
    name: 'review-02',
    source: 'ndeko',
    title: 'Permission request',
    description:
      'An agent asks to run an exact command with its risk and a once, session or always scope, and the card resizes into what was allowed.',
  },
  {
    name: 'review-03',
    source: 'ndeko',
    title: 'Autonomy dial',
    description:
      'A detented dial for how much an agent may do alone, then each tool on its own switch that follows the default or asks to confirm.',
  },
];
