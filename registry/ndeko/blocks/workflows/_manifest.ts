import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'workflows-01',
    title: 'Workflow builder',
    description:
      'A canvas where steps are connected by hand: a wire follows the pointer out of a port and lands on the steps that can take it, the warning marks clear as it lands, and Publish refuses with a count until the last problem is fixed in the inspector.',
    files: [
      'index.tsx',
      'canvas.tsx',
      'step-card.tsx',
      'step-tile.tsx',
      'wires.tsx',
      'inspector.tsx',
      'side-panel.tsx',
      'zoom-control.tsx',
      'use-pan-zoom.ts',
      'use-width-band.ts',
      'layout.ts',
      'graph.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'workflows-02',
    title: 'Node graph editor',
    description:
      'A pipeline of typed nodes with their settings inside: a wire between two ports of different types is refused with a shake of its end and the reason, Run lights the nodes in order as their ring closes, one fails with Retry, and the next run serves what did not change from cache.',
    files: [
      'index.tsx',
      'canvas.tsx',
      'node-card.tsx',
      'wires.tsx',
      'zoom-control.tsx',
      'use-pan-zoom.ts',
      'use-is-phone.ts',
      'layout.ts',
      'pipeline.ts',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
];
