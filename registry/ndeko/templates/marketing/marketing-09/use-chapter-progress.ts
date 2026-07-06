'use client';

import { useMotionValue, useMotionValueEvent, useScroll } from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

const PLAY_MS = 9500;

const TICK_MS = 90;

const IDLE_MS = 700;

const BACK_STEP = 0.04;

type ChapterProgressOptions = {
  isStill: boolean;
  isPlaying: boolean;
};

/**
 * The progress of a pinned chapter, from 0 to 1. It follows the scroll while the reader scrolls, and
 * once they stop for a moment it carries on by itself to the end of the chapter. Scrolling forward
 * past it takes over again, and scrolling back moves it back.
 */
export function useChapterProgress(
  wrapperRef: RefObject<HTMLElement | null>,
  { isStill, isPlaying }: ChapterProgressOptions
) {
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  });
  const progress = useMotionValue(0);
  const floor = useRef(0);
  const peak = useRef(0);
  const lastScrollAt = useRef(0);

  useMotionValueEvent(scrollYProgress, 'change', (scrolled) => {
    lastScrollAt.current = performance.now();
    const isBack = scrolled < peak.current - BACK_STEP;
    peak.current = Math.max(peak.current, scrolled);
    if (isBack) {
      peak.current = scrolled;
      floor.current = scrolled;
    }
    progress.set(Math.max(scrolled, floor.current));
  });

  useEffect(() => {
    if (isStill) {
      progress.set(1);
      return;
    }
    const frame = requestAnimationFrame(() => {
      progress.set(Math.max(scrollYProgress.get(), floor.current));
    });
    return () => cancelAnimationFrame(frame);
  }, [isStill, progress, scrollYProgress]);

  useEffect(() => {
    if (!isPlaying || isStill) {
      return;
    }
    const timer = setInterval(() => {
      const idleFor = performance.now() - lastScrollAt.current;
      const scrolled = scrollYProgress.get();
      const isIdle = idleFor > IDLE_MS;
      const isPinned = scrolled > 0 && scrolled < 1;
      if (!isIdle || !isPinned) {
        return;
      }
      const current = Math.max(progress.get(), scrolled);
      if (current >= 1) {
        return;
      }
      const next = Math.min(1, current + TICK_MS / PLAY_MS);
      floor.current = next;
      progress.set(next);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isStill, progress, scrollYProgress]);

  return progress;
}
