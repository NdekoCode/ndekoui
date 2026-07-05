'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';

import type { PeriodId } from './data';
import type { Totals } from './session';

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

const PERIOD_WORDS: Record<PeriodId, string> = {
  today: 'today',
  week: 'this week',
};

const PERIOD_IDS: PeriodId[] = ['today', 'week'];

function labelOf(subject: string, period: PeriodId) {
  return `${subject} ${PERIOD_WORDS[period]}`;
}

function labelsOf(subject: string) {
  return PERIOD_IDS.map((period) => labelOf(subject, period));
}

function waitingToneOf(waiting: number) {
  if (waiting > 0) {
    return 'text-warning-foreground';
  }
  return 'text-foreground';
}

type TotalCellProps = {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function TotalCell({ label, className, children }: TotalCellProps) {
  return (
    <div className='flex min-w-0 flex-col gap-1 px-3 py-2.5 @2xl:px-4'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd
        className={cn(
          'text-2xl leading-8 font-semibold transition-colors duration-200',
          className
        )}
      >
        {children}
      </dd>
    </div>
  );
}

type PeriodLabelProps = {
  subject: string;
  period: PeriodId;
};

function PeriodLabel({ subject, period }: PeriodLabelProps) {
  return (
    <WordRoll text={labelOf(subject, period)} labels={labelsOf(subject)} />
  );
}

type TotalsBandProps = {
  totals: Totals;
  period: PeriodId;
};

/** Waiting on you is what waits now, whatever the period. */
export function TotalsBand({ totals, period }: TotalsBandProps) {
  return (
    <dl className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] grid grid-cols-2 gap-y-1 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:grid-cols-4'>
      <TotalCell label={<PeriodLabel subject='Runs' period={period} />}>
        <MotionNumber value={totals.runs} />
      </TotalCell>
      <TotalCell
        label='Waiting on you'
        className={waitingToneOf(totals.waiting)}
      >
        <MotionNumber value={totals.waiting} />
      </TotalCell>
      <TotalCell label={<PeriodLabel subject='Failed' period={period} />}>
        <MotionNumber value={totals.failed} />
      </TotalCell>
      <TotalCell label={<PeriodLabel subject='Spend' period={period} />}>
        <MotionNumber value={totals.spendUsd} format={USD} />
      </TotalCell>
    </dl>
  );
}
