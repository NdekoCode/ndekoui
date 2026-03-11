import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'app-shells-01',
    title: 'Sidebar and inset panel',
    description:
      'A workspace sidebar on the window colour with search, quick create and an account menu, and every page in one rounded panel beside it.',
    files: [
      'index.tsx',
      'app-sidebar.tsx',
      'sidebar-parts.tsx',
      'workspace-switcher.tsx',
      'search-palette.tsx',
      'quick-create-menu.tsx',
      'account-menu.tsx',
      'top-bar.tsx',
      'page-views.tsx',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'app-shells-02',
    title: 'Icon rail sidebar',
    description:
      'The same shell with the sidebar folded into an icon rail that explains itself with tooltips and morphs back to full width.',
    files: [
      'index.tsx',
      'app-sidebar.tsx',
      'sidebar-parts.tsx',
      'workspace-switcher.tsx',
      'search-palette.tsx',
      'quick-create-menu.tsx',
      'account-menu.tsx',
      'top-bar.tsx',
      'page-views.tsx',
      'data.ts',
    ],
    previewHeight: 720,
  },
  {
    name: 'app-shells-03',
    title: 'Settings mode',
    description:
      'The sidebar switches to a settings rail with a way back to the app, beside a settings page of rows that save as you change them.',
    files: [
      'index.tsx',
      'app-sidebar.tsx',
      'sidebar-parts.tsx',
      'workspace-switcher.tsx',
      'search-palette.tsx',
      'quick-create-menu.tsx',
      'account-menu.tsx',
      'top-bar.tsx',
      'settings-kit.tsx',
      'settings-pages.tsx',
      'page-views.tsx',
      'data.ts',
    ],
    previewHeight: 760,
  },
];
