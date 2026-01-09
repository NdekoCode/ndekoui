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

import { Button } from '@/registry/ndeko/ui/button';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

type SliderValue = number | readonly number[];

type Readout = {
  value: number;
  slideKey: number;
  direction: number;
};

const MIN_PRICE = 5;
const MAX_PRICE = 1240;
const DIGIT_SHIFT_PX = 8;

const DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

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

function valuesOf(value: SliderValue) {
  if (typeof value === 'number') {
    return [value];
  }
  return [...value];
}

function priceLabelOf(price: number) {
  const amount = DOLLARS.format(price);
  if (price === MAX_PRICE) {
    return `${amount}+`;
  }
  return amount;
}

function directionOf(previous: number, next: number) {
  if (next < previous) {
    return -1;
  }
  return 1;
}

function readoutOf(value: number): Readout {
  return { value, slideKey: 0, direction: 1 };
}

function readoutAfter(current: Readout, value: number, shouldSlide: boolean) {
  const hasChanged = value !== current.value;
  const isSliding = shouldSlide && hasChanged;
  if (!isSliding) {
    return { ...current, value };
  }
  const direction = directionOf(current.value, value);
  const slideKey = current.slideKey + 1;
  return { value, slideKey, direction };
}

function readoutsAfter(
  current: readonly Readout[],
  values: readonly number[],
  shouldSlide: boolean
) {
  return values.map((value, index) =>
    readoutAfter(current[index], value, shouldSlide)
  );
}

function valueOfReadout(readout: Readout) {
  return readout.value;
}

type SlidingFigureProps = {
  readout: Readout;
  variants: Variants;
  children: React.ReactNode;
};

function SlidingFigure({ readout, variants, children }: SlidingFigureProps) {
  return (
    <span className='relative inline-flex'>
      <AnimatePresence
        mode='popLayout'
        initial={false}
        custom={readout.direction}
      >
        <motion.span
          key={readout.slideKey}
          className='inline-flex'
          custom={readout.direction}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={DIGIT_TRANSITION}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Slider21() {
  const [readouts, setReadouts] = useState(() =>
    [MIN_PRICE, MAX_PRICE].map(readoutOf)
  );
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const prices = readouts.map(valueOfReadout);
  const [lowest, highest] = readouts;
  const lowestLabel = priceLabelOf(lowest.value);
  const highestLabel = priceLabelOf(highest.value);

  function changePrices(
    value: SliderValue,
    details: SliderRootChangeEventDetails
  ) {
    const nextPrices = valuesOf(value);
    const shouldSlide = details.reason !== 'drag';
    setReadouts((current) => readoutsAfter(current, nextPrices, shouldSlide));
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label className='tabular-nums'>
        <span>
          From{' '}
          <SlidingFigure readout={lowest} variants={digitVariants}>
            {lowestLabel}
          </SlidingFigure>{' '}
          to{' '}
          <SlidingFigure readout={highest} variants={digitVariants}>
            {highestLabel}
          </SlidingFigure>
        </span>
      </Label>
      <div className='flex items-center gap-4'>
        <Slider
          value={prices}
          onValueChange={changePrices}
          min={MIN_PRICE}
          max={MAX_PRICE}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
        <Button variant='outline'>Apply</Button>
      </div>
    </div>
  );
}
