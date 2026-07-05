'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Field, FieldError, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { HERO } from './data';

type Status = 'idle' | 'submitting' | 'confirmed';

const SUBMIT_DELAY_MS = 900;

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
    return 'Enter your email address to join the beta';
  }
  const isEmailShaped = EMAIL_PATTERN.test(trimmed);
  if (!isEmailShaped) {
    return 'Check the address, it should look like name@example.com';
  }
  return null;
}

function submitLabelOf(isSubmitting: boolean) {
  if (isSubmitting) {
    return 'Joining';
  }
  return 'Join the beta';
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

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const panelVariants = panelVariantsOf(shouldReduceMotion);
  const spinnerVariants = spinnerVariantsOf(shouldReduceMotion);
  const labelTransition = labelTransitionOf(shouldReduceMotion);
  const isSubmitting = status === 'submitting';
  const isConfirmed = status === 'confirmed';
  const hasError = error !== null;
  const submitLabel = submitLabelOf(isSubmitting);
  const trimmedEmail = email.trim();

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('confirmed');
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
    <AnimatedSize className='w-full max-w-md' contentClassName='relative'>
      <AnimatePresence mode='popLayout' initial={false}>
        {isConfirmed && (
          <motion.div
            key='confirmation'
            role='status'
            variants={panelVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={PANEL_TRANSITION}
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex items-start gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <StatusOrb tone='success' />
            <div className='flex min-w-0 flex-col items-start gap-1'>
              <p className='text-sm font-medium'>Check your inbox</p>
              <p className='text-muted-foreground text-[13px]'>
                We sent a confirmation link to{' '}
                <span className='text-foreground font-medium break-all'>
                  {trimmedEmail}
                </span>
                . Open it to keep your place in the beta.
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
        {!isConfirmed && (
          <motion.form
            key='form'
            noValidate
            onSubmit={submit}
            variants={panelVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={PANEL_TRANSITION}
            className='flex flex-col gap-2'
          >
            <Field invalid={hasError}>
              <FieldLabel className='sr-only'>Email address</FieldLabel>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <Input
                  ref={inputRef}
                  type='email'
                  name='email'
                  size='lg'
                  autoComplete='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={changeEmail}
                  readOnly={isSubmitting}
                />
                <Button
                  type='submit'
                  size='lg'
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
            </Field>
            <p className='text-muted-foreground text-xs'>{HERO.note}</p>
          </motion.form>
        )}
      </AnimatePresence>
    </AnimatedSize>
  );
}
