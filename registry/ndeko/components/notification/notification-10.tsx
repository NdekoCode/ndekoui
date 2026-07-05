'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { surfaceCollapseOf } from './_parts/collapse';

const TEXT_ACTION = 'h-auto px-0 text-[13px] leading-5';

export default function Notification10() {
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
          className='surface-raised flex w-full max-w-100 items-center gap-3 overflow-hidden rounded-2xl py-2.5 ps-3.5 pe-2'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
        >
          <StatusOrb tone='success' size='sm' />
          <div className='flex grow items-center justify-between gap-4'>
            <p className='text-[13px] leading-5'>Message sent</p>
            <div className='flex items-center gap-1.5 whitespace-nowrap'>
              <Button variant='link' size='sm' className={TEXT_ACTION}>
                View
              </Button>
              <span aria-hidden='true' className='text-muted-foreground'>
                ·
              </span>
              <Button
                variant='link'
                size='sm'
                className={TEXT_ACTION}
                onClick={dismiss}
              >
                Undo
              </Button>
            </div>
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
