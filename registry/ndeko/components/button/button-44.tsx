'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { StarIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_STARS = 729;
const DIGIT_SHIFT_PX = 8;

const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function directionOf(isStarred: boolean) {
  if (isStarred) {
    return 1;
  }
  return -1;
}

export default function Button44() {
  const [isStarred, setIsStarred] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const direction = directionOf(isStarred);
  const ownStar = Number(isStarred);
  const starCount = BASE_STARS + ownStar;

  function toggleStar() {
    setIsStarred((current) => !current);
  }

  return (
    <Button aria-pressed={isStarred} onClick={toggleStar}>
      <StarIcon className='-ms-1 opacity-60 transition-opacity duration-150 group-aria-pressed/button:opacity-100' />
      <span className='flex items-baseline gap-2'>
        Star
        <span className='text-primary-foreground/70 relative flex text-xs tabular-nums'>
          <span className='flex' aria-hidden='true'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={direction}
            >
              <motion.span
                key={starCount}
                className='flex'
                custom={direction}
                variants={digitVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={DIGIT_TRANSITION}
              >
                {starCount}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className='sr-only'>{starCount} stars</span>
        </span>
      </span>
    </Button>
  );
}
