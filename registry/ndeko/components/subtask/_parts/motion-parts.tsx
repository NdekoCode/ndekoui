'use client';

import {
  AnimatePresence,
  motion,
  type MotionProps,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

export const EASE_OUT_STRONG: [number, number, number, number] = [
  0.23, 1, 0.32, 1,
];

export const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

export const EXIT: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

export type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const HEIGHT_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

/** Rows that arrive or leave a list: their height opens and closes so the rows after them slide. */
export function heightPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

const SWAP_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  shown: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

type SwapProps = {
  swapKey: string;
  children: React.ReactNode;
  className?: string;
};

/** An icon or a short label that becomes another one in place. */
export function Swap({ swapKey, children, className }: SwapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <span className={cn('relative inline-flex', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          variants={swapVariantsOf(shouldReduceMotion)}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={SWAP_TRANSITION}
          className='inline-flex'
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const COUNT_SLIDE = 8;

const COUNT_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

const COUNT_VARIANTS: Variants = {
  enter: (offset: number) => ({ y: offset, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  leave: (offset: number) => ({ y: -offset, opacity: 0 }),
};

function directionOf(previous: number, next: number) {
  if (next < previous) {
    return -1;
  }
  return 1;
}

function offsetOf(direction: number, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return direction * COUNT_SLIDE;
}

type RollingCountProps = {
  value: number;
  /** Writes the value, such as a duration; the digits still roll on the number. */
  format?: (value: number) => string;
  className?: string;
};

function plainNumber(value: number) {
  return String(value);
}

/** A figure the person just changed: the new digits slide in from the side of the change. */
export function RollingCount({
  value,
  format = plainNumber,
  className,
}: RollingCountProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);

  if (previous !== value) {
    setDirection(directionOf(previous, value));
    setPrevious(value);
  }

  const offset = offsetOf(direction, shouldReduceMotion);

  return (
    <span
      className={cn(
        'relative inline-flex overflow-hidden tabular-nums',
        className
      )}
    >
      <AnimatePresence mode='popLayout' initial={false} custom={offset}>
        <motion.span
          key={value}
          custom={offset}
          variants={COUNT_VARIANTS}
          initial='enter'
          animate='center'
          exit='leave'
          transition={COUNT_TRANSITION}
          className='inline-block'
        >
          {format(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
