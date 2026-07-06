'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { LoaderCircleIcon, type Icon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { FieldError } from '@/registry/ndeko/ui/field';

import { LoomboardMark } from './brand-mark';
import { PRODUCT_NAME } from './data';

const STEP_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const STEP_OUT: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const STEP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: STEP_IN },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(2px)', transition: STEP_OUT },
};

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const ERROR_VARIANTS: Variants = {
  enter: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: STEP_IN },
  exit: { height: 0, opacity: 0, transition: STEP_OUT },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: STEP_IN },
  exit: { opacity: 0, transition: STEP_OUT },
};

function stepVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return STEP_VARIANTS;
}

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function errorVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ERROR_VARIANTS;
}

type AuthFrameProps = {
  footer?: React.ReactNode;
  children: React.ReactNode;
};

/** A focused page: the window colour, the mark and its name, one card in the middle. */
export function AuthFrame({ footer, children }: AuthFrameProps) {
  return (
    <div className='bg-sidebar text-foreground flex min-h-dvh w-full flex-col'>
      <header className='flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6'>
        <LoomboardMark />
        <span className='text-sm font-semibold'>{PRODUCT_NAME}</span>
      </header>
      <main className='flex flex-1 flex-col items-center px-4 pt-4 pb-16 sm:justify-center sm:pt-0'>
        <div className='flex w-full max-w-[25rem] flex-col gap-4'>
          <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-7'>
            <AnimatedSize contentClassName='relative'>{children}</AnimatedSize>
          </div>
          {footer && (
            <p className='text-muted-foreground px-2 text-center text-xs text-balance'>
              {footer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

type StepSwapProps = {
  stepKey: string;
  children: React.ReactNode;
};

/** The card resizes around it while one step gives way to the next. */
export function StepSwap({ stepKey, children }: StepSwapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = stepVariantsOf(shouldReduceMotion);

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.div
        key={stepKey}
        variants={variants}
        initial='enter'
        animate='visible'
        exit='exit'
        className='flex flex-col gap-6'
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type MarkTileProps = { icon: Icon };

export function MarkTile({ icon: TileIcon }: MarkTileProps) {
  return (
    <span className='keycap-3d text-muted-foreground flex size-10 items-center justify-center rounded-lg'>
      <TileIcon className='size-5' />
    </span>
  );
}

type CardHeadProps = {
  mark: React.ReactNode;
  title: string;
  /** Focuses the title when a step opens, so screen readers hear where they are. */
  autoFocusTitle?: boolean;
  children: React.ReactNode;
};

export function CardHead({
  mark,
  title,
  autoFocusTitle,
  children,
}: CardHeadProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocusTitle) {
      titleRef.current?.focus();
    }
  }, [autoFocusTitle]);

  return (
    <div className='flex flex-col gap-4'>
      {mark}
      <div className='flex flex-col gap-1.5'>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className='text-xl font-semibold text-balance outline-none'
        >
          {title}
        </h1>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {children}
        </p>
      </div>
    </div>
  );
}

type ErrorPresenceProps = {
  error: string | null;
};

/** Rendered inside a `Field`, so the error is tied to its control. It grows in and folds away. */
export function ErrorPresence({ error }: ErrorPresenceProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = errorVariantsOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div
          key='error'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          className='overflow-hidden'
        >
          <FieldError match className='pt-1.5'>
            {error}
          </FieldError>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type SubmitButtonProps = {
  label: string;
  workingLabel: string;
  isWorking: boolean;
};

/** Becomes its working state in place: a spinner joins the label and the pill resizes to it. */
export function SubmitButton({
  label,
  workingLabel,
  isWorking,
}: SubmitButtonProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const shownLabel = workingLabelOf(isWorking, label, workingLabel);

  return (
    <Button
      type='submit'
      size='lg'
      disabled={isWorking}
      focusableWhenDisabled
      className='w-full data-disabled:opacity-100 sm:w-auto'
    >
      <AnimatedSize
        as='span'
        axis='width'
        contentClassName='relative flex items-center gap-2'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {isWorking && (
            <motion.span
              key='spinner'
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
              className='flex'
            >
              <LoaderCircleIcon className='animate-spin' />
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={shownLabel}
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {shownLabel}
          </motion.span>
        </AnimatePresence>
      </AnimatedSize>
    </Button>
  );
}

function workingLabelOf(
  isWorking: boolean,
  label: string,
  workingLabel: string
) {
  if (isWorking) {
    return workingLabel;
  }
  return label;
}

type SwapLabelProps = { text: string };

export function SwapLabel({ text }: SwapLabelProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

  return (
    <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={text}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='tabular-nums'
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </AnimatedSize>
  );
}

/** Counts down once a second while it is above zero. */
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSeconds((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  return { seconds, start: setSeconds };
}

export function clockOf(totalSeconds: number) {
  const rawMinutes = totalSeconds / 60;
  const minutes = Math.floor(rawMinutes);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
}
