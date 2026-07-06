import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'legal-01',
    title: 'Policies with a section index',
    description:
      'Terms, privacy and cookies in one page: a rail of documents whose highlight travels, each document crossfading in place with its reading time and a short summary, and an index whose marker follows the section being read.',
    files: ['index.tsx', 'section-index.tsx', 'legal-model.ts', 'data.ts'],
    previewHeight: 900,
  },
  {
    name: 'legal-02',
    title: 'Cookie choices',
    description:
      'A consent banner that never covers the page, where Reject all weighs as much as Accept all and Customize opens a dialog of switches with Necessary locked on and its reason; a saved choice calls back, and the banner fades out leaving a small Cookie settings link behind to reopen it.',
    files: [
      'index.tsx',
      'consent-banner.tsx',
      'preferences-dialog.tsx',
      'site-page.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 640,
  },
];
