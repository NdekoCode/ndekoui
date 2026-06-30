import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'billing-01',
    title: 'Usage with a spending cap',
    description:
      'Plan meters that turn amber near their limit, on-demand spending against a cap whose marker follows the slider, a card that grows into its editor, and a next invoice that rolls to its new total once the cap is saved.',
    files: [
      'index.tsx',
      'spend-cap.tsx',
      'usage-meters.tsx',
      'billing-model.ts',
      'save-button.tsx',
      'data.ts',
    ],
    previewHeight: 900,
  },
];
