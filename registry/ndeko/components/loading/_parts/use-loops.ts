'use client';

import { useInView } from 'motion/react';
import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import {
  cancelAll,
  landAll,
  pauseAll,
  playAll,
  startLoops,
  type Loop,
} from './loops';

/**
 * Whether an indicator may loop and whether it plays right now. It loops while it runs and the
 * reduced motion setting is off; it plays only while it is on screen in the tab that is shown.
 */
export function useLoopGate<Root extends HTMLElement = HTMLSpanElement>(
  isRunning: boolean
) {
  const ref = useRef<Root>(null);
  const isInView = useInView(ref);
  const isTabVisible = useDocumentVisible();
  const isStill = usePrefersReducedMotion();
  const canLoop = isRunning && !isStill;
  const isOnScreen = isInView && isTabVisible;
  const isPlaying = canLoop && isOnScreen;

  return { ref, canLoop, isPlaying, isStill };
}

type LoopsOptions<Root> = {
  canLoop: boolean;
  isPlaying: boolean;
  create: (root: Root) => Loop[];
};

/**
 * The loops of a mark, made when it starts running and paused whenever it is not seen, so they ask
 * for no frame off screen or in a hidden tab. When it stops running each element glides back to
 * its resting style and the loops are gone, so a finished mark costs nothing.
 */
export function useLoops<Root extends HTMLElement>(
  rootRef: RefObject<Root | null>,
  { canLoop, isPlaying, create }: LoopsOptions<Root>
) {
  const running = useRef<Animation[] | null>(null);
  const isStill = usePrefersReducedMotion();

  const loopsOf = useEffectEvent((root: Root) => {
    const loops = create(root);
    return startLoops(loops);
  });

  /** Stopped by the reduced motion setting, a mark goes straight to rest instead of gliding there. */
  const finish = useEffectEvent((animations: Animation[], root: Root) => {
    const canGlide = root.isConnected && !isStill;
    if (canGlide) {
      landAll(animations);
      return;
    }
    cancelAll(animations);
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canLoop) {
      return;
    }
    const animations = loopsOf(root);
    pauseAll(animations);
    running.current = animations;
    return () => {
      running.current = null;
      finish(animations, root);
    };
  }, [rootRef, canLoop]);

  useEffect(() => {
    const animations = running.current;
    if (!animations || !isPlaying) {
      return;
    }
    playAll(animations);
    return () => pauseAll(animations);
  }, [canLoop, isPlaying]);
}
