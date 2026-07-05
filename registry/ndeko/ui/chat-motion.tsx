// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

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
  /** Changing the key swaps the old content for the new one. */
  swapKey: string;
  children: React.ReactNode;
  className?: string;
};

function Swap({ swapKey, children, className }: SwapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

  return (
    <span
      data-slot='swap'
      className={cn('relative inline-flex items-center', className)}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          variants={variants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={SWAP_TRANSITION}
          className='inline-flex items-center'
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const FOLD_OPEN = 'opacity-100 duration-200';

const FOLD_CLOSED = 'h-0 opacity-0 duration-100';

function foldStateOf(open: boolean) {
  if (open) {
    return FOLD_OPEN;
  }
  return FOLD_CLOSED;
}

type FoldProps = {
  open: boolean;
  children: React.ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
};

/** Closed, the content keeps its place at zero height and the resizing box clips it, so it folds instead of vanishing. */
function Fold({ open, children, id, className, contentClassName }: FoldProps) {
  return (
    <AnimatedSize className={className}>
      <div
        id={id}
        data-slot='fold'
        data-open={open}
        inert={!open}
        className={cn(
          'transition-opacity ease-(--ease-out-strong)',
          foldStateOf(open),
          contentClassName
        )}
      >
        {children}
      </div>
    </AnimatedSize>
  );
}

export { Fold, Swap, type FoldProps, type SwapProps };
