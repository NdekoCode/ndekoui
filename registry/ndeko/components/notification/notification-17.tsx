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
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

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

const LINK = [
  'text-foreground rounded-sm font-medium underline-offset-4 hover:underline',
  FOCUS_RING,
].join(' ');

function leaveVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LEAVE_VARIANTS;
}

export default function Notification17() {
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
