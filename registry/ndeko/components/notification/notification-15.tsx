'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { surfaceCollapseOf } from './_parts/collapse';

export default function Notification15() {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const leaveVariants = surfaceCollapseOf(shouldReduceMotion);

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
        >
          <div className='flex grow flex-col gap-3'>
            <div className='flex flex-col gap-1 text-[13px] leading-5'>
              <p className='font-medium'>We value your privacy</p>
              <p className='text-muted-foreground'>
                We use cookies to keep you signed in and to learn what to
                improve. You can refuse the ones that are not essential.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button size='sm' onClick={dismiss}>
                Accept
              </Button>
              <Button size='sm' variant='outline' onClick={dismiss}>
                Decline
              </Button>
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
