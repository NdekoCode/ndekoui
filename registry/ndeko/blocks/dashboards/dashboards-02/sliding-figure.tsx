'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const DIGIT_SHIFT_PX = 8;

const DIGIT_TRANSITION: Transition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
};

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction * DIGIT_SHIFT_PX,
  }),
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction * -DIGIT_SHIFT_PX,
  }),
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

type ShownFigure = { amount: number; direction: number };

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next < previous) {
    return -1;
  }
  return 1;
}

type SlidingFigureProps = {
  /** The number behind the text, so the digits know which way to slide. */
  amount: number;
  text: string;
  className?: string;
};

/** A figure whose changed characters slide in the direction of the change. It appears at its value on mount. */
export function SlidingFigure({ amount, text, className }: SlidingFigureProps) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState<ShownFigure>({ amount, direction: 1 });
  const variants = digitVariantsOf(shouldReduceMotion);
  const characters = Array.from(text);
  const lastIndex = characters.length - 1;

  if (shown.amount !== amount) {
    const direction = directionOf(shown.amount, amount);
    setShown({ amount, direction });
  }

  return (
    <span className={cn('relative inline-flex tabular-nums', className)}>
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true' className='inline-flex whitespace-pre'>
        {characters.map((character, index) => {
          const placeFromEnd = lastIndex - index;

          return (
            <span key={placeFromEnd} className='relative inline-flex'>
              <AnimatePresence
                mode='popLayout'
                initial={false}
                custom={shown.direction}
              >
                <motion.span
                  key={character}
                  custom={shown.direction}
                  variants={variants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={DIGIT_TRANSITION}
                >
                  {character}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        })}
      </span>
    </span>
  );
}
