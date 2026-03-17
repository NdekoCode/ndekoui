'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

type PresenceProps = Pick<
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

export function heightPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}

export function fadePresence() {
  return FADE_PRESENCE;
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

export function Swap({ swapKey, children, className }: SwapProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

  return (
    <span className={cn('relative inline-flex', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          variants={variants}
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

export function RollingCount({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
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
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
