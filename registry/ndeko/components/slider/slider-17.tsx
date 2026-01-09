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
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

type SliderValue = number | readonly number[];

const RATINGS = ['Awful', 'Poor', 'Okay', 'Good', 'Amazing'];
const INITIAL_RATING = 3;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function firstValueOf(value: SliderValue) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function ratingLabelOf(rating: number) {
  const index = rating - 1;
  return RATINGS[index];
}

type FaceProps = {
  className?: string;
};

function AwfulFace({ className }: FaceProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <circle cx='12' cy='12' r='9.25' />
      <path d='M7.75 8.5 10 9.5M16.25 8.5 14 9.5' />
      <path d='M9 11.5h.01M15 11.5h.01' strokeWidth='2.25' />
      <path d='M8.75 16.75c.8-1 1.9-1.5 3.25-1.5s2.45.5 3.25 1.5' />
    </svg>
  );
}

function AmazingFace({ className }: FaceProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <circle cx='12' cy='12' r='9.25' />
      <path d='M8 10.25c.5-.9 1.75-.9 2.25 0M13.75 10.25c.5-.9 1.75-.9 2.25 0' />
      <path d='M8.25 13.5h7.5c-.4 2-1.9 3.25-3.75 3.25s-3.35-1.25-3.75-3.25Z' />
    </svg>
  );
}

export default function Slider17() {
  const [rating, setRating] = useState(INITIAL_RATING);
  const shouldReduceMotion = useReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const ratingLabel = ratingLabelOf(rating);

  function changeRating(value: SliderValue) {
    const nextRating = firstValueOf(value);
    setRating(nextRating);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <Label>Rate your experience</Label>
        <span className='relative flex text-[13px] font-medium'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={ratingLabel}
              className='flex'
              variants={labelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {ratingLabel}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <AwfulFace className='text-muted-foreground' />
        <Slider
          value={rating}
          onValueChange={changeRating}
          min={1}
          max={RATINGS.length}
          thumbLabels={['Rate your experience']}
        />
        <AmazingFace className='text-muted-foreground' />
      </div>
    </div>
  );
}
