'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { RadioIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { surfaceCollapseOf } from './_parts/collapse';

export default function Notification18() {
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
          role='status'
          className='surface-raised flex w-full max-w-100 items-center gap-3 overflow-hidden rounded-2xl py-3 ps-4 pe-2'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
        >
          <StatusOrb tone='brand' glyph={<RadioIcon strokeWidth={2.25} />} />
          <div className='flex grow items-center justify-between gap-4'>
            <div className='flex flex-col gap-0.5'>
              <p className='text-[13px] leading-5 font-medium'>
                Live in 27 hours
              </p>
              <p className='text-muted-foreground text-xs'>
                November 20 at 8:00 PM
              </p>
            </div>
            <Button size='sm'>Notify me</Button>
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
