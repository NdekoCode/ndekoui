'use client';

import { useEffect, useState } from 'react';

const SHOWN_WORD =
  'relative opacity-100 transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0';

/** Counts up to `total` while it runs. The count starts again when the component mounts for a new round. */
export function useRevealedCount(
  total: number,
  isRunning: boolean,
  stepMs: number
) {
  const [count, setCount] = useState(0);
  const isTicking = isRunning && count < total;

  useEffect(() => {
    if (!isTicking) {
      return;
    }
    const timer = setInterval(() => {
      setCount((current) => Math.min(total, current + 1));
    }, stepMs);
    return () => clearInterval(timer);
  }, [isTicking, total, stepMs]);

  return count;
}

export function shownCountOf(
  isStreaming: boolean,
  count: number,
  total: number
) {
  if (isStreaming) {
    return count;
  }
  return total;
}

/**
 * A word that waits keeps its place without ink, so a paragraph has its final height from its first
 * word and nothing under it moves while it streams. Text that is not streaming carries no transition.
 */
export function inkClassOf(isStreaming: boolean, isShown: boolean) {
  if (!isStreaming) {
    return undefined;
  }
  if (isShown) {
    return SHOWN_WORD;
  }
  return 'invisible opacity-0';
}

export function leadingSpaceOf(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

export function StreamCaret() {
  return (
    <span
      aria-hidden='true'
      className='bg-foreground/50 absolute start-full top-[0.2em] ms-0.5 h-[1em] w-0.5 animate-pulse rounded-full'
    />
  );
}
