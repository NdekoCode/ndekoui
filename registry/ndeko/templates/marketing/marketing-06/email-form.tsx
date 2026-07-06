'use client';

import { useAnimate } from 'motion/react';
import { useEffect, useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Input } from '@/registry/ndeko/ui/input';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { SECTION } from './cta-data';
import type { FormStatus } from './cta-session';

const LABELS: Record<MorphState, string> = {
  idle: 'Start your first close',
  busy: 'Sending',
  done: 'Sent',
};

const NUDGE = { x: [0, -4, 4, -2, 0] };

const NUDGE_TRANSITION = { duration: 0.3 };

function morphStateOf(form: FormStatus): MorphState {
  if (form === 'sending') {
    return 'busy';
  }
  if (form === 'sent') {
    return 'done';
  }
  return 'idle';
}

function describedByOf(isInvalid: boolean, hintId: string) {
  if (isInvalid) {
    return hintId;
  }
  return undefined;
}

type EmailFormProps = {
  email: string;
  form: FormStatus;
  attempts: number;
  sentTo: string;
  isPressed: boolean;
  onType: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function EmailForm({
  email,
  form,
  attempts,
  sentTo,
  isPressed,
  onType,
  onSubmit,
  onReset,
}: EmailFormProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [fieldRef, animate] = useAnimate<HTMLDivElement>();
  const hintId = useId();
  const inputId = useId();
  const isInvalid = form === 'invalid';
  const isSent = form === 'sent';
  const isLocked = form === 'sending' || isSent;
  const describedBy = describedByOf(isInvalid, hintId);
  const morphState = morphStateOf(form);

  useEffect(() => {
    const isRefusal = attempts > 0;
    if (!isRefusal || shouldReduceMotion) {
      return;
    }
    animate(fieldRef.current, NUDGE, NUDGE_TRANSITION);
  }, [attempts, shouldReduceMotion, animate, fieldRef]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className='@container flex flex-col gap-2'
    >
      <div className='flex flex-col gap-2 @md:flex-row'>
        <div ref={fieldRef} className='min-w-0 flex-1'>
          <label htmlFor={inputId} className='sr-only'>
            {SECTION.emailLabel}
          </label>
          <Input
            id={inputId}
            name='email'
            type='email'
            size='lg'
            autoComplete='email'
            placeholder={SECTION.placeholder}
            value={email}
            readOnly={isLocked}
            aria-invalid={isInvalid}
            aria-describedby={describedBy}
            onChange={(event) => onType(event.target.value)}
          />
        </div>
        <MorphButton
          type='submit'
          size='lg'
          state={morphState}
          labels={LABELS}
          idleIcon={<ArrowRightIcon />}
          className={cn('shrink-0', pressedSolidOf(isPressed))}
        />
      </div>
      <Fold open={isInvalid}>
        <p id={hintId} className='text-destructive-ink text-xs'>
          Enter an address like name@company.com
        </p>
      </Fold>
      <Fold open={isSent}>
        <div className='flex items-center gap-2 pt-1 text-[13px]'>
          {isSent && <DrawnCheck tone='success' entrance='draw' />}
          <span className='text-muted-foreground min-w-0 flex-1 truncate'>
            We sent a sign-in link to {sentTo}
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onReset}
            className='shrink-0'
          >
            Use another email
          </Button>
        </div>
      </Fold>
    </form>
  );
}
