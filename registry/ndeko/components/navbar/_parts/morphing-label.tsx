'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const EXIT_TRANSITION: Transition = { duration: 0.1, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)', transition: EXIT_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT_TRANSITION },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

type MorphingLabelProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
};

function MorphingLabel({ value, className, children }: MorphingLabelProps) {
  const shouldReduceMotion = useReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);

  return (
    <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={value}
          className={cn('flex whitespace-nowrap', className)}
          variants={labelVariants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </AnimatedSize>
  );
}

export { MorphingLabel };
