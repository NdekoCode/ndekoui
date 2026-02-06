'use client';

import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [1, 2, 3, 4];
const FIRST_STEP = 1;
const SAVE_DELAY_MS = 1000;

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'group-data-[state=completed]/step:after:scale-x-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper05() {
  const [currentStep, setCurrentStep] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const isFirstStep = currentStep === FIRST_STEP;
  const isFinished = currentStep > STEPS.length;
  const cannotGoBack = isFirstStep || isLoading;
  const cannotGoForward = isFinished || isLoading;

  function goToPreviousStep() {
    setCurrentStep((step) => step - 1);
  }

  function finishLoading() {
    setCurrentStep((step) => step + 1);
    setIsLoading(false);
  }

  function goToNextStep() {
    setIsLoading(true);
    window.setTimeout(finishLoading, SAVE_DELAY_MS);
  }

  return (
    <div className='mx-auto flex w-full max-w-xl flex-col gap-8'>
      <Stepper value={currentStep} onValueChange={setCurrentStep}>
        {STEPS.map((step) => (
          <StepperItem
            key={step}
            step={step}
            className='not-last:flex-1'
            loading={isLoading}
          >
            <StepperIndicator />
            {step < STEPS.length && <StepperSeparator className={CONNECTOR} />}
          </StepperItem>
        ))}
      </Stepper>
      <div className='flex justify-center gap-3'>
        <Button
          variant='outline'
          className='w-32'
          onClick={goToPreviousStep}
          disabled={cannotGoBack}
          focusableWhenDisabled
        >
          Previous step
        </Button>
        <Button
          variant='outline'
          className='w-32'
          onClick={goToNextStep}
          disabled={cannotGoForward}
          focusableWhenDisabled
        >
          Next step
        </Button>
      </div>
    </div>
  );
}
