'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Textarea } from '@/registry/ndeko/ui/textarea';

type SubmitState = 'idle' | 'sending' | 'sent';

const SENDING_DURATION_MS = 1000;

const LINK = [
  'text-primary-ink rounded-sm font-medium underline-offset-4 hover:underline',
  FOCUS_RING,
].join(' ');

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const SHIFT_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

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

function shiftTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return SHIFT_TRANSITION;
}

function submitViewOf(state: SubmitState) {
  if (state === 'sending') {
    return {
      key: 'sending',
      icon: <LoaderCircleIcon className='animate-spin' />,
      label: 'Sending…',
    };
  }
  if (state === 'sent') {
    return { key: 'sent', icon: <CheckIcon />, label: 'Feedback sent' };
  }
  return { key: 'idle', icon: null, label: 'Send feedback' };
}

export default function Dialog10() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const shiftTransition = shiftTransitionOf(shouldReduceMotion);
  const submitView = submitViewOf(submitState);
  const hasIcon = submitView.icon !== null;
  const isIdle = submitState === 'idle';

  useEffect(() => {
    if (submitState !== 'sending') {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSubmitState('sent');
    }, SENDING_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [submitState]);

  function resetOnOpen(open: boolean) {
    if (open) {
      setSubmitState('idle');
    }
  }

  function sendFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIdle) {
      return;
    }
    setSubmitState('sending');
  }

  return (
    <Dialog onOpenChange={resetOnOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        Send feedback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send us feedback</DialogTitle>
          <DialogDescription>
            Watch the{' '}
            <a href='#' className={LINK}>
              tutorials
            </a>
            , read the{' '}
            <a href='#' className={LINK}>
              documentation
            </a>{' '}
            or ask the{' '}
            <a href='#' className={LINK}>
              community forum
            </a>{' '}
            for help.
          </DialogDescription>
        </DialogHeader>
        <form className='flex flex-col gap-4' onSubmit={sendFeedback}>
          <Textarea
            aria-label='Feedback'
            placeholder='What should we improve first?'
            readOnly={!isIdle}
            required
          />
          <div className='flex flex-col sm:flex-row sm:justify-end'>
            <Button
              type='submit'
              size='lg'
              className='min-w-36 data-disabled:opacity-100'
              disabled={!isIdle}
              focusableWhenDisabled
            >
              <AnimatePresence mode='popLayout' initial={false}>
                {hasIcon && (
                  <motion.span
                    key={submitView.key}
                    className='flex'
                    variants={iconVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    {submitView.icon}
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.span
                layout
                transition={shiftTransition}
                className='relative flex'
                aria-live='polite'
              >
                <AnimatePresence mode='popLayout' initial={false}>
                  <motion.span
                    key={submitView.key}
                    className='flex'
                    variants={labelVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    {submitView.label}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
