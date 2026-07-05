'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, TrashIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

type RemoveStatus = 'idle' | 'confirming' | 'removed';

const CONFIRM_WINDOW_MS = 3000;
const REMOVED_RESET_MS = 2000;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const COUNTDOWN_TRANSITION: Transition = {
  duration: CONFIRM_WINDOW_MS / 1000,
  ease: 'linear',
};

const ICON_VARIANTS: Variants = {
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

const STATES: Record<
  RemoveStatus,
  {
    icon: React.ReactNode;
    label: string;
    variant: 'outline' | 'destructive';
    announcement: string;
  }
> = {
  idle: {
    icon: <TrashIcon className='opacity-60 transition-opacity duration-150' />,
    label: 'Remove member',
    variant: 'outline',
    announcement: '',
  },
  confirming: {
    icon: <TrashIcon className='transition-opacity duration-150' />,
    label: 'Press again to remove',
    variant: 'destructive',
    announcement: 'Press again within 3 seconds to remove Tomas Varga',
  },
  removed: {
    icon: <CheckIcon />,
    label: 'Removed',
    variant: 'outline',
    announcement: 'Tomas Varga was removed',
  },
};

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

export default function Button64() {
  const [status, setStatus] = useState<RemoveStatus>('idle');
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const state = STATES[status];
  const isConfirming = status === 'confirming';
  const isRemoved = status === 'removed';
  const iconKey = String(isRemoved);
  const showsCountdown = isConfirming && !shouldReduceMotion;

  useEffect(() => {
    if (!isConfirming) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('idle');
    }, CONFIRM_WINDOW_MS);
    return () => window.clearTimeout(timeout);
  }, [isConfirming]);

  useEffect(() => {
    if (!isRemoved) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('idle');
    }, REMOVED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isRemoved]);

  function advance() {
    if (isConfirming) {
      setStatus('removed');
      return;
    }
    setStatus('confirming');
  }

  function cancelConfirmation() {
    if (!isConfirming) {
      return;
    }
    setStatus('idle');
  }

  function cancelOnEscape(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    cancelConfirmation();
  }

  return (
    <>
      <Button
        variant={state.variant}
        onClick={advance}
        onKeyDown={cancelOnEscape}
        onBlur={cancelConfirmation}
        disabled={isRemoved}
        focusableWhenDisabled
        className='overflow-hidden data-disabled:opacity-100'
      >
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={iconKey}
              className='flex'
              variants={iconVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {state.icon}
            </motion.span>
          </AnimatePresence>
        </span>
        <AnimatedSize axis='width' as='span' contentClassName='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={status}
              className='flex'
              variants={labelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {state.label}
            </motion.span>
          </AnimatePresence>
        </AnimatedSize>
        {showsCountdown && (
          <motion.span
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/45'
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={COUNTDOWN_TRANSITION}
          />
        )}
      </Button>
      <span className='sr-only' role='status'>
        {state.announcement}
      </span>
    </>
  );
}
