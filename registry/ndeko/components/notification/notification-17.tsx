'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

import { surfaceCollapseOf } from './_parts/collapse';

const LINK = [
  'text-foreground rounded-sm font-medium underline-offset-4 hover:underline',
  FOCUS_RING,
].join(' ');

export default function Notification17() {
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
          className='surface-raised flex w-full max-w-100 items-start gap-3 overflow-hidden rounded-2xl p-4'
          variants={leaveVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
        >
          <Avatar className='size-9'>
            <AvatarFallback>AO</AvatarFallback>
          </Avatar>
          <div className='flex grow flex-col gap-3'>
            <div className='flex flex-col gap-1 text-[13px] leading-5'>
              <p className='text-muted-foreground'>
                <a href='#' className={LINK}>
                  Amara Okafor
                </a>{' '}
                invited you to{' '}
                <a href='#' className={LINK}>
                  Atlas Redesign
                </a>
                .
              </p>
              <p className='text-muted-foreground text-xs'>2 min ago</p>
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
