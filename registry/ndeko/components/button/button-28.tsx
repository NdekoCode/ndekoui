'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ChevronDownIcon, ChevronUpIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_SCORE = 235;
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

const SEGMENT = [
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10',
  'aria-pressed:bg-[color-mix(in_oklab,black_12%,var(--primary))] hover:aria-pressed:bg-[color-mix(in_oklab,black_12%,var(--primary))]',
].join(' ');

const COUNT_SEGMENT = [
  'flex items-center px-1 text-[13px] font-medium tabular-nums',
  'bg-primary text-primary-foreground',
  'shadow-[0_1px_2px_rgb(0_0_0/0.14),inset_0_1px_0_rgb(255_255_255/0.12)]',
  'hairline-ring ring-(--ring-color) [--ring-color:color-mix(in_oklab,black_18%,var(--primary))]',
  'dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
].join(' ');

type Vote = -1 | 0 | 1;

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function nextVoteOf(currentVote: Vote, castVote: Vote): Vote {
  if (currentVote === castVote) {
    return 0;
  }
  return castVote;
}

export default function Button28() {
  const [vote, setVote] = useState<Vote>(0);
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const score = BASE_SCORE + vote;
  const isUpvoted = vote === 1;
  const isDownvoted = vote === -1;

  function castVote(cast: Vote) {
    const nextVote = nextVoteOf(vote, cast);
    const change = nextVote - vote;
    const nextDirection = Math.sign(change);
    setDirection(nextDirection);
    setVote(nextVote);
  }

  function upvote() {
    castVote(1);
  }

  function downvote() {
    castVote(-1);
  }

  return (
    <div className='inline-flex -space-x-px'>
      <Button
        size='icon'
        aria-label='Upvote'
        aria-pressed={isUpvoted}
        onClick={upvote}
        className={SEGMENT}
      >
        <ChevronUpIcon />
      </Button>
      <span className={COUNT_SEGMENT}>
        <span className='relative flex' aria-hidden='true'>
          <AnimatePresence mode='popLayout' initial={false} custom={direction}>
            <motion.span
              key={score}
              className='flex'
              custom={direction}
              variants={digitVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={DIGIT_TRANSITION}
            >
              {score}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className='sr-only'>Score {score}</span>
      </span>
      <Button
        size='icon'
        aria-label='Downvote'
        aria-pressed={isDownvoted}
        onClick={downvote}
        className={SEGMENT}
      >
        <ChevronDownIcon />
      </Button>
    </div>
  );
}
