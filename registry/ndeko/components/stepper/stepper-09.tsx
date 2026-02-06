'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [1, 2, 3, 4];
const FIRST_STEP = 1;
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

type StepState = { current: number; direction: number };

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

const BAR = [
  'bg-foreground/10 data-[state=active]:bg-foreground/10 data-[state=completed]:bg-foreground/10 w-full',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-[inherit] after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'data-[state=active]:after:scale-x-100 data-[state=active]:after:duration-300 data-[state=completed]:after:scale-x-100 data-[state=completed]:after:duration-300',
].join(' ');

export default function Stepper09() {
  const [step, setStep] = useState<StepState>({
    current: FIRST_STEP,
    direction: 1,
  });
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const isFirstStep = step.current === FIRST_STEP;
  const isLastStep = step.current >= STEPS.length;

  function moveBy(direction: number) {
    setStep((previous) => {
      const current = previous.current + direction;
      return { current, direction };
    });
  }

  return (
    <div className='mx-auto flex w-full max-w-xl flex-col gap-8 text-center'>
      <div className='flex flex-col gap-3'>
        <Stepper value={step.current} className='overflow-hidden rounded-full'>
          {STEPS.map((item) => (
            <StepperItem key={item} step={item} className='flex-1'>
              <StepperIndicator className={cn(BAR, 'h-2 rounded-none')}>
                <span className='sr-only'>{item}</span>
              </StepperIndicator>
            </StepperItem>
          ))}
        </Stepper>
        <p
          className='text-muted-foreground text-[13px] font-medium tabular-nums'
          aria-live='polite'
        >
          <span className='sr-only'>
            Step {step.current} of {STEPS.length}
          </span>
          <span className='inline-flex items-baseline' aria-hidden='true'>
            Step&nbsp;
            <span className='relative inline-flex'>
              <AnimatePresence
                mode='popLayout'
                initial={false}
                custom={step.direction}
              >
                <motion.span
                  key={step.current}
                  className='inline-flex'
                  custom={step.direction}
                  variants={digitVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={DIGIT_TRANSITION}
                >
                  {step.current}
                </motion.span>
              </AnimatePresence>
            </span>
            &nbsp;of {STEPS.length}
          </span>
        </p>
      </div>
      <div className='flex justify-center gap-3'>
        <Button
          variant='outline'
          className='w-32'
          onClick={() => moveBy(-1)}
          disabled={isFirstStep}
          focusableWhenDisabled
        >
          Previous step
        </Button>
        <Button
          variant='outline'
          className='w-32'
          onClick={() => moveBy(1)}
          disabled={isLastStep}
          focusableWhenDisabled
        >
          Next step
        </Button>
      </div>
    </div>
  );
}
