'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ThumbsUpIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_LIKES = 86;
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

function directionOf(isLiked: boolean) {
  if (isLiked) {
    return 1;
  }
  return -1;
}

export default function Button43() {
  const [isLiked, setIsLiked] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const direction = directionOf(isLiked);
  const ownLike = Number(isLiked);
  const likeCount = BASE_LIKES + ownLike;

  function toggleLike() {
    setIsLiked((current) => !current);
  }

  return (
    <Button
      variant='outline'
      className='py-0 pe-0'
      aria-pressed={isLiked}
      onClick={toggleLike}
    >
      <ThumbsUpIcon className='group-aria-pressed/button:text-primary-ink opacity-60 transition-[opacity,color] duration-150 group-aria-pressed/button:opacity-100' />
      Like
      <span className='hairline-l border-foreground/12 text-muted-foreground dark:border-foreground/15 ms-1 inline-flex h-full items-center px-3 text-xs font-medium tabular-nums'>
        <span className='relative flex' aria-hidden='true'>
          <AnimatePresence mode='popLayout' initial={false} custom={direction}>
            <motion.span
              key={likeCount}
              className='flex'
              custom={direction}
              variants={digitVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={DIGIT_TRANSITION}
            >
              {likeCount}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className='sr-only'>{likeCount} likes</span>
      </span>
    </Button>
  );
}
