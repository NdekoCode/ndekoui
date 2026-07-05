'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState, type ChangeEvent } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const SEGMENTS = [0, 1, 2, 3];
const MAX_LEVEL = SEGMENTS.length;
const MIN_LENGTH = 12;
const SEGMENT_STAGGER_MS = 40;
const LABEL_SHIFT_PX = 8;

const LEVELS = [
  { label: 'Not set', tone: 'bg-transparent', ink: 'text-muted-foreground' },
  { label: 'Weak', tone: 'bg-destructive', ink: 'text-destructive-ink' },
  { label: 'Fair', tone: 'bg-warning', ink: 'text-warning-foreground' },
  { label: 'Good', tone: 'bg-success', ink: 'text-success-foreground' },
  { label: 'Strong', tone: 'bg-success', ink: 'text-success-foreground' },
];

const SEGMENT_FILL =
  'h-full w-full origin-left rounded-full transition-[scale,background-color] duration-200 ease-(--ease-out-strong) rtl:origin-right';

const LABEL_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * LABEL_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * LABEL_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function hasMixedCase(password: string) {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  return hasLower && hasUpper;
}

function levelOf(password: string) {
  if (password.length === 0) {
    return 0;
  }
  const checks = [
    password.length >= MIN_LENGTH,
    hasMixedCase(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.max(1, passed);
}

function directionBetween(previousLevel: number, nextLevel: number) {
  if (nextLevel < previousLevel) {
    return -1;
  }
  return 1;
}

function segmentDelayOf(index: number, direction: number) {
  if (direction > 0) {
    const delay = index * SEGMENT_STAGGER_MS;
    return { transitionDelay: `${delay}ms` };
  }
  const reversedIndex = MAX_LEVEL - 1 - index;
  const delay = reversedIndex * SEGMENT_STAGGER_MS;
  return { transitionDelay: `${delay}ms` };
}

function segmentFillOf(index: number, level: number) {
  const isFilled = index < level;
  if (isFilled) {
    return 'scale-x-100';
  }
  return 'scale-x-0';
}

export default function Input63() {
  const labelId = useId();
  const [password, setPassword] = useState('');
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = usePrefersReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const level = levelOf(password);
  const current = LEVELS[level];

  function changePassword(event: ChangeEvent<HTMLInputElement>) {
    const nextPassword = event.currentTarget.value;
    const nextLevel = levelOf(nextPassword);
    setDirection(directionBetween(level, nextLevel));
    setPassword(nextPassword);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Field>
        <FieldLabel>Password</FieldLabel>
        <Input
          type='password'
          autoComplete='new-password'
          placeholder='Choose a password'
          value={password}
          onChange={changePassword}
        />
      </Field>
      <div className='flex flex-col gap-2'>
        <div
          className='flex gap-1.5'
          role='meter'
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={MAX_LEVEL}
          aria-valuenow={level}
          aria-valuetext={current.label}
        >
          {SEGMENTS.map((index) => (
            <span
              key={index}
              className='bg-foreground/[0.08] h-1 flex-1 overflow-hidden rounded-full'
            >
              <span
                className={cn(
                  SEGMENT_FILL,
                  segmentFillOf(index, level),
                  current.tone
                )}
                style={segmentDelayOf(index, direction)}
              />
            </span>
          ))}
        </div>
        <div className='flex items-center justify-between text-xs'>
          <span id={labelId} className='text-muted-foreground'>
            Password strength
          </span>
          <span className='relative flex font-medium' aria-hidden='true'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={direction}
            >
              <motion.span
                key={current.label}
                className={cn('flex', current.ink)}
                custom={direction}
                variants={labelVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={LABEL_TRANSITION}
              >
                {current.label}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </div>
    </div>
  );
}
