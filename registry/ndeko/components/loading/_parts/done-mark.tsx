'use client';

import { motion, type Transition } from 'motion/react';
import type { ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const DRAWN = { pathLength: 1 };

const NOT_DRAWN = { pathLength: 0 };

const SHOWN = { opacity: 1 };

const HIDDEN = { opacity: 0 };

const LEAVING = { opacity: 0, transition: { duration: 0.1 } };

const FADE_IN: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

function layerStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return HIDDEN;
  }
  return SHOWN;
}

type DoneLayerProps = {
  /** Inside a 24 by 24 box, drawn in the text colour of success. */
  children: ReactNode;
  className?: string;
};

/**
 * The strokes a mark lands on when the work is done, over the whole mark. It leaves faster than it
 * came, and under reduced motion it fades in already drawn.
 */
export function DoneLayer({ children, className }: DoneLayerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  return (
    <motion.svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      initial={layerStartOf(shouldReduceMotion)}
      animate={SHOWN}
      exit={LEAVING}
      transition={FADE_IN}
      className={cn(
        'text-success-foreground absolute inset-0 size-full',
        className
      )}
    >
      {children}
    </motion.svg>
  );
}

/** A stroke that draws itself from its start, after `delay` seconds; already drawn under reduced motion. */
export function useDrawnStroke(durationS: number, delay = 0) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition: Transition = {
    duration: durationS,
    delay,
    ease: EASE_OUT_STRONG,
  };
  if (shouldReduceMotion) {
    return { initial: DRAWN, animate: DRAWN, transition };
  }
  return { initial: NOT_DRAWN, animate: DRAWN, transition };
}
