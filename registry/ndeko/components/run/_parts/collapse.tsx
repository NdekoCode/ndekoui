'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';

const OPEN = { height: 'auto', opacity: 1 };

const CLOSED = { height: 0, opacity: 0 };

const OPENING: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const CLOSING: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

function targetOf(open: boolean) {
  if (open) {
    return OPEN;
  }
  return CLOSED;
}

function transitionOf(open: boolean, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  if (open) {
    return OPENING;
  }
  return CLOSING;
}

type CollapseProps = {
  open: boolean;
  id?: string;
  children: React.ReactNode;
};

/**
 * A panel that folds and keeps its content in the page. Open, it takes the height of its content
 * without animating it, so a row that arrives inside moves once, by its own presence. The padding
 * leaves room for focus rings and the margin takes it back, also when the panel is closed.
 */
export function Collapse({ open, id, children }: CollapseProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      id={id}
      inert={!open}
      initial={false}
      animate={targetOf(open)}
      transition={transitionOf(open, shouldReduceMotion)}
      className='-m-1 overflow-hidden p-1'
    >
      {children}
    </motion.div>
  );
}
