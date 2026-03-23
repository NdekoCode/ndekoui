import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'settings-01',
    title: 'Profile form',
    description:
      'A profile in three sections with a travelling highlight, a photo picked in the browser, errors that fold in and out, and an unsaved-changes bar whose Save becomes Saving then Saved.',
    files: [
      'index.tsx',
      'profile-fields.tsx',
      'settings-kit.tsx',
      'validation.ts',
      'data.ts',
    ],
    previewHeight: 760,
  },
  {
    name: 'settings-02',
    title: 'Notifications by channel',
    description:
      'Email, push and desktop as sections, each led by its channel switch that folds its events away, with a digest choice, quiet hours and the same unsaved-changes bar.',
    files: ['index.tsx', 'channel-sections.tsx', 'settings-kit.tsx', 'data.ts'],
    previewHeight: 760,
  },
  {
    name: 'settings-03',
    title: 'Workspace settings',
    description:
      'Name and address, the default role for new members read against who holds each role, and a danger zone where archiving takes a two-second hold and deleting takes the typed name.',
    files: [
      'index.tsx',
      'danger-zone.tsx',
      'role-choice.tsx',
      'settings-kit.tsx',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
