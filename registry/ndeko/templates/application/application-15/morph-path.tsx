'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';

const MORPH: Transition = { duration: 0.45, ease: EASE_OUT_STRONG };

function transitionOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH;
}

type MorphPathProps = {
  d: string;
  className?: string;
  style?: React.CSSProperties;
};

/** A shape that glides to its new outline when the data changes, as long as both outlines have the same number of points. */
export function MorphPath({ d, className, style }: MorphPathProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.path
      initial={false}
      animate={{ d }}
      transition={transitionOf(shouldReduceMotion)}
      vectorEffect='non-scaling-stroke'
      className={className}
      style={style}
    />
  );
}
