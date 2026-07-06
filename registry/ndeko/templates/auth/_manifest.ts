import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'application-04',
    title: 'Sign in',
    description:
      'A focused Loomboard page: sign in with a one-time code, with links to create an account and to reset a password, all in one card that resizes from one flow to the next.',
    files: [
      'index.tsx',
      'auth-kit.tsx',
      'brand-mark.tsx',
      'sign-in-flow.tsx',
      'sign-up-flow.tsx',
      'reset-flow.tsx',
      'password-parts.tsx',
      'email-check.ts',
      'data.ts',
    ],
    previewHeight: 820,
  },
];
