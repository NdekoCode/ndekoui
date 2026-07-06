'use client';

import { AnimatePresence, motion, type Variants } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { FieldError } from '@/registry/ndeko/ui/field';

import { PRODUCT_NAME } from './data';

const STEP_IN = { duration: 0.2, ease: EASE_OUT_STRONG };

const STEP_OUT = { duration: 0.15, ease: EASE_OUT_STRONG };

const STEP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: STEP_IN },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(2px)', transition: STEP_OUT },
};

const PROBLEM_VARIANTS: Variants = {
  enter: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: STEP_IN },
  exit: { height: 0, opacity: 0, transition: STEP_OUT },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: STEP_IN },
  exit: { opacity: 0, transition: STEP_OUT },
};

function stepVariantsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return STEP_VARIANTS;
}

function problemVariantsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return PROBLEM_VARIANTS;
}

function ProductMark() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className='size-6 shrink-0'>
      <rect width='24' height='24' rx='6' className='fill-primary' />
      <path
        d='M5 10q1.75-2.6 3.5 0t3.5 0 3.5 0 3.5 0'
        fill='none'
        strokeOpacity='0.7'
        strokeWidth='1.8'
        strokeLinecap='round'
        className='stroke-primary-foreground'
      />
      <path
        d='M5 15.5q1.75-2.6 3.5 0t3.5 0 3.5 0 3.5 0'
        fill='none'
        strokeWidth='1.8'
        strokeLinecap='round'
        className='stroke-primary-foreground'
      />
    </svg>
  );
}

type AuthFrameProps = {
  ref?: React.Ref<HTMLDivElement>;
  /** Sits at the end of the top bar: the Replay of the demonstration. */
  aside?: React.ReactNode;
  footer: React.ReactNode;
  /** The live region of the page, outside the card that resizes. */
  announcer: React.ReactNode;
  children: React.ReactNode;
};

/** A focused page that follows its own width: the window colour, the product mark, one card in the middle. */
export function AuthFrame({
  ref,
  aside,
  footer,
  announcer,
  children,
}: AuthFrameProps) {
  return (
    <div
      ref={ref}
      className='bg-sidebar text-foreground @container flex min-h-dvh w-full flex-col'
    >
      <header className='flex h-14 shrink-0 items-center gap-2 px-4 @xl:px-6'>
        <ProductMark />
        <span className='text-sm font-semibold'>{PRODUCT_NAME}</span>
        <span className='ms-auto flex items-center'>{aside}</span>
      </header>
      <main className='flex flex-1 flex-col items-center px-4 pt-4 pb-16 @xl:justify-center @xl:pt-0'>
        <div className='flex w-full max-w-[25rem] flex-col gap-4'>
          <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @md:p-7'>
            <AnimatedSize contentClassName='relative'>{children}</AnimatedSize>
          </div>
          <p className='text-muted-foreground px-2 text-center text-xs text-balance'>
            {footer}
          </p>
        </div>
      </main>
      {announcer}
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

type CardHeadProps = {
  mark: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

/**
 * The title takes the focus when a person moves to its step, so a screen reader says where they
 * are. The demonstration never moves the focus there.
 */
export function CardHead({ mark, title, children }: CardHeadProps) {
  return (
    <div className='flex flex-col gap-4'>
      {mark}
      <div className='flex flex-col gap-1.5'>
        <h1
          data-step-heading
          tabIndex={-1}
          className='text-xl font-semibold text-balance outline-none'
        >
          {title}
        </h1>
        <div className='text-muted-foreground text-[13px] text-pretty'>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Rendered inside a `Field`, so the control points to it. It grows in and folds away. */
export function FieldProblem({ problem }: { problem: string | null }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = problemVariantsOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {problem && (
        <motion.div
          key='problem'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          className='overflow-hidden'
        >
          <FieldError match className='pt-1.5'>
            {problem}
          </FieldError>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
