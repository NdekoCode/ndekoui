'use client';

import { motion, type Variants } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.32, ease: EASE_OUT_STRONG, delay: 0.1 };

const STROKE: Variants = {
  waiting: { pathLength: 0 },
  drawn: { pathLength: 1, transition: DRAW },
};

const STROKE_STILL: Variants = {
  waiting: { pathLength: 1 },
  drawn: { pathLength: 1 },
};

function strokeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STROKE_STILL;
  }
  return STROKE;
}

const ONCE = { once: true };

/**
 * The check draws itself the first time it is on screen, not when it mounts: on a narrow page the
 * list is hidden while a reply is sent, and the stroke waits for the list to come back.
 */
export function DrawnCheck({ className }: { className?: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.span
      initial='waiting'
      whileInView='drawn'
      viewport={ONCE}
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
          variants={strokeOf(shouldReduceMotion)}
        />
      </svg>
    </motion.span>
  );
}
