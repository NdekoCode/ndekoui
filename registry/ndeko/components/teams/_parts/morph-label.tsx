'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

const ARRIVE: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LEAVE: Transition = { duration: 0.1, ease: [0.2, 0, 0, 1] };

const BLUR_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: ARRIVE },
  exit: { opacity: 0, filter: 'blur(2px)', transition: LEAVE },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: ARRIVE },
  exit: { opacity: 0, transition: LEAVE },
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return BLUR_VARIANTS;
}

type MorphLabelProps = {
  /** Changes when the label becomes another one. */
  value: string;
  className?: string;
  children: React.ReactNode;
};

/** A label that becomes another: the text crossfades through a light blur while its width follows. */
export function MorphLabel({ value, className, children }: MorphLabelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={value}
          variants={variantsOf(shouldReduceMotion)}
          initial='enter'
          animate='visible'
          exit='exit'
          className={cn('flex whitespace-nowrap', className)}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </AnimatedSize>
  );
}
