'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

type SwapProps = {
  /** Changes when the content becomes another one. */
  swapKey: string;
  className?: string;
  children: React.ReactNode;
};

/** An icon that becomes another: the old one shrinks out of focus while the new one settles. */
export function Swap({ swapKey, className, children }: SwapProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.span
        key={swapKey}
        variants={variantsOf(shouldReduceMotion)}
        initial='enter'
        animate='visible'
        exit='exit'
        transition={SWAP_TRANSITION}
        className={cn('flex', className)}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
