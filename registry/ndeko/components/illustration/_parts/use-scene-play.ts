'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

const IN_VIEW_SHARE = 0.3;

export type ScenePlay = {
  /** True while a visitor can see the scene move: on screen, in a visible tab, without reduced motion. */
  isPlaying: boolean;
  /** True under reduced motion: the scene rests on its still frame. */
  isStill: boolean;
};

/**
 * An illustration moves only while someone can see it. Everything that loops in a scene hangs on
 * `isPlaying`, so nothing runs off screen, in a hidden tab or under reduced motion.
 */
export function useScenePlay<Element extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<Element>(null);
  const isInView = useInView(ref, { amount: IN_VIEW_SHARE });
  const isTabVisible = useDocumentVisible();
  const isStill = usePrefersReducedMotion();
  const isOnScreen = isInView && isTabVisible;
  const isPlaying = isOnScreen && !isStill;

  return { ref, isPlaying, isStill };
}
