'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import { Textarea } from '@/registry/ndeko/ui/textarea';

type SubmitState = 'idle' | 'sending' | 'sent';

const SENDING_DURATION_MS = 1000;

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const SEGMENT = [
  'relative flex h-8 flex-1 cursor-pointer items-center justify-center bg-card text-[13px] font-medium tabular-nums',
  'shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 transition-[color,background-color,box-shadow] duration-150',
  'rounded-none first:rounded-s-full last:rounded-e-full hover:bg-foreground/[0.03]',
  'has-data-checked:z-10 has-data-checked:bg-primary has-data-checked:text-primary-foreground has-data-checked:ring-(--ring-color)',
  '[--ring-color:color-mix(in_oklab,black_15%,var(--primary))] dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
  'has-focus-visible:z-10 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
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

export default function Dialog11() {
  const id = useId();
  const questionId = `${id}-question`;
  const scaleId = `${id}-scale`;
  const reasonId = `${id}-reason`;

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
        Rate your setup
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Help us improve</DialogTitle>
        </DialogHeader>
        <form className='flex flex-col gap-5' onSubmit={sendFeedback}>
          <div className='flex flex-col gap-3'>
            <span
              id={questionId}
              className='text-foreground text-[13px] leading-none font-medium'
            >
              How hard was it to set up your account?
            </span>
            <div className='flex flex-col gap-2'>
              <RadioGroup
                aria-labelledby={questionId}
                aria-describedby={scaleId}
                className='flex gap-0 -space-x-px'
              >
                {SCORES.map((score) => (
                  <label key={score} className={SEGMENT}>
                    <RadioGroupItem value={String(score)} className='sr-only' />
                    {score}
                  </label>
                ))}
              </RadioGroup>
              <div
                id={scaleId}
                className='text-muted-foreground flex justify-between text-xs'
              >
                <span>0 is very easy</span>
                <span>8 is very hard</span>
              </div>
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={reasonId}>Why did you give this rating?</Label>
            <Textarea
              id={reasonId}
              placeholder='The step that took the longest was...'
              readOnly={!isIdle}
            />
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
      </DialogContent>
    </Dialog>
  );
}
