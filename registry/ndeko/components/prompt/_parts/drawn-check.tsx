'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 };

const POP = { duration: 0.16, ease: EASE_OUT_STRONG };

const LEAVE = { duration: 0.1 };

function arrivalOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: 0, scale: 1 };
  }
  return { opacity: 0, scale: 0.7 };
}

function strokeStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

type DrawnCheckProps = {
  /** Read by screen readers. Leave it out when the row already says it is selected. */
  label?: string;
  className?: string;
};

/**
 * The mark of the selected row, whose check draws itself when the mark arrives. Inside an
 * `AnimatePresence initial={false}` the mark of the row selected on mount is simply there.
 */
export function DrawnCheck({ label, className }: DrawnCheckProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasLabel = Boolean(label);

  return (
    <motion.span
      aria-hidden={!hasLabel}
      initial={arrivalOf(shouldReduceMotion)}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: LEAVE }}
      transition={POP}
      className={cn(
        'chip-3d inline-flex size-[18px] shrink-0 items-center justify-center rounded-full [--chip:var(--primary)]',
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
      {hasLabel && <span className='sr-only'>{label}</span>}
    </motion.span>
  );
}
