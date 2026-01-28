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

export default function Notification14() {
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
          className='surface-raised flex w-full max-w-100 items-start gap-3 overflow-hidden rounded-2xl p-4'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={LEAVE_TRANSITION}
        >
          <StatusOrb tone='info' />
          <div className='flex grow flex-col gap-3 pt-1.5'>
            <div className='flex flex-col gap-1 text-[13px] leading-5'>
              <p className='font-medium'>Maintenance on Sunday</p>
              <p className='text-muted-foreground'>
                The workspace is read-only from 02:00 to 03:00 UTC while we
                upgrade the database.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button size='sm'>View status page</Button>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Dismiss notification'
            className='text-muted-foreground -me-1.5 -mt-1.5'
            onClick={dismiss}
          >
            <XIcon />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
