'use client';

import { useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
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

export default function Stepper08() {
  const [currentStep, setCurrentStep] = useState(2);
  const isFirstStep = currentStep === FIRST_STEP;
  const isLastStep = currentStep === STEPS.length;

  function goToPreviousStep() {
    setCurrentStep((step) => step - 1);
  }

  function goToNextStep() {
    setCurrentStep((step) => step + 1);
  }

  return (
    <div className='mx-auto flex w-full max-w-xl items-center gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={goToPreviousStep}
        disabled={isFirstStep}
        focusableWhenDisabled
        aria-label='Previous step'
      >
        <ChevronLeftIcon />
      </Button>
      <Stepper
        value={currentStep}
        onValueChange={setCurrentStep}
        className='gap-1'
      >
        {STEPS.map((step) => (
          <StepperItem key={step} step={step} className='flex-1'>
            <StepperIndicator className={cn(BAR, 'h-1')}>
              <span className='sr-only'>{step}</span>
            </StepperIndicator>
          </StepperItem>
        ))}
      </Stepper>
      <Button
        variant='ghost'
        size='icon'
        onClick={goToNextStep}
        disabled={isLastStep}
        focusableWhenDisabled
        aria-label='Next step'
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
