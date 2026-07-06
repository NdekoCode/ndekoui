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

/** The larger mark of the message that says every step is done. Reduced motion shows it drawn. */
export function CalmCheck() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <span className='bg-success/10 text-success-foreground flex size-10 shrink-0 items-center justify-center rounded-full'>
      <svg aria-hidden='true' viewBox='0 0 12 12' className='size-5'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth={1.4}
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={DRAWN}
          transition={DRAW}
        />
      </svg>
    </span>
  );
}
