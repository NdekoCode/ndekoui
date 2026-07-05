'use client';

import type { SliderRootChangeEventDetails } from '@base-ui/react/slider';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

type SliderValue = number | readonly number[];

type Readout = {
  value: number;
  slideKey: number;
  direction: number;
};

const MIN_CREDITS = 0;
const MAX_CREDITS = 200;
const CREDIT_STEP = 5;
const INITIAL_READOUT: Readout = { value: 100, slideKey: 0, direction: 1 };
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

function firstValueOf(value: SliderValue) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function clampCredits(credits: number) {
  const atLeastMin = Math.max(MIN_CREDITS, credits);
  return Math.min(MAX_CREDITS, atLeastMin);
}

function directionOf(previous: number, next: number) {
  if (next < previous) {
    return -1;
  }
  return 1;
}

function readoutAfter(current: Readout, value: number, shouldSlide: boolean) {
  if (!shouldSlide) {
    return { ...current, value };
  }
  const direction = directionOf(current.value, value);
  const slideKey = current.slideKey + 1;
  return { value, slideKey, direction };
}

function steppedReadout(current: Readout, step: number) {
  const nextValue = current.value + step;
  const credits = clampCredits(nextValue);
  return readoutAfter(current, credits, true);
}

export default function Slider20() {
  const [readout, setReadout] = useState(INITIAL_READOUT);
  const shouldReduceMotion = usePrefersReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const isAtMin = readout.value === MIN_CREDITS;
  const isAtMax = readout.value === MAX_CREDITS;

  function changeCredits(
    value: SliderValue,
    details: SliderRootChangeEventDetails
  ) {
    const nextValue = firstValueOf(value);
    const shouldSlide = details.reason !== 'drag';
    setReadout((current) => readoutAfter(current, nextValue, shouldSlide));
  }

  function decreaseCredits() {
    setReadout((current) => steppedReadout(current, -CREDIT_STEP));
  }

  function increaseCredits() {
    setReadout((current) => steppedReadout(current, CREDIT_STEP));
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label className='gap-1 tabular-nums'>
        <span className='relative flex' aria-hidden='true'>
          <AnimatePresence
            mode='popLayout'
            initial={false}
            custom={readout.direction}
          >
            <motion.span
              key={readout.slideKey}
              className='flex'
              custom={readout.direction}
              variants={digitVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={DIGIT_TRANSITION}
            >
              {readout.value}
            </motion.span>
          </AnimatePresence>
        </span>
        <span>credits a month</span>
      </Label>
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          size='icon'
          aria-label='Remove 5 credits'
          onClick={decreaseCredits}
          disabled={isAtMin}
          focusableWhenDisabled
        >
          <MinusIcon />
        </Button>
        <Slider
          className='grow'
          value={readout.value}
          onValueChange={changeCredits}
          min={MIN_CREDITS}
          max={MAX_CREDITS}
          step={CREDIT_STEP}
          thumbLabels={['Credits a month']}
        />
        <Button
          variant='outline'
          size='icon'
          aria-label='Add 5 credits'
          onClick={increaseCredits}
          disabled={isAtMax}
          focusableWhenDisabled
        >
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}
