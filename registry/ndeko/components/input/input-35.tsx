'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState, type ChangeEvent } from 'react';

import { useCharacterLimit } from '@/registry/ndeko/hooks/use-character-limit';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { Field, FieldDescription, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const MAX_LENGTH = 8;
const DIGIT_SHIFT_PX = 8;

const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next < previous) {
    return -1;
  }
  return 1;
}

function characterWordOf(count: number) {
  if (count === 1) {
    return 'character';
  }
  return 'characters';
}

export default function Input35() {
  const [direction, setDirection] = useState(-1);
  const { value, characterCount, handleChange, maxLength } = useCharacterLimit({
    maxLength: MAX_LENGTH,
  });
  const shouldReduceMotion = usePrefersReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const charactersLeft = maxLength - characterCount;
  const characterWord = characterWordOf(charactersLeft);

  function changeCode(event: ChangeEvent<HTMLInputElement>) {
    const nextLeft = maxLength - event.currentTarget.value.length;
    setDirection(directionOf(charactersLeft, nextLeft));
    handleChange(event);
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Promo code</FieldLabel>
      <Input
        placeholder='SPRING24'
        value={value}
        maxLength={maxLength}
        onChange={changeCode}
      />
      <FieldDescription>
        <span className='flex items-center gap-1' aria-hidden='true'>
          <span className='relative flex tabular-nums'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={direction}
            >
              <motion.span
                key={charactersLeft}
                className='flex'
                custom={direction}
                variants={digitVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={DIGIT_TRANSITION}
              >
                {charactersLeft}
              </motion.span>
            </AnimatePresence>
          </span>
          {characterWord} left
        </span>
        <span className='sr-only' role='status'>
          {charactersLeft} {characterWord} left
        </span>
      </FieldDescription>
    </Field>
  );
}
