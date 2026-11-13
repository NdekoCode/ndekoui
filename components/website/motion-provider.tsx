'use client';

import { MotionConfig } from 'motion/react';

/**
 * The motion library does not read the CSS reduced-motion rule. With `user`, every motion animation
 * on the site drops movement and keeps fades when the system asks for reduced motion, including
 * the ones that do not read the preference themselves. It is applied after mount, so the server
 * and the browser render the same page.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion='user'>{children}</MotionConfig>;
}
