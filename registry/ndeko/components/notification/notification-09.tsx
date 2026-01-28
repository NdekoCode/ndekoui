'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const LEAVE_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const LEAVE_VARIANTS: Variants = {
  shown: { opacity: 1, height: 'auto' },
  hidden: { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1 },
  hidden: { opacity: 0 },
};

function leaveVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LEAVE_VARIANTS;
}

export default function Notification09() {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const leaveVariants = leaveVariantsOf(shouldReduceMotion);

  function dismiss() {
    setIsVisible(false);
  }

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key='notification'
          role='status'
          className='surface-raised flex w-full max-w-100 items-center gap-3 overflow-hidden rounded-2xl py-2.5 ps-3.5 pe-2'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={LEAVE_TRANSITION}
        >
          <StatusOrb tone='success' size='sm' />
          <div className='flex grow items-center justify-between gap-4'>
            <p className='text-[13px] leading-5'>You moved 3 tasks to Done.</p>
            <Button size='sm' onClick={dismiss}>
              Undo
            </Button>
          </div>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Dismiss notification'
            className='text-muted-foreground'
            onClick={dismiss}
          >
            <XIcon />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
