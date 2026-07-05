'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState, type ChangeEvent } from 'react';

import { useCharacterLimit } from '@/registry/ndeko/hooks/use-character-limit';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const MAX_LENGTH = 50;
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

export default function Input34() {
  const counterId = useId();
  const [direction, setDirection] = useState(1);
  const { value, characterCount, handleChange, maxLength } = useCharacterLimit({
    maxLength: MAX_LENGTH,
  });
  const shouldReduceMotion = usePrefersReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);

  function changeHeadline(event: ChangeEvent<HTMLInputElement>) {
    const nextLength = event.currentTarget.value.length;
    setDirection(directionOf(characterCount, nextLength));
    handleChange(event);
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Headline</FieldLabel>
      <div className='relative'>
        <Input
          className='peer pe-14'
          placeholder='Say what your team ships'
          value={value}
          maxLength={maxLength}
          onChange={changeHeadline}
          aria-describedby={counterId}
        />
        <span
          className='text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-xs tabular-nums peer-disabled:opacity-50'
          aria-hidden='true'
        >
          <span className='relative flex'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={direction}
            >
              <motion.span
                key={characterCount}
                className='flex'
                custom={direction}
                variants={digitVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={DIGIT_TRANSITION}
              >
                {characterCount}
              </motion.span>
            </AnimatePresence>
          </span>
          /{maxLength}
        </span>
        <span id={counterId} className='sr-only' role='status'>
          {characterCount} of {maxLength} characters used
        </span>
      </div>
    </Field>
  );
}
