import type { BlockManifest } from '@/registry/ndeko/blocks/types';

export const manifest: BlockManifest = [
  {
    name: 'auth-01',
    title: 'Sign in with a one-time code',
    description:
      'An email, then a six-digit code, then signed in: the card resizes between steps, the button turns into its working state and a wrong code says what to do next.',
    files: ['index.tsx', 'auth-kit.tsx', 'data.ts'],
    previewHeight: 640,
  },
  {
    name: 'auth-02',
    title: 'Sign up with live password rules',
    description:
      'Name, email and password with rules that tick as they are met, a reveal button that swaps its eye, and errors that fold away once you type again.',
    files: ['index.tsx', 'password-parts.tsx', 'auth-kit.tsx', 'data.ts'],
    previewHeight: 720,
  },
  {
    name: 'auth-03',
    title: 'Reset password',
    description:
      'Ask for a link, check your email with a resend countdown, choose a new password typed twice, then a confirmation, all in one card that resizes to each step.',
    files: ['index.tsx', 'password-parts.tsx', 'auth-kit.tsx', 'data.ts'],
    previewHeight: 680,
  },
  {
    name: 'auth-04',
    title: 'Sign in and pick a workspace',
    description:
      'Google or GitHub in one press, or an email and a six-digit code, then the workspaces with their members and a dashed row that creates one; the card resizes from step to step, and the mark of the workspace picked travels to the middle as it turns into Opening Brightmoor, then lands on a check.',
    files: [
      'index.tsx',
      'steps.tsx',
      'auth-frame.tsx',
      'session.ts',
      'data.ts',
    ],
    previewHeight: 720,
  },
];
