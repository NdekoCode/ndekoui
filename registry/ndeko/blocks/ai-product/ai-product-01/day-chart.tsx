'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

import type { PeriodId } from './data';

const RISE_S = 0.6;

const STAGGER_S = 0.02;

function riseOf(shouldReduceMotion: boolean, index: number): Transition {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return { duration: RISE_S, ease: EASE_OUT_STRONG, delay: index * STAGGER_S };
}

function startOf(hasChanged: boolean, shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return false;
  }
  if (hasChanged) {
    return { scaleY: 0 };
  }
  return false;
}

function toneOf(isLatest: boolean) {
  if (isLatest) {
    return 'bg-primary';
  }
  return 'bg-primary/35';
}

function heightShareOf(value: number, tallest: number) {
  if (tallest <= 0) {
    return 0;
  }
  return value / tallest;
}

function tallestOf(values: readonly number[]) {
  return Math.max(1, ...values);
}

type DayChartProps = {
  periodId: PeriodId;
  values: readonly number[];
  labels: readonly string[];
  caption: string;
  hasChanged: boolean;
};

export function DayChart({
  periodId,
  values,
  labels,
  caption,
  hasChanged,
}: DayChartProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const initialOf = startOf(hasChanged, shouldReduceMotion);
  const tallest = tallestOf(values);
  const lastIndex = values.length - 1;

  return (
    <div className='relative flex flex-col gap-2'>
      <div aria-hidden='true' className='flex h-28 items-stretch gap-0.5'>
        {values.map((value, index) => (
          <span
            key={`${periodId}-${index}`}
            className='bg-foreground/[0.04] relative flex-1 overflow-hidden rounded-[3px]'
          >
            <motion.span
              initial={initialOf}
              animate={{ scaleY: heightShareOf(value, tallest) }}
              transition={riseOf(shouldReduceMotion, index)}
              className={cn(
                'absolute inset-0 origin-bottom',
                toneOf(index === lastIndex)
              )}
            />
          </span>
        ))}
      </div>
      <p
        aria-hidden='true'
        className='text-muted-foreground flex justify-between text-[11px] tabular-nums'
      >
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </p>
      <div className='sr-only'>
        <table>
          <caption>{caption}</caption>
          <tbody>
            {values.map((value, index) => (
              <tr key={index}>
                <th scope='row'>{index + 1}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
