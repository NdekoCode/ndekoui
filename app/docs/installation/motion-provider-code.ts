/** The wrapper the installation page shows. It lives here because the docs build reads every import written in a page, code samples included. */
export const MOTION_PROVIDER_CODE = `'use client';

import { MotionConfig } from 'motion/react';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion='user'>{children}</MotionConfig>;
}`;
