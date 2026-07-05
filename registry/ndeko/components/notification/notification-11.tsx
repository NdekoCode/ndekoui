'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { surfaceCollapseOf } from './_parts/collapse';

export default function Notification11() {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = usePrefersReducedMotion();
  const leaveVariants = surfaceCollapseOf(shouldReduceMotion);

  function dismiss() {
    setIsVisible(false);
  }

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key='notification'
          role='alert'
          className='surface-raised flex w-full max-w-100 items-start gap-3 overflow-hidden rounded-2xl p-4'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
        >
          <StatusOrb tone='warning' />
          <div className='flex grow flex-col gap-3 pt-1.5'>
            <div className='flex flex-col gap-1 text-[13px] leading-5'>
              <p className='font-medium'>Your trial ends in 3 days</p>
              <p className='text-muted-foreground'>
                Add a payment method to keep your projects and their history
                after March 14.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button size='sm'>Add payment method</Button>
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
