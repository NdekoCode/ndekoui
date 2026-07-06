import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'page-headers-01',
    title: 'Page header that condenses',
    description:
      'A project header with breadcrumbs, a status, people, progress and tabs whose indicator travels, where Watch, Share and Edit fold into More as the width shrinks: scroll the page under it and the header condenses into a slim bar that keeps the title, the status, Edit and the progress as its lower edge.',
    files: [
      'index.tsx',
      'condensed-bar.tsx',
      'header-actions.tsx',
      'title-editor.tsx',
      'panels.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
];
