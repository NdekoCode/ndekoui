'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import type { Member } from './people';

const ARRIVE: Transition = { type: 'spring', bounce: 0, duration: 0.32 };

const LEAVE: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

function hiddenScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.8;
}

function hiddenWidthOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 0;
}

type AvatarStackProps = {
  members: Member[];
  /** How many faces to draw before the rest becomes a +N chip. */
  limit: number;
  /** Members beyond the ones listed, counted in the +N chip. */
  extraCount?: number;
  className?: string;
};

/** Opaque faces overlapping from the start; a face added later slides in and makes room. */
export function AvatarStack({
  members,
  limit,
  extraCount = 0,
  className,
}: AvatarStackProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hiddenScale = hiddenScaleOf(shouldReduceMotion);
  const hiddenWidth = hiddenWidthOf(shouldReduceMotion);
  const shown = members.slice(0, limit);
  const hiddenMembers = members.length - shown.length;
  const restCount = hiddenMembers + extraCount;
  const hasRest = restCount > 0;

  return (
    <span className={cn('flex items-center ps-1.5', className)}>
      <AnimatePresence initial={false}>
        {shown.map((member) => (
          <motion.span
            key={member.id}
            initial={{ width: hiddenWidth, opacity: 0, scale: hiddenScale }}
            animate={{
              width: 'auto',
              opacity: 1,
              scale: 1,
              transition: ARRIVE,
            }}
            exit={{
              width: hiddenWidth,
              opacity: 0,
              scale: hiddenScale,
              transition: LEAVE,
            }}
            className='-ms-1.5 flex'
          >
            <Avatar className='ring-card size-6 ring-2' seed={member.name} />
          </motion.span>
        ))}
      </AnimatePresence>
      {hasRest && (
        <span className='bg-muted text-muted-foreground ring-card relative -ms-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums ring-2'>
          +{restCount}
        </span>
      )}
    </span>
  );
}
