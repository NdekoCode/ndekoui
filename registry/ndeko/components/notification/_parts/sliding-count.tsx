'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const SHIFT_PX = 8;

const SLIDE_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SLIDE_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next > previous) {
    return 1;
  }
  return -1;
}

type Shown = { value: number; direction: number };

type SlidingCountProps = {
  value: number;
  /** Writes the figure in words, with its singular branch. */
  format: (value: number) => string;
  className?: string;
};

/** A figure the person just changed: it slides in the direction of the change. */
export function SlidingCount({ value, format, className }: SlidingCountProps) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState<Shown>({ value, direction: 1 });
  const text = format(value);

  if (shown.value !== value) {
    const direction = directionOf(shown.value, value);
    setShown({ value, direction });
  }

  return (
    <span
      className={cn(
        'relative inline-flex overflow-hidden tabular-nums',
        className
      )}
    >
      <AnimatePresence
        mode='popLayout'
        initial={false}
        custom={shown.direction}
      >
        <motion.span
          key={text}
          custom={shown.direction}
          variants={variantsOf(shouldReduceMotion)}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SLIDE_TRANSITION}
          className='whitespace-nowrap'
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
