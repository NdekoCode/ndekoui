'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState, type ChangeEvent } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldDescription, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

type MatchState = 'empty' | 'on-track' | 'mismatch' | 'match';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const MESSAGES: Record<MatchState, { text: string; tone: string }> = {
  empty: { text: 'Type the same password again', tone: '' },
  'on-track': { text: 'Type the same password again', tone: '' },
  mismatch: {
    text: 'Passwords do not match',
    tone: 'text-destructive-ink',
  },
  match: { text: 'Passwords match', tone: 'text-success-foreground' },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function matchStateOf(password: string, confirmation: string): MatchState {
  if (confirmation.length === 0) {
    return 'empty';
  }
  if (confirmation === password) {
    return 'match';
  }
  const isStillTyping = password.startsWith(confirmation);
  if (isStillTyping) {
    return 'on-track';
  }
  return 'mismatch';
}

function MatchGlyph({ state }: { state: MatchState }) {
  if (state === 'match') {
    return <CheckIcon className='text-success-foreground size-4' />;
  }
  return <XIcon className='text-destructive-ink size-4' />;
}

function announcementOf(state: MatchState) {
  const isSettled = state === 'match';
  const isWrong = state === 'mismatch';
  const isWorthAnnouncing = isSettled || isWrong;
  if (!isWorthAnnouncing) {
    return '';
  }
  return MESSAGES[state].text;
}

export default function Input62() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const state = matchStateOf(password, confirmation);
  const message = MESSAGES[state];
  const isMismatch = state === 'mismatch';
  const isMatch = state === 'match';
  const showsGlyph = isMismatch || isMatch;

  function changePassword(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  function changeConfirmation(event: ChangeEvent<HTMLInputElement>) {
    setConfirmation(event.currentTarget.value);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-4'>
      <Field>
        <FieldLabel>New password</FieldLabel>
        <Input
          type='password'
          autoComplete='new-password'
          placeholder='At least 12 characters'
          value={password}
          onChange={changePassword}
        />
      </Field>
      <Field invalid={isMismatch}>
        <FieldLabel>Confirm password</FieldLabel>
        <div className='relative'>
          <Input
            className='pe-8'
            type='password'
            autoComplete='new-password'
            placeholder='Repeat the password'
            value={confirmation}
            onChange={changeConfirmation}
          />
          <span
            aria-hidden='true'
            className='pointer-events-none absolute inset-y-0 end-2 flex items-center'
          >
            <AnimatePresence mode='popLayout' initial={false}>
              {showsGlyph && (
                <motion.span
                  key={state}
                  className='flex'
                  variants={swapVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  <MatchGlyph state={state} />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>
        <FieldDescription className={cn('transition-colors', message.tone)}>
          {message.text}
        </FieldDescription>
      </Field>
      <span className='sr-only' role='status'>
        {announcementOf(state)}
      </span>
    </div>
  );
}
