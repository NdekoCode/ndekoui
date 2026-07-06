'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 };

function strokeStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

/** The check draws itself when it mounts. Reduced motion shows it drawn. */
export function DrawnCheck({ className }: { className?: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <span
      className={cn(
        'chip-3d inline-flex size-[18px] shrink-0 items-center justify-center rounded-full [--chip:var(--success)]',
        className
      )}
    >
      <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.9'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </span>
  );
}
