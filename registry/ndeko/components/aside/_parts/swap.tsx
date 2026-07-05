'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import { SWAP_TRANSITION, swapVariantsOf, type SwapKind } from './motion';

type SwapProps = {
  /** Changes when the content becomes another one: the old leaves while the new arrives in its place. */
  swapKey: string;
  kind?: SwapKind;
  className?: string;
  children: React.ReactNode;
};

export function Swap({
  swapKey,
  kind = 'icon',
  className,
  children,
}: SwapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion, kind);

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={swapKey}
          className='inline-flex items-center gap-[inherit] whitespace-nowrap'
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
