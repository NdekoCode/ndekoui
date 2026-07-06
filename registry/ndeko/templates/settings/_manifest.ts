import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'application-03',
    title: 'Settings',
    description:
      'Lattice Studio settings: a settings rail with a way back to the app, a profile, notifications by channel and the workspace page, each saving through one unsaved-changes bar, with saved names showing in the sidebar at once.',
    files: [
      'index.tsx',
      'app-sidebar.tsx',
      'sidebar-parts.tsx',
      'workspace-switcher.tsx',
      'search-palette.tsx',
      'account-menu.tsx',
      'top-bar.tsx',
      'profile-page.tsx',
      'profile-fields.tsx',
      'validation.ts',
      'notifications-page.tsx',
      'channel-sections.tsx',
      'workspace-page.tsx',
      'role-choice.tsx',
      'danger-zone.tsx',
      'settings-kit.tsx',
      'data.ts',
    ],
    previewHeight: 880,
  },
];
