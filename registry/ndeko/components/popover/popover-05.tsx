'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

const TIPS = [
  {
    title: 'Welcome to your dashboard',
    description:
      'This is your new workspace. Your projects, recent activity and settings all live here.',
  },
  {
    title: 'Quick actions',
    description:
      'Use the toolbar above to create a project, invite a teammate or open the settings.',
  },
  {
    title: 'Need help?',
    description:
      'The support icon in the top right corner opens the help center and the documentation.',
  },
];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const TEXT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function textVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TEXT_VARIANTS;
}

function nextLabelOf(isLastTip: boolean) {
  if (isLastTip) {
    return 'Start over';
  }
  return 'Next';
}

export default function Popover05() {
  const [tipIndex, setTipIndex] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const textVariants = textVariantsOf(shouldReduceMotion);
  const tip = TIPS[tipIndex];
  const tipNumber = tipIndex + 1;
  const isLastTip = tipNumber === TIPS.length;
  const nextLabel = nextLabelOf(isLastTip);

  function showNextTip() {
    if (isLastTip) {
      setTipIndex(0);
      return;
    }
    setTipIndex(tipIndex + 1);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        Show tips
      </PopoverTrigger>
      <PopoverContent side='top' className='flex w-64 flex-col gap-3 p-3'>
        <AnimatedSize contentClassName='relative flex' aria-live='polite'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div
              key={tipIndex}
              className='flex flex-col gap-1'
              variants={textVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <p className='font-medium'>{tip.title}</p>
              <p className='text-muted-foreground text-xs'>{tip.description}</p>
            </motion.div>
          </AnimatePresence>
        </AnimatedSize>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground flex text-xs tabular-nums'>
            <MotionNumber value={tipNumber} />/{TIPS.length}
          </span>
          <Button
            variant='link'
            size='sm'
            onClick={showNextTip}
            className='h-auto p-0 text-xs'
          >
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={nextLabel}
                className='flex'
                variants={textVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {nextLabel}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
