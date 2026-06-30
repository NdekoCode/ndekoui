'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';

import { SWAP_TRANSITION, swapVariantsOf, type SwapKind } from './motion';

type SwapProps = {
  /** Changes when the content becomes another: the old one leaves while the new one arrives in its place. */
  swapKey: string;
  kind?: SwapKind;
  className?: string;
  /** Classes of the moving content, for example `min-w-0 max-w-full` so a long text can truncate inside. */
  contentClassName?: string;
  children: React.ReactNode;
};

export function Swap({
  swapKey,
  kind = 'icon',
  className,
  contentClassName,
  children,
}: SwapProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion, kind);

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          className={cn(
            'inline-flex items-center gap-[inherit] whitespace-nowrap',
            contentClassName
          )}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
