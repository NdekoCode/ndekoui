'use client';

import { useAnimate, useReducedMotion } from 'motion/react';
import { useId } from 'react';

import { BellIcon, CheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { isEmail, type Subscription } from './session';

const MORPH: Record<Subscription, MorphState> = {
  idle: 'idle',
  invalid: 'idle',
  busy: 'busy',
  done: 'done',
};

const LABELS: Record<MorphState, string> = {
  idle: 'Subscribe',
  busy: 'Subscribing',
  done: 'Subscribed',
};

const NUDGE = { x: [0, -4, 4, 0] };

const NUDGE_TIMING = { duration: 0.28 };

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function describedByOf(isInvalid: boolean, errorId: string) {
  if (isInvalid) {
    return errorId;
  }
  return undefined;
}

type SubscribeProps = {
  email: string;
  subscription: Subscription;
  isPressed: boolean;
  onEmailChange: (text: string) => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
};

export function Subscribe({
  email,
  subscription,
  isPressed,
  onEmailChange,
  onSubscribe,
  onUnsubscribe,
}: SubscribeProps) {
  const fieldId = useId();
  const errorId = useId();
  const shouldReduceMotion = useReducedMotion();
  const [fieldRef, animate] = useAnimate<HTMLDivElement>();
  const isInvalid = subscription === 'invalid';
  const isDone = subscription === 'done';
  const isLocked = subscription === 'busy' || isDone;

  /** A refused address nudges the field 4px once; reduced motion keeps the message only. */
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isRefused = !isEmail(email);
    if (isRefused && !shouldReduceMotion) {
      animate(fieldRef.current, NUDGE, NUDGE_TIMING);
    }
    onSubscribe();
  }

  return (
    <section
      aria-label='Subscribe to updates'
      className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-3 rounded-xl p-4'
    >
      <div className='flex items-start gap-3'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <BellIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h2 className='text-sm font-medium'>Subscribe to updates</h2>
          <p className='text-muted-foreground text-xs'>
            One email when an incident opens and one when it is resolved
          </p>
        </div>
      </div>
      <form
        noValidate
        onSubmit={submit}
        className='flex flex-col gap-2 @sm:flex-row @sm:items-start'
      >
        <div ref={fieldRef} className='flex min-w-0 flex-1 flex-col'>
          <label htmlFor={fieldId} className='sr-only'>
            Email for updates
          </label>
          <Input
            id={fieldId}
            type='email'
            inputMode='email'
            autoComplete='email'
            placeholder='you@company.com'
            value={email}
            disabled={isLocked}
            aria-invalid={isInvalid}
            aria-describedby={describedByOf(isInvalid, errorId)}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>
        <MorphButton
          type='submit'
          state={MORPH[subscription]}
          labels={LABELS}
          className={pressedSolidOf(isPressed)}
        />
      </form>
      <div aria-live='polite'>
        <Fold open={isInvalid}>
          <p id={errorId} className='text-destructive-ink text-xs'>
            Enter an address like name@company.com
          </p>
        </Fold>
        <Fold open={isDone}>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
            <p className='flex min-w-0 items-center gap-1.5 text-xs'>
              <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
              <span className='truncate'>Updates go to {email}</span>
            </p>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onUnsubscribe}
              className='text-muted-foreground -my-1'
            >
              Unsubscribe
            </Button>
          </div>
        </Fold>
      </div>
    </section>
  );
}
