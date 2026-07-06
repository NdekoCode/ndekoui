'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_IN_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

type Part = 'top' | 'bottom';

const FLIP_SECONDS = 0.42;

const FLIP_FROM = { rotateX: 0 };

const FLIP_TO = { rotateX: -180 };

const FACE_HIDDEN = '[backface-visibility:hidden]';

function glyphShiftOf(part: Part) {
  if (part === 'top') {
    return 'top-0';
  }
  return '-top-full';
}

function halfPlaceOf(part: Part) {
  if (part === 'top') {
    return 'top-0 rounded-t-lg';
  }
  return 'bottom-0 rounded-b-lg';
}

type FaceProps = {
  digit: number;
  part: Part;
  className?: string;
};

function Face({ digit, part, className }: FaceProps) {
  return (
    <span className={cn('bg-card absolute inset-0 overflow-hidden', className)}>
      <span
        className={cn(
          'absolute inset-x-0 flex h-[200%] items-center justify-center',
          glyphShiftOf(part)
        )}
      >
        {digit}
      </span>
    </span>
  );
}

function StaticHalf({ digit, part }: { digit: number; part: Part }) {
  return (
    <span
      className={cn(
        'absolute inset-x-0 h-1/2 overflow-hidden',
        halfPlaceOf(part)
      )}
    >
      <Face digit={digit} part={part} />
    </span>
  );
}

function lowerDigitOf(
  isFlipping: boolean,
  previous: number | null,
  current: number
) {
  if (isFlipping && previous !== null) {
    return previous;
  }
  return current;
}

export function FlapDigit({ value }: { value: number }) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<number | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasChanged = value !== current;
  if (hasChanged) {
    setPrevious(current);
    setCurrent(value);
  }
  const isFlipping = previous !== null && !shouldReduceMotion;
  const lowerDigit = lowerDigitOf(isFlipping, previous, current);

  function land() {
    setPrevious(null);
  }

  return (
    <span className='hairline-ring ring-border text-foreground relative inline-block h-14 w-9 rounded-lg text-3xl font-semibold tabular-nums shadow-[0_1px_2px_rgb(0_0_0/0.05)] [perspective:360px] @sm:h-16 @sm:w-11 @sm:text-4xl'>
      <StaticHalf digit={current} part='top' />
      <StaticHalf digit={lowerDigit} part='bottom' />
      {isFlipping && (
        <motion.span
          key={`${previous}-${current}`}
          initial={FLIP_FROM}
          animate={FLIP_TO}
          transition={{ duration: FLIP_SECONDS, ease: EASE_IN_OUT_STRONG }}
          onAnimationComplete={land}
          className='absolute inset-x-0 top-0 z-10 h-1/2 origin-bottom [transform-style:preserve-3d]'
        >
          <Face
            digit={previous}
            part='top'
            className={cn('rounded-t-lg', FACE_HIDDEN)}
          />
          <Face
            digit={current}
            part='bottom'
            className={cn(
              '[transform:rotateX(180deg)] rounded-b-lg',
              FACE_HIDDEN
            )}
          />
        </motion.span>
      )}
      <span
        aria-hidden='true'
        className='bg-border absolute inset-x-0 top-1/2 z-20 h-(--hairline)'
      />
    </span>
  );
}
