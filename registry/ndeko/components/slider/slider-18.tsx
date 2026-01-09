'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState, type ReactNode } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SliderThumbValue } from '@/registry/ndeko/ui/slider';

const RATINGS = ['Awful', 'Poor', 'Okay', 'Good', 'Amazing'];
const INITIAL_RATING = 3;

const CONTROL =
  'relative flex w-full touch-none items-center py-2 select-none data-disabled:opacity-50';

const TRACK = 'bg-foreground/10 relative h-1 w-full grow rounded-full';

const THUMB = [
  'group/thumb block size-4 shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.18)] hairline-ring ring-foreground/15 outline-none',
  'transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong) has-focus-visible:ring-[3px] has-focus-visible:ring-ring/30 data-dragging:scale-110',
].join(' ');

const BUBBLE_LOOK = [
  'mb-2.5 rounded-lg bg-transparent px-2 py-1 text-popover-foreground',
  '[--bubble-top:var(--popover)] [--bubble-bottom:color-mix(in_oklab,var(--popover),var(--primary)_9%)]',
  'bg-linear-to-b from-(--bubble-top) to-(--bubble-bottom) hairline-ring ring-border shadow-md shadow-black/6',
].join(' ');

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const FACE_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const DOT_EYES = <path d='M9 10.5h.01M15 10.5h.01' strokeWidth='2.25' />;

const FACE_FEATURES: Record<number, ReactNode> = {
  1: (
    <>
      <path d='M7.75 7.75 10 8.75M16.25 7.75 14 8.75' />
      {DOT_EYES}
      <path d='M8.75 16.75c.8-1 1.9-1.5 3.25-1.5s2.45.5 3.25 1.5' />
    </>
  ),
  2: (
    <>
      {DOT_EYES}
      <path d='M9 16.25c.75-.65 1.75-1 3-1s2.25.35 3 1' />
    </>
  ),
  3: (
    <>
      {DOT_EYES}
      <path d='M9 15.5h6' />
    </>
  ),
  4: (
    <>
      {DOT_EYES}
      <path d='M9 14.5c.75.85 1.75 1.25 3 1.25s2.25-.4 3-1.25' />
    </>
  ),
  5: (
    <>
      <path d='M8 10.25c.5-.9 1.75-.9 2.25 0M13.75 10.25c.5-.9 1.75-.9 2.25 0' />
      <path d='M8.25 13.5h7.5c-.4 2-1.9 3.25-3.75 3.25s-3.35-1.25-3.75-3.25Z' />
    </>
  ),
};

function faceVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return FACE_VARIANTS;
}

function ratingLabelOf(rating: number) {
  const index = rating - 1;
  return RATINGS[index];
}

function ratingTextOf(_formattedValue: string, rating: number) {
  return ratingLabelOf(rating);
}

function RatingFace({ rating }: { rating: number }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className='size-6'
    >
      <circle cx='12' cy='12' r='9.25' />
      {FACE_FEATURES[rating]}
    </svg>
  );
}

export default function Slider18() {
  const [rating, setRating] = useState(INITIAL_RATING);
  const shouldReduceMotion = useReducedMotion();
  const faceVariants = faceVariantsOf(shouldReduceMotion);

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Rate your experience</Label>
      <div className='flex items-center gap-3'>
        <SliderPrimitive.Root
          value={rating}
          onValueChange={setRating}
          min={1}
          max={RATINGS.length}
          className='w-full'
        >
          <SliderPrimitive.Control className={CONTROL}>
            <SliderPrimitive.Track className={TRACK}>
              <SliderPrimitive.Indicator className='bg-primary rounded-full' />
              <SliderPrimitive.Thumb
                aria-label='Rate your experience'
                getAriaValueText={ratingTextOf}
                className={THUMB}
              >
                <SliderThumbValue className={BUBBLE_LOOK}>
                  {ratingLabelOf(rating)}
                </SliderThumbValue>
              </SliderPrimitive.Thumb>
            </SliderPrimitive.Track>
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>
        <span className='relative flex shrink-0'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={rating}
              className='flex'
              variants={faceVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <RatingFace rating={rating} />
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}
