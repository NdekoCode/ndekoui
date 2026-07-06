'use client';

import type { CSSProperties } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import { SPEND, TASKS_DONE, WEEK_DAYS } from './data';

const STAGGER_MS = 60;

function easedOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 'transition-none';
  }
  return 'transition-transform duration-700 ease-(--ease-out-strong)';
}

function tallestOf(values: readonly number[]) {
  return Math.max(1, ...values);
}

function barStyleOf(
  value: number,
  tallest: number,
  isRolled: boolean,
  index: number
): CSSProperties {
  let share = 0;
  if (isRolled) {
    share = value / tallest;
  }
  const delay = index * STAGGER_MS;
  return { transform: `scaleY(${share})`, transitionDelay: `${delay}ms` };
}

function barToneOf(isToday: boolean) {
  if (isToday) {
    return 'bg-primary';
  }
  return 'bg-primary/35';
}

type MiniBarsProps = {
  values: readonly number[];
  isRolled: boolean;
  caption: string;
  unit: string;
};

function MiniBars({ values, isRolled, caption, unit }: MiniBarsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const eased = easedOf(shouldReduceMotion);
  const tallest = tallestOf(values);
  const lastIndex = values.length - 1;

  return (
    <div className='relative flex flex-col gap-1.5'>
      <div aria-hidden='true' className='flex h-16 items-stretch gap-1.5'>
        {values.map((value, index) => (
          <span
            key={WEEK_DAYS[index]}
            className='bg-foreground/[0.04] relative flex-1 overflow-hidden rounded-[3px]'
          >
            <span
              style={barStyleOf(value, tallest, isRolled, index)}
              className={cn(
                'absolute inset-0 origin-bottom',
                eased,
                barToneOf(index === lastIndex)
              )}
            />
          </span>
        ))}
      </div>
      <div aria-hidden='true' className='flex gap-1.5'>
        {WEEK_DAYS.map((day) => (
          <span
            key={day}
            className='text-muted-foreground flex-1 text-center text-[11px]'
          >
            {day}
          </span>
        ))}
      </div>
      <div className='sr-only'>
        <table>
          <caption>{caption}</caption>
          <tbody>
            {values.map((value, index) => (
              <tr key={WEEK_DAYS[index]}>
                <th scope='row'>{WEEK_DAYS[index]}</th>
                <td>
                  {value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function shownOf(isRolled: boolean, value: number) {
  if (isRolled) {
    return value;
  }
  return 0;
}

function meterStyleOf(share: number, isRolled: boolean): CSSProperties {
  let shown = 0;
  if (isRolled) {
    shown = share;
  }
  const open = 1 - shown;
  const remaining = open * 100;
  return { transform: `translateX(-${remaining}%)` };
}

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:p-5';

type TrendCardProps = {
  isRolled: boolean;
};

export function SpendCard({ isRolled }: TrendCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const eased = easedOf(shouldReduceMotion);
  const share = SPEND.usedUsd / SPEND.budgetUsd;
  const meterStyle = meterStyleOf(share, isRolled);

  return (
    <section aria-label='Spend against budget' className={CARD}>
      <header className='flex flex-col gap-1'>
        <h3 className='text-muted-foreground text-[13px] font-medium'>
          Spend this month
        </h3>
        <p className='flex items-baseline gap-2'>
          <MotionNumber
            value={shownOf(isRolled, SPEND.usedUsd)}
            prefix='$'
            className='text-2xl font-semibold'
          />
          <span className='text-muted-foreground text-[13px] tabular-nums'>
            of ${SPEND.budgetUsd} budget
          </span>
        </p>
      </header>
      <div
        role='meter'
        aria-label='Budget used'
        aria-valuemin={0}
        aria-valuemax={SPEND.budgetUsd}
        aria-valuenow={SPEND.usedUsd}
        className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'
      >
        <span
          style={meterStyle}
          className={cn('bg-primary block h-full rounded-full', eased)}
        />
      </div>
      <MiniBars
        values={SPEND.byDay}
        isRolled={isRolled}
        caption='Dollars spent by day this week, illustrative'
        unit='dollars'
      />
    </section>
  );
}

export function TasksCard({ isRolled }: TrendCardProps) {
  return (
    <section aria-label='Tasks done this week' className={CARD}>
      <header className='flex flex-col gap-1'>
        <h3 className='text-muted-foreground text-[13px] font-medium'>
          Tasks done this week
        </h3>
        <p className='flex'>
          <MotionNumber
            value={shownOf(isRolled, TASKS_DONE.total)}
            className='text-2xl font-semibold'
          />
        </p>
      </header>
      <MiniBars
        values={TASKS_DONE.byDay}
        isRolled={isRolled}
        caption='Tasks done by day this week, illustrative'
        unit='tasks'
      />
    </section>
  );
}
