'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';

const COUNT_TRANSITION: Transition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
};

const SLIDE_DISTANCE = 8;

const COUNT_VARIANTS: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction * SLIDE_DISTANCE,
  }),
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction * -SLIDE_DISTANCE,
  }),
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function countVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return COUNT_VARIANTS;
}

type SlidingFigureProps = {
  value: string;
  direction: number;
  className?: string;
};

export function SlidingFigure({
  value,
  direction,
  className,
}: SlidingFigureProps) {
  const shouldReduceMotion = useReducedMotion();
  const countVariants = countVariantsOf(shouldReduceMotion);

  return (
    <span className={cn('relative inline-flex tabular-nums', className)}>
      <AnimatePresence mode='popLayout' initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={countVariants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={COUNT_TRANSITION}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
