'use client';

import {
  AnimatePresence,
  motion,
  type MotionProps,
  type Transition,
  type Variants,
} from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: EASE_OUT_STRONG };

const SWAP_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  shown: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

type SwapProps = {
  swapKey: string;
  children: React.ReactNode;
  className?: string;
};

export function Swap({ swapKey, children, className }: SwapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

  return (
    <span className={cn('relative inline-flex', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          variants={variants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={SWAP_TRANSITION}
          className='inline-flex items-center gap-[inherit]'
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function MorphText({ text }: { text: string }) {
  return <Swap swapKey={text}>{text}</Swap>;
}

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

/**
 * The spring AnimatedSize resizes with. It starts from rest, so the fade leads and the freed space
 * closes after it at the pace the surrounding layout follows, instead of snapping shut.
 */
const SIZE_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.32 };

const HEIGHT_ENTER: Transition = {
  ...SIZE_SPRING,
  opacity: ENTER,
};

const HEIGHT_EXIT: Transition = {
  ...SIZE_SPRING,
  opacity: EXIT,
};

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const HEIGHT_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: HEIGHT_EXIT },
  transition: HEIGHT_ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

export function heightPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}

export function fadePresence() {
  return FADE_PRESENCE;
}
