'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import {
  CheckIcon,
  LoaderCircleIcon,
  MailIcon,
} from '@/registry/ndeko/lib/icons';
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
import { Input } from '@/registry/ndeko/ui/input';

type SubmitState = 'idle' | 'sending' | 'sent';

const SENDING_DURATION_MS = 1000;

const BRAND_STYLE = { '--gem': 'var(--primary)' } as React.CSSProperties;

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
      label: 'Subscribing…',
    };
  }
  if (state === 'sent') {
    return { key: 'sent', icon: <CheckIcon />, label: 'Subscribed' };
  }
  return { key: 'idle', icon: null, label: 'Subscribe' };
}

function AcmeMark() {
  return (
    <span
      aria-hidden='true'
      style={BRAND_STYLE}
      className='gem-plate flex size-10 shrink-0 items-center justify-center rounded-xl'
    >
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2.25}
        strokeLinecap='round'
        strokeLinejoin='round'
        className='size-5'
      >
        <path d='M12 4.5 20 19H4l8-14.5Z' />
        <path d='M8.75 14h6.5' />
      </svg>
    </span>
  );
}

export default function Dialog09() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const shouldReduceMotion = useReducedMotion();
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

  function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIdle) {
      return;
    }
    setSubmitState('sending');
  }

  return (
    <Dialog onOpenChange={resetOnOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        Subscribe to updates
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col items-center gap-4'>
          <AcmeMark />
          <DialogHeader className='px-8 text-center'>
            <DialogTitle>Never miss a release</DialogTitle>
            <DialogDescription>
              One email a month with new features and fixes. Unsubscribe in one
              click.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-3' onSubmit={subscribe}>
          <div className='relative'>
            <Input
              type='email'
              autoComplete='email'
              aria-label='Email'
              placeholder='you@company.com'
              className='peer ps-8'
              readOnly={!isIdle}
              required
            />
            <MailIcon className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 peer-disabled:opacity-50' />
          </div>
          <Button
            type='submit'
            size='lg'
            className='w-full data-disabled:opacity-100'
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
        </form>
        <p className='text-muted-foreground text-center text-xs'>
          By subscribing you agree to our{' '}
          <a href='#' className={LINK}>
            Privacy Policy
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
