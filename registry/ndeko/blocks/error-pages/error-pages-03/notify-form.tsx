'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Input } from '@/registry/ndeko/ui/input';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import type { NotifyState, NotifyStatus } from './session';

const SUBMIT_STATE: Record<NotifyStatus, MorphState> = {
  idle: 'idle',
  saving: 'busy',
  confirmed: 'done',
};

const SUBMIT_LABELS: Record<MorphState, string> = {
  idle: 'Notify me',
  busy: 'Saving',
  done: 'Saved',
};

const NUDGE = { x: [0, -4, 4, -2, 0] };

const STILL = { x: 0 };

const NUDGE_TIMING = { duration: 0.32 };

function nudgeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return NUDGE;
}

function describedByOf(hasError: boolean, hintId: string) {
  if (hasError) {
    return hintId;
  }
  return undefined;
}

type NotifyFormProps = {
  state: NotifyState;
  pressed: string | null;
  onType: (value: string) => void;
  onSubmit: () => void;
  onEdit: () => void;
};

export function NotifyForm({
  state,
  pressed,
  onType,
  onSubmit,
  onEdit,
}: NotifyFormProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const fieldId = useId();
  const hintId = useId();
  const isConfirmed = state.status === 'confirmed';
  const isSaving = state.status === 'saving';
  const hasError = state.error !== null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <AnimatedSize>
      {!isConfirmed && (
        <form noValidate onSubmit={submit} className='flex flex-col gap-2.5'>
          <label htmlFor={fieldId} className='text-[13px] font-medium'>
            Email me when booking opens again
          </label>
          <div className='flex flex-col gap-2 @sm:flex-row'>
            <Input
              id={fieldId}
              data-notify-field
              type='email'
              inputMode='email'
              autoComplete='email'
              spellCheck={false}
              placeholder='you@clinic.com'
              value={state.email}
              readOnly={isSaving}
              aria-invalid={hasError}
              aria-describedby={describedByOf(hasError, hintId)}
              onChange={(event) => onType(event.target.value)}
              size='lg'
              className='@sm:flex-1'
            />
            <MorphButton
              type='submit'
              size='lg'
              state={SUBMIT_STATE[state.status]}
              labels={SUBMIT_LABELS}
              className={pressedSolidOf(pressed === 'notify')}
            />
          </div>
          {hasError && (
            <motion.p
              key={state.refusals}
              id={hintId}
              initial={STILL}
              animate={nudgeOf(shouldReduceMotion)}
              transition={NUDGE_TIMING}
              className='text-destructive-ink text-xs'
            >
              {state.error}
            </motion.p>
          )}
          {!hasError && (
            <p className='text-muted-foreground text-xs'>
              One email, then the address is deleted.
            </p>
          )}
        </form>
      )}
      {isConfirmed && (
        <div className='flex items-start gap-2.5 transition-opacity duration-200 starting:opacity-0'>
          <DrawnCheck
            tone='success'
            entrance='draw'
            pace='calm'
            className='mt-px'
          />
          <div className='flex min-w-0 flex-col items-start gap-1'>
            <p
              data-notify-done
              tabIndex={-1}
              className={cn('rounded-sm text-sm font-medium', FOCUS_RING)}
            >
              You are on the list
            </p>
            <p className='text-muted-foreground text-[13px] text-pretty'>
              We will email{' '}
              <span className='text-foreground font-medium break-all'>
                {state.email.trim()}
              </span>{' '}
              once, when booking opens again.
            </p>
            <button
              type='button'
              onClick={onEdit}
              className={cn(
                'text-primary-ink mt-1 rounded-sm text-xs font-medium underline-offset-4 hover:underline',
                FOCUS_RING
              )}
            >
              Use another address
            </button>
          </div>
        </div>
      )}
    </AnimatedSize>
  );
}
