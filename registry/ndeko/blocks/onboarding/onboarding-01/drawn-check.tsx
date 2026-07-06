'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.32, ease: EASE_OUT_STRONG, delay: 0.1 };

const DRAWN = { pathLength: 1 };

const NOT_DRAWN = { pathLength: 0 };

function strokeStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return DRAWN;
  }
  return NOT_DRAWN;
}

type CheckStrokeProps = {
  className: string;
  strokeWidth: number;
};

/** The stroke draws itself when it mounts. Reduced motion shows it drawn. */
function CheckStroke({ className, strokeWidth }: CheckStrokeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <svg aria-hidden='true' viewBox='0 0 12 12' className={className}>
      <motion.path
        d={CHECK_PATH}
        fill='none'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
        initial={strokeStartOf(shouldReduceMotion)}
        animate={DRAWN}
        transition={DRAW}
      />
    </svg>
  );
}

/** The mark of a step that is done. */
export function DrawnCheck() {
  return (
    <span className='chip-3d inline-flex size-[18px] shrink-0 items-center justify-center rounded-full [--chip:var(--success)]'>
      <CheckStroke className='size-3' strokeWidth={1.9} />
    </span>
  );
}

/** The larger mark of the message that says every step is done. */
export function CalmCheck() {
  return (
    <span className='bg-success/10 text-success-foreground flex size-10 shrink-0 items-center justify-center rounded-full'>
      <CheckStroke className='size-5' strokeWidth={1.4} />
    </span>
  );
}
