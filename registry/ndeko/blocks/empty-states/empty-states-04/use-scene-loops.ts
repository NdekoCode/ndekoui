'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type SceneLoop = {
  selector: string;
  keyframes: Keyframe[];
  duration: number;
  /** Each part after the first starts this much later, so the loop travels across them. */
  stagger?: number;
};

/**
 * Calm loops on opacity and transform only, as Web Animations made once and paused whenever the
 * scene is not on screen. Under reduced motion none is made, so the scene stays as drawn.
 */
export function useSceneLoops(
  rootRef: RefObject<HTMLElement | null>,
  loops: readonly SceneLoop[],
  isPlaying: boolean
) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const animations = useRef<Animation[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || shouldReduceMotion) {
      return;
    }
    const created: Animation[] = [];
    for (const loop of loops) {
      const parts = root.querySelectorAll<HTMLElement>(loop.selector);
      const stagger = loop.stagger ?? 0;
      parts.forEach((part, index) => {
        const animation = part.animate(loop.keyframes, {
          duration: loop.duration,
          delay: index * stagger,
          iterations: Infinity,
          easing: 'ease-in-out',
        });
        animation.pause();
        created.push(animation);
      });
    }
    animations.current = created;
    return () => {
      created.forEach((animation) => animation.cancel());
      animations.current = [];
    };
  }, [rootRef, loops, shouldReduceMotion]);

  useEffect(() => {
    for (const animation of animations.current) {
      if (isPlaying) {
        animation.play();
      } else {
        animation.pause();
      }
    }
  }, [isPlaying, loops, shouldReduceMotion]);
}
