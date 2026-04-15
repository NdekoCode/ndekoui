'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { NEWSLETTER } from './data';

type Status = 'idle' | 'submitting' | 'subscribed';

const SUBMIT_DELAY_MS = 800;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PANEL_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

const LABEL_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

const INSTANT: Transition = { duration: 0 };

const PANEL_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
};

const SPINNER_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function emailErrorOf(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 'Enter an email address to subscribe';
  }
  const isEmailShaped = EMAIL_PATTERN.test(trimmed);
  if (!isEmailShaped) {
    return 'Check the address, it should look like name@example.com';
  }
  return null;
}

function submitLabelOf(isSubmitting: boolean) {
  if (isSubmitting) {
    return 'Subscribing';
  }
  return 'Subscribe';
}

function panelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return PANEL_VARIANTS;
}

function spinnerVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SPINNER_VARIANTS;
}

function labelTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LABEL_TRANSITION;
}

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelVariants = panelVariantsOf(shouldReduceMotion);
  const spinnerVariants = spinnerVariantsOf(shouldReduceMotion);
  const labelTransition = labelTransitionOf(shouldReduceMotion);
  const isSubmitting = status === 'submitting';
  const isSubscribed = status === 'subscribed';
  const hasError = error !== null;
  const submitLabel = submitLabelOf(isSubmitting);
  const trimmedEmail = email.trim();

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('subscribed');
    }, SUBMIT_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isSubmitting]);

  function changeEmail(event: React.ChangeEvent<HTMLInputElement>) {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    if (hasTriedSubmit) {
      setError(emailErrorOf(nextEmail));
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = emailErrorOf(email);
    setHasTriedSubmit(true);
    setError(nextError);
    if (nextError) {
      inputRef.current?.focus();
      return;
    }
    setStatus('submitting');
  }

  function startOver() {
    setEmail('');
    setError(null);
    setHasTriedSubmit(false);
    setStatus('idle');
  }

  return (
    <AnimatedSize className='w-full max-w-sm' contentClassName='relative'>
      <AnimatePresence mode='popLayout' initial={false}>
        {isSubscribed && (
          <motion.div
            key='subscribed'
            role='status'
            variants={panelVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={PANEL_TRANSITION}
            className='flex items-start gap-3'
          >
            <StatusOrb tone='success' size='sm' />
            <div className='flex min-w-0 flex-col items-start gap-0.5'>
              <p className='text-[13px] font-medium'>You are subscribed</p>
              <p className='text-muted-foreground text-[13px]'>
                The next update goes to{' '}
                <span className='text-foreground font-medium break-all'>
                  {trimmedEmail}
                </span>
                .
              </p>
              <Button
                variant='link'
                size='sm'
                className='h-auto px-0 py-0.5'
                onClick={startOver}
              >
                Use another address
              </Button>
            </div>
          </motion.div>
        )}
        {!isSubscribed && (
          <motion.form
            key='form'
            noValidate
            onSubmit={submit}
            variants={panelVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={PANEL_TRANSITION}
          >
            <Field invalid={hasError}>
              <FieldLabel>{NEWSLETTER.label}</FieldLabel>
              <div className='flex gap-2'>
                <Input
                  ref={inputRef}
                  type='email'
                  name='email'
                  autoComplete='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={changeEmail}
                  readOnly={isSubmitting}
                />
                <Button
                  type='submit'
                  variant='outline'
                  disabled={isSubmitting}
                  focusableWhenDisabled
                  className='data-disabled:opacity-100'
                >
                  <AnimatePresence mode='popLayout' initial={false}>
                    {isSubmitting && (
                      <motion.span
                        key='spinner'
                        className='flex'
                        variants={spinnerVariants}
                        initial='enter'
                        animate='visible'
                        exit='exit'
                        transition={PANEL_TRANSITION}
                      >
                        <LoaderCircleIcon className='animate-spin' />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.span layout transition={labelTransition}>
                    {submitLabel}
                  </motion.span>
                </Button>
              </div>
              {hasError && <FieldError match>{error}</FieldError>}
              {!hasError && (
                <FieldDescription>{NEWSLETTER.description}</FieldDescription>
              )}
            </Field>
          </motion.form>
        )}
      </AnimatePresence>
    </AnimatedSize>
  );
}
