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
import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const MAX_LENGTH = 180;
const NEAR_LIMIT = 20;
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

function counterToneOf(remaining: number) {
  if (remaining === 0) {
    return 'text-destructive-ink';
  }
  if (remaining <= NEAR_LIMIT) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

function remainingLabelOf(remaining: number) {
  if (remaining === 0) {
    return 'No characters left';
  }
  if (remaining === 1) {
    return '1 character left';
  }
  return `${remaining} characters left`;
}

function remainingFigureOf(remaining: number) {
  if (remaining === 0) {
    return 'No';
  }
  return String(remaining);
}

function remainingWordsOf(remaining: number) {
  if (remaining === 1) {
    return 'character left';
  }
  return 'characters left';
}

export default function Textarea16() {
  const id = useId();
  const counterId = `${id}-counter`;
  const [direction, setDirection] = useState(-1);
  const { value, characterCount, handleChange, maxLength } = useCharacterLimit({
    maxLength: MAX_LENGTH,
  });
  const shouldReduceMotion = usePrefersReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const remaining = maxLength - characterCount;

  function changeBio(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextRemaining = maxLength - event.currentTarget.value.length;
    setDirection(directionOf(remaining, nextRemaining));
    handleChange(event);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Bio</Label>
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={changeBio}
        placeholder='A few words about you'
        aria-describedby={counterId}
      />
      <p
        id={counterId}
        className={cn(
          'text-end text-xs tabular-nums transition-colors duration-150',
          counterToneOf(remaining)
        )}
      >
        <span className='sr-only'>{remainingLabelOf(remaining)}</span>
        <span aria-hidden='true'>
          <span className='relative inline-flex'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={direction}
            >
              <motion.span
                key={remaining}
                className='inline-flex'
                custom={direction}
                variants={digitVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={DIGIT_TRANSITION}
              >
                {remainingFigureOf(remaining)}
              </motion.span>
            </AnimatePresence>
          </span>{' '}
          {remainingWordsOf(remaining)}
        </span>
      </p>
    </div>
  );
}
