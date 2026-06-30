'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldDescription, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

type ModifierEvent = { getModifierState: (key: 'CapsLock') => boolean };

const LINE = 'flex h-5 items-center gap-1.5';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LINE_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function lineVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LINE_VARIANTS;
}

function isCapsLockOnIn(event: ModifierEvent) {
  return event.getModifierState('CapsLock');
}

function lineToneOf(showsWarning: boolean) {
  if (showsWarning) {
    return 'text-warning-foreground';
  }
  return '';
}

function HintLine({ showsWarning }: { showsWarning: boolean }) {
  if (showsWarning) {
    return (
      <>
        <TriangleAlertIcon className='size-3.5' />
        <Kbd>Caps Lock</Kbd>
        is on
      </>
    );
  }
  return 'Use 12 or more characters';
}

export default function Input61() {
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const lineVariants = lineVariantsOf(shouldReduceMotion);
  const showsWarning = isCapsLockOn && isFocused;
  const lineKey = String(showsWarning);

  function readCapsLock(event: ModifierEvent) {
    setIsCapsLockOn(isCapsLockOnIn(event));
  }

  function markFocused() {
    setIsFocused(true);
  }

  function markBlurred() {
    setIsFocused(false);
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Password</FieldLabel>
      <Input
        type='password'
        autoComplete='current-password'
        placeholder='Enter your password'
        onKeyDown={readCapsLock}
        onKeyUp={readCapsLock}
        onPointerDown={readCapsLock}
        onFocus={markFocused}
        onBlur={markBlurred}
      />
      <FieldDescription className='relative flex'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={lineKey}
            className={cn(LINE, lineToneOf(showsWarning))}
            variants={lineVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <HintLine showsWarning={showsWarning} />
          </motion.span>
        </AnimatePresence>
      </FieldDescription>
      <span className='sr-only' role='status'>
        {showsWarning && 'Caps Lock is on'}
      </span>
    </Field>
  );
}
