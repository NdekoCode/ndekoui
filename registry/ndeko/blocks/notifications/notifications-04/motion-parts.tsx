'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * The spring AnimatedSize resizes with. It starts from rest, so the fade leads and the freed space
 * closes after it at the pace the list follows, instead of snapping shut.
 */
const SIZE_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.32 };

const ARRIVE: Transition = {
  ...SIZE_SPRING,
  opacity: { duration: 0.2, ease: EASE_OUT_STRONG },
};

const LEAVE: Transition = {
  ...SIZE_SPRING,
  opacity: { duration: 0.12, ease: EASE_OUT_STRONG },
};

const ROW_VARIANTS: Variants = {
  shown: { height: 'auto', opacity: 1, transition: ARRIVE },
  hidden: { height: 0, opacity: 0, transition: LEAVE },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT_STRONG } },
  hidden: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT_STRONG } },
};

/** A row whose spacing sits inside it: its height and opacity close together. */
export function rowCollapseOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ROW_VARIANTS;
}

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const SWAP_FADE: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return SWAP_FADE;
  }
  return SWAP_VARIANTS;
}

type SwapProps = {
  swapKey: string;
  className?: string;
  children: React.ReactNode;
};

/** An icon that becomes another: the old one shrinks out of focus while the new one settles. */
export function Swap({ swapKey, className, children }: SwapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.span
        key={swapKey}
        variants={swapVariantsOf(shouldReduceMotion)}
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

const DOT_ARRIVE: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

const DOT_LEAVE: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

function dotScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.4;
}

/** The primary dot of an unread notification. It shrinks away when the notification is read. */
export function UnreadDot({
  isUnread,
  className,
}: {
  isUnread: boolean;
  className?: string;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hiddenScale = dotScaleOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isUnread && (
        <motion.span
          key='unread'
          aria-hidden='true'
          initial={{ opacity: 0, scale: hiddenScale }}
          animate={{ opacity: 1, scale: 1, transition: DOT_ARRIVE }}
          exit={{ opacity: 0, scale: hiddenScale, transition: DOT_LEAVE }}
          className={cn('bg-primary block size-1.5 rounded-full', className)}
        />
      )}
    </AnimatePresence>
  );
}
