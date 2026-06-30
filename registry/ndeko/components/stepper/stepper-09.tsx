'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [1, 2, 3, 4];
const FIRST_STEP = 1;

const BAR = [
  'bg-foreground/10 data-[state=active]:bg-foreground/10 data-[state=completed]:bg-foreground/10 w-full',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-[inherit] after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'data-[state=active]:after:scale-x-100 data-[state=active]:after:duration-300 data-[state=completed]:after:scale-x-100 data-[state=completed]:after:duration-300',
].join(' ');

export default function Stepper09() {
  const [step, setStep] = useState(FIRST_STEP);
  const isFirstStep = step === FIRST_STEP;
  const isLastStep = step >= STEPS.length;

  function moveBy(stepCount: number) {
    setStep((previous) => previous + stepCount);
  }

  return (
    <div className='mx-auto flex w-full max-w-xl flex-col gap-8 text-center'>
      <div className='flex flex-col gap-3'>
        <Stepper value={step} className='overflow-hidden rounded-full'>
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
            Step {step} of {STEPS.length}
          </span>
          <span className='inline-flex items-baseline' aria-hidden='true'>
            Step&nbsp;
            <MotionNumber value={step} />
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
