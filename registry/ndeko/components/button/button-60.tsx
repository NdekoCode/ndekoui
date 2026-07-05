'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  LoaderCircleIcon,
  SendIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

type PublishStatus = 'idle' | 'publishing' | 'published';

const PUBLISH_DURATION_MS = 1400;
const PUBLISHED_RESET_MS = 2200;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

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
  PublishStatus,
  { icon: React.ReactNode; label: string; announcement: string }
> = {
  idle: {
    icon: <SendIcon className='opacity-60' />,
    label: 'Publish',
    announcement: '',
  },
  publishing: {
    icon: <LoaderCircleIcon className='animate-spin' />,
    label: 'Publishing',
    announcement: 'Publishing the post',
  },
  published: {
    icon: <CheckIcon />,
    label: 'Published',
    announcement: 'Post published',
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

export default function Button60() {
  const [status, setStatus] = useState<PublishStatus>('idle');
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const state = STATES[status];
  const isPublishing = status === 'publishing';
  const isPublished = status === 'published';
  const isBusy = status !== 'idle';

  useEffect(() => {
    if (!isPublishing) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('published');
    }, PUBLISH_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isPublishing]);

  useEffect(() => {
    if (!isPublished) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('idle');
    }, PUBLISHED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isPublished]);

  function publish() {
    setStatus('publishing');
  }

  return (
    <>
      <Button
        onClick={publish}
        disabled={isBusy}
        focusableWhenDisabled
        aria-busy={isPublishing}
        className='data-disabled:opacity-100'
      >
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={status}
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
      </Button>
      <span className='sr-only' role='status'>
        {state.announcement}
      </span>
    </>
  );
}
