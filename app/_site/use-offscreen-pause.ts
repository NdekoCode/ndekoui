'use client';

import { useInView } from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

function isScriptedLoop(animation: Animation) {
  const isCssAnimation = animation instanceof CSSAnimation;
  if (isCssAnimation) {
    return false;
  }
  const timing = animation.effect?.getComputedTiming();
  const isEndless = timing?.iterations === Infinity;
  const isRunning = animation.playState === 'running';
  return isEndless && isRunning;
}

/**
 * With an observer on the page, the browser runs a frame of main-thread work for every frame of a
 * running animation, on screen or not. So a region off screen holds its loops: the CSS ones through
 * `data-offscreen` (see globals.css), the scripted ones by pausing them here.
 */
export function useOffscreenPause<Element extends HTMLElement>(
  ref: RefObject<Element | null>
) {
  const isInView = useInView(ref, { margin: '100px 0px' });
  const held = useRef<Animation[]>([]);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    if (isInView) {
      for (const animation of held.current) {
        const isStillHeld = animation.playState === 'paused';
        if (isStillHeld) {
          animation.play();
        }
      }
      held.current = [];
      return;
    }
    const animations = element.getAnimations({ subtree: true });
    const loops = animations.filter(isScriptedLoop);
    for (const animation of loops) {
      animation.pause();
    }
    held.current = loops;
  }, [isInView, ref]);

  return isInView;
}

/** The attribute the stylesheet reads: present while the region is off screen. */
export function offscreenAttributeOf(isInView: boolean) {
  if (isInView) {
    return undefined;
  }
  return '';
}
