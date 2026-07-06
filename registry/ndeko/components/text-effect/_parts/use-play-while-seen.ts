'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

/**
 * A text effect plays only while someone can see it: on screen, in the tab that is shown, without
 * reduced motion. Everything that repeats hangs on `isPlaying`, and `isStill` asks for the still
 * frame, which must read as the finished text.
 */
export function usePlayWhileSeen<Element extends HTMLElement = HTMLElement>() {
  const ref = useRef<Element>(null);
  const isInView = useInView(ref);
  const isTabVisible = useDocumentVisible();
  const isStill = usePrefersReducedMotion();
  const isOnScreen = isInView && isTabVisible;
  const isPlaying = isOnScreen && !isStill;

  return { ref, isPlaying, isStill };
}
