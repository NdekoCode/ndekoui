'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { DownloadIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const UPDATE_DURATION_MS = 2000;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const SHIFT_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function shiftTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return SHIFT_TRANSITION;
}

function updateStateOf(isUpdating: boolean) {
  if (isUpdating) {
    return {
      key: 'updating',
      icon: <LoaderCircleIcon className='animate-spin' />,
      label: 'Updating…',
    };
  }
  return { key: 'idle', icon: <DownloadIcon />, label: 'Update now' };
}

export default function Banner12() {
  const [isUpdating, setIsUpdating] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const shiftTransition = shiftTransitionOf(shouldReduceMotion);
  const updateState = updateStateOf(isUpdating);

  useEffect(() => {
    if (!isUpdating) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsUpdating(false);
    }, UPDATE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isUpdating]);

  function startUpdate() {
    setIsUpdating(true);
  }

  return (
    <div className='bg-info/10 text-info-foreground hairline-ring ring-info/20 w-full rounded-xl px-4 py-3'>
      <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2'>
        <p className='text-[13px]'>
          <span className='font-medium'>v2.1.0</span>
          <span className='mx-2 opacity-60' aria-hidden='true'>
            •
          </span>
          New features and improvements available
        </p>
        <Button
          variant='outline'
          size='sm'
          onClick={startUpdate}
          disabled={isUpdating}
          focusableWhenDisabled
          className='min-w-28'
        >
          <motion.span
            layout
            transition={shiftTransition}
            className='relative -ms-0.5 flex'
          >
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={updateState.key}
                className='flex'
                variants={swapVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {updateState.icon}
              </motion.span>
            </AnimatePresence>
          </motion.span>
          <span className='relative flex'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={updateState.key}
                className='flex'
                variants={labelVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {updateState.label}
              </motion.span>
            </AnimatePresence>
          </span>
        </Button>
      </div>
    </div>
  );
}
