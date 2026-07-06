'use client';

import { useLayoutEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

const TRAVEL: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

type KeyedHeightProps = {
  /** The frame travels to its new height when this changes, and only then. */
  changeKey: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * A frame that changes height with a movement only when its key changes: a fold, another view. Any
 * other change of its content (a row that arrives, a panel that opens) is followed at once, since
 * that content already moves by itself and a frame chasing it would animate the same change twice.
 * The padding leaves room for focus rings and the margin takes it back.
 */
export function KeyedHeight({
  changeKey,
  className,
  children,
}: KeyedHeightProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const knownHeight = useRef<number | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const observer = new ResizeObserver(() => {
      knownHeight.current = frame.offsetHeight;
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const from = knownHeight.current;
    if (!frame || from === null) {
      return;
    }
    if (shouldReduceMotion) {
      return;
    }
    const to = frame.offsetHeight;
    if (from === to) {
      return;
    }
    const keyframes = [{ height: `${from}px` }, { height: `${to}px` }];
    const travel = frame.animate(keyframes, TRAVEL);
    return () => travel.cancel();
  }, [changeKey, shouldReduceMotion]);

  return (
    <div
      ref={frameRef}
      data-slot='keyed-height'
      className={cn('-m-1 overflow-hidden', className)}
    >
      <div className='p-1'>{children}</div>
    </div>
  );
}
