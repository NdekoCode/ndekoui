'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

const IN_VIEW_SHARE = 0.2;

/**
 * A voice indicator moves only while someone can see it: on screen, in the tab that is shown,
 * without reduced motion. `isStill` asks for the still frame instead, and `isOnScreen` is for the
 * clocks that keep a session going under reduced motion.
 */
export function usePlayWhileSeen<Element extends HTMLElement = HTMLElement>() {
  const ref = useRef<Element>(null);
  const isInView = useInView(ref, { amount: IN_VIEW_SHARE });
  const isTabVisible = useDocumentVisible();
  const isStill = usePrefersReducedMotion();
  const isOnScreen = isInView && isTabVisible;
  const isPlaying = isOnScreen && !isStill;

  return { ref, isOnScreen, isPlaying, isStill };
}
