'use client';

import {
  NumberField,
  type NumberFieldRootChangeEventDetails,
} from '@base-ui/react/number-field';
import { useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

const INITIAL_STORAGE = 2048;
const DIGIT_SHIFT_PX = 8;
const STEP_SLIDE_MS = 180;
const STEP_SLIDE_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

const GROUP = cn(
  CONTROL_RECIPE,
  'flex h-8 items-stretch overflow-hidden',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]',
  'data-disabled:pointer-events-none data-disabled:opacity-50'
);

const STEP_BUTTON =
  'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground flex aspect-square h-full shrink-0 cursor-pointer items-center justify-center outline-none transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50';

const SEPARATOR =
  'bg-foreground/12 dark:bg-foreground/15 w-(--hairline) shrink-0';

function isStepReason(reason: string) {
  const isIncrement = reason === 'increment-press';
  const isDecrement = reason === 'decrement-press';
  const isKeyboard = reason === 'keyboard';
  return isIncrement || isDecrement || isKeyboard;
}

function directionOf(previous: number | null, next: number | null) {
  if (previous === null) {
    return 1;
  }
  if (next === null) {
    return 1;
  }
  if (next < previous) {
    return -1;
  }
  return 1;
}

function enteringFrameOf(
  direction: number,
  shouldReduceMotion: boolean | null
): Keyframe {
  if (shouldReduceMotion) {
    return { opacity: 0 };
  }
  const offset = direction * DIGIT_SHIFT_PX;
  return { opacity: 0, transform: `translateY(${offset}px)` };
}

function settledFrameOf(shouldReduceMotion: boolean | null): Keyframe {
  if (shouldReduceMotion) {
    return { opacity: 1 };
  }
  return { opacity: 1, transform: 'translateY(0)' };
}

function useStepSlide(initialValue: number) {
  const inputRef = useRef<HTMLInputElement>(null);
  const slideRef = useRef<Animation | null>(null);
  const previousValueRef = useRef<number | null>(initialValue);
  const shouldReduceMotion = usePrefersReducedMotion();

  function slideOnStep(
    value: number | null,
    details: NumberFieldRootChangeEventDetails
  ) {
    const previousValue = previousValueRef.current;
    previousValueRef.current = value;
    const input = inputRef.current;
    const isStep = isStepReason(details.reason);
    if (!isStep) {
      return;
    }
    if (!input) {
      return;
    }
    const isSliding = slideRef.current?.playState === 'running';
    if (isSliding) {
      return;
    }
    const direction = directionOf(previousValue, value);
    const entering = enteringFrameOf(direction, shouldReduceMotion);
    const settled = settledFrameOf(shouldReduceMotion);
    slideRef.current = input.animate([entering, settled], {
      duration: STEP_SLIDE_MS,
      easing: STEP_SLIDE_EASING,
    });
  }

  return { inputRef, slideOnStep };
}

export default function Input28() {
  const { inputRef, slideOnStep } = useStepSlide(INITIAL_STORAGE);

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Storage in GB</FieldLabel>
      <NumberField.Root
        defaultValue={INITIAL_STORAGE}
        min={0}
        onValueChange={slideOnStep}
      >
        <NumberField.Group className={GROUP}>
          <NumberField.Decrement
            className={STEP_BUTTON}
            aria-label='Decrease storage'
          >
            <MinusIcon className='size-4' />
          </NumberField.Decrement>
          <span className={SEPARATOR} aria-hidden='true' />
          <NumberField.Input
            ref={inputRef}
            className='h-full min-w-0 flex-1 bg-transparent px-2.5 text-center tabular-nums outline-none'
          />
          <span className={SEPARATOR} aria-hidden='true' />
          <NumberField.Increment
            className={STEP_BUTTON}
            aria-label='Increase storage'
          >
            <PlusIcon className='size-4' />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </Field>
  );
}
