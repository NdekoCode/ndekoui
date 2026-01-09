'use client';

import type { SliderRootChangeEventDetails } from '@base-ui/react/slider';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { Volume2Icon, VolumeXIcon } from '@/registry/ndeko/lib/icons';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

type SliderValue = number | readonly number[];

type Readout = {
  value: number;
  slideKey: number;
  direction: number;
};

const INITIAL_READOUT: Readout = { value: 25, slideKey: 0, direction: 1 };
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

export default function Slider13() {
  const [readout, setReadout] = useState(INITIAL_READOUT);
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);

  function changeVolume(
    value: SliderValue,
    details: SliderRootChangeEventDetails
  ) {
    const nextValue = firstValueOf(value);
    const shouldSlide = details.reason !== 'drag';
    setReadout((current) => readoutAfter(current, nextValue, shouldSlide));
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <Label>Volume</Label>
        <span
          className='relative flex text-[13px] font-medium tabular-nums'
          aria-hidden='true'
        >
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
      </div>
      <div className='flex items-center gap-2'>
        <VolumeXIcon className='text-muted-foreground size-4 shrink-0' />
        <Slider
          value={readout.value}
          onValueChange={changeVolume}
          thumbLabels={['Volume']}
        />
        <Volume2Icon className='text-muted-foreground size-4 shrink-0' />
      </div>
    </div>
  );
}
