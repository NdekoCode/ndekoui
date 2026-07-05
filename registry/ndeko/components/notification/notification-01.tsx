'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { surfaceCollapseOf } from './_parts/collapse';

export default function Notification01() {
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
          className='surface-raised flex w-full max-w-100 items-center gap-3 overflow-hidden rounded-2xl py-2.5 ps-3.5 pe-2'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
        >
          <StatusOrb tone='warning' size='sm' />
          <p className='grow text-[13px] leading-5'>
            Some required fields are still empty.
          </p>
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
