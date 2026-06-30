import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'automations-01',
    title: 'Rule builder',
    description:
      'An event, conditions and actions on one rail: rows open and close in place, the rule reads back as a sentence as you edit, mistakes fold in under their row and Save becomes Saving then Saved.',
    files: [
      'index.tsx',
      'rule-parts.tsx',
      'rule-model.ts',
      'save-button.tsx',
      'motion-parts.tsx',
      'data.ts',
    ],
    previewHeight: 860,
  },
];
