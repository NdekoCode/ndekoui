'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const PILL_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PILL_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const PILL_PRESENCE: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.97, transition: PILL_OUT },
  shown: { opacity: 1, y: 0, scale: 1, transition: PILL_IN },
};

const PILL_FADE: Variants = {
  hidden: { opacity: 0, transition: PILL_OUT },
  shown: { opacity: 1, transition: PILL_IN },
};

function pillVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return PILL_FADE;
  }
  return PILL_PRESENCE;
}

function hiddenLabelOf(count: number) {
  if (count === 1) {
    return 'task hidden by filters';
  }
  return 'tasks hidden by filters';
}

type FilterPillProps = {
  hiddenCount: number;
  onClear: () => void;
};

/** Floats over the board while filters hide tasks, so the board itself never moves. */
export function FilterPill({ hiddenCount, onClear }: FilterPillProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = pillVariantsOf(shouldReduceMotion);
  const isVisible = hiddenCount > 0;

  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4'>
      <AnimatePresence initial={false}>
        {isVisible && (
          <motion.div
            key='filter-pill'
            role='status'
            variants={variants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='surface-raised pointer-events-auto flex h-10 items-center gap-3 rounded-full pr-1.5 pl-4 text-[13px]'
          >
            <span className='flex items-center gap-1'>
              <MotionNumber value={hiddenCount} className='font-medium' />
              <span className='text-muted-foreground'>
                {hiddenLabelOf(hiddenCount)}
              </span>
            </span>
            <Button variant='secondary' size='sm' onClick={onClear}>
              <XIcon />
              Clear filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
