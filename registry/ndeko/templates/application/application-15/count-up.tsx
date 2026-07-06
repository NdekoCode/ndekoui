'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

const COUNT_MS = 1000;

function easeOut(progress: number) {
  const rest = 1 - progress;
  return 1 - rest * rest * rest;
}

function textOf(isFinal: boolean, finalText: string, restText: string) {
  if (isFinal) {
    return finalText;
  }
  return restText;
}

type CountUpProps = {
  value: number;
  format: Intl.NumberFormatOptions;
  suffix?: string;
  /** False until the figure is loaded: it reads zero, then counts up to its value once. */
  isLoaded: boolean;
  className?: string;
};

/**
 * A figure that counts up once. The text is written to the element on each frame, so no render
 * happens while it counts, and the final text is laid out invisibly so the figure never changes width.
 */
export function CountUp({
  value,
  format,
  suffix = '',
  isLoaded,
  className,
}: CountUpProps) {
  const liveRef = useRef<HTMLSpanElement>(null);
  const [hasCounted, setHasCounted] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const formatter = useMemo(
    () => new Intl.NumberFormat('en-US', format),
    [format]
  );
  const finalText = `${formatter.format(value)}${suffix}`;
  const restText = `${formatter.format(0)}${suffix}`;
  const isReducedAndLoaded = isLoaded && shouldReduceMotion;
  const isFinal = hasCounted || isReducedAndLoaded;
  const shownText = textOf(isFinal, finalText, restText);

  useEffect(() => {
    const element = liveRef.current;
    const hasToCount = isLoaded && !hasCounted;
    const isCounting = hasToCount && !shouldReduceMotion;
    if (!element || !isCounting) {
      return;
    }
    let frame = 0;
    let startedAt: number | null = null;

    function step(now: number) {
      if (!element) {
        return;
      }
      const begun = startedAt ?? now;
      startedAt = begun;
      const progress = Math.min((now - begun) / COUNT_MS, 1);
      const current = value * easeOut(progress);
      element.textContent = `${formatter.format(current)}${suffix}`;
      if (progress < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      setHasCounted(true);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isLoaded, hasCounted, shouldReduceMotion, value, formatter, suffix]);

  return (
    <span className={cn('inline-grid tabular-nums', className)}>
      <span className='sr-only'>{finalText}</span>
      <span aria-hidden='true' className='invisible col-start-1 row-start-1'>
        {finalText}
      </span>
      <span
        ref={liveRef}
        aria-hidden='true'
        className='col-start-1 row-start-1'
      >
        {shownText}
      </span>
    </span>
  );
}
