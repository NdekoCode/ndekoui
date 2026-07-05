'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ARRIVE: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

const LEAVE: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

function hiddenScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.4;
}

type UnreadDotProps = {
  isUnread: boolean;
  className?: string;
};

/** The primary dot of an unread notification. It shrinks away when the notification is read. */
export function UnreadDot({ isUnread, className }: UnreadDotProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hiddenScale = hiddenScaleOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isUnread && (
        <motion.span
          key='unread'
          aria-hidden='true'
          initial={{ opacity: 0, scale: hiddenScale }}
          animate={{ opacity: 1, scale: 1, transition: ARRIVE }}
          exit={{ opacity: 0, scale: hiddenScale, transition: LEAVE }}
          className={cn('bg-primary block size-1.5 rounded-full', className)}
        />
      )}
    </AnimatePresence>
  );
}
