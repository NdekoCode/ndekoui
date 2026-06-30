'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WordRoll } from '@/components/core/word-roll';
import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

type OrderStep = {
  label: string;
  tone: string;
};

const STEPS: OrderStep[] = [
  { label: 'Order placed', tone: 'bg-foreground/30' },
  { label: 'Order packed', tone: 'bg-foreground/30' },
  { label: 'Order shipped', tone: 'bg-info' },
  { label: 'Out for delivery', tone: 'bg-info' },
  { label: 'Delivered', tone: 'bg-success' },
];

const LAST_STEP = STEPS.length - 1;

function previousStepOf(step: number) {
  const previous = step - 1;
  return Math.max(previous, 0);
}

function nextStepOf(step: number) {
  const next = step + 1;
  return Math.min(next, LAST_STEP);
}

export function WordRollStatus() {
  const [step, setStep] = useState(1);
  const current = STEPS[step];
  const isFirstStep = step === 0;
  const isLastStep = step === LAST_STEP;

  function goBack() {
    setStep(previousStepOf);
  }

  function goForward() {
    setStep(nextStepOf);
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-xs items-center justify-between gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex min-w-0 flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>Walnut desk lamp</span>
        <span
          aria-live='polite'
          className='flex items-center gap-2 text-[13px] font-medium'
        >
          <span
            aria-hidden='true'
            className={cn(
              'size-1.5 shrink-0 rounded-full transition-colors duration-200',
              current.tone
            )}
          />
          <WordRoll text={current.label} value={step} />
        </span>
      </div>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='icon-sm'
          aria-label='Previous step'
          disabled={isFirstStep}
          focusableWhenDisabled
          onClick={goBack}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant='outline'
          size='icon-sm'
          aria-label='Next step'
          disabled={isLastStep}
          focusableWhenDisabled
          onClick={goForward}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
