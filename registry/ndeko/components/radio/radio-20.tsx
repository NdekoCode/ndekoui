'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type BillingPeriod = {
  value: string;
  label: string;
  saving?: string;
};

const BILLING_PERIODS: BillingPeriod[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly', saving: '-20%' },
];

const INDICATOR_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.2, 0, 0, 1],
};

const INSTANT_TRANSITION: Transition = { duration: 0 };

const INDICATOR = [
  'absolute inset-0 -z-10 rounded-md bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10',
  'dark:bg-foreground/[0.09] dark:ring-foreground/15',
].join(' ');

const PERIOD_OPTION = [
  'relative inline-flex h-7 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150',
  'hover:text-foreground has-data-checked:text-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

function indicatorTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return INDICATOR_TRANSITION;
}

function savingToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'text-success-foreground transition-colors duration-150';
  }
  return 'text-muted-foreground transition-colors duration-150';
}

export default function Radio20() {
  const indicatorId = useId();
  const [period, setPeriod] = useState('yearly');
  const shouldReduceMotion = useReducedMotion();
  const indicatorTransition = indicatorTransitionOf(shouldReduceMotion);

  return (
    <RadioGroup
      value={period}
      onValueChange={setPeriod}
      aria-label='Billing period'
      className='bg-foreground/[0.05] isolate inline-flex gap-0.5 rounded-lg p-0.5'
    >
      {BILLING_PERIODS.map((option) => {
        const isSelected = option.value === period;
        const savingTone = savingToneOf(isSelected);

        return (
          <label key={option.value} className={PERIOD_OPTION}>
            <RadioGroupItem value={option.value} className='sr-only' />
            {isSelected && (
              <motion.span
                layoutId={indicatorId}
                className={INDICATOR}
                transition={indicatorTransition}
              />
            )}
            {option.label}
            {option.saving && (
              <span className={savingTone}>{option.saving}</span>
            )}
          </label>
        );
      })}
    </RadioGroup>
  );
}
