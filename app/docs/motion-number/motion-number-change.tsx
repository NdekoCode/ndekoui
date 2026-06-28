'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MotionNumber } from '@/components/core/motion-number';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

type Period = '7d' | '30d' | '90d';

type PeriodFigures = {
  label: string;
  teams: number;
  change: number;
};

const FIGURES: Record<Period, PeriodFigures> = {
  '7d': { label: '7 days', teams: 1284, change: 0.042 },
  '30d': { label: '30 days', teams: 1197, change: -0.018 },
  '90d': { label: '90 days', teams: 1046, change: 0.125 },
};

const PERIODS: Period[] = ['7d', '30d', '90d'];

const CHANGE_FORMAT: Intl.NumberFormatOptions = {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

function isPeriod(value: unknown): value is Period {
  return PERIODS.some((period) => period === value);
}

function changeToneOf(change: number) {
  if (change < 0) {
    return 'bg-destructive/10 text-destructive-ink';
  }
  return 'bg-success/10 text-success-foreground';
}

export function MotionNumberChange() {
  const [period, setPeriod] = useState<Period>('7d');
  const figures = FIGURES[period];

  function selectPeriod(nextPeriod: unknown) {
    if (isPeriod(nextPeriod)) {
      setPeriod(nextPeriod);
    }
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-xs flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Tabs value={period} onValueChange={selectPeriod}>
        <TabsList variant='segmented' aria-label='Period'>
          {PERIODS.map((option) => (
            <TabsTab key={option} value={option}>
              {FIGURES[option].label}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
      <div className='flex flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>Active teams</span>
        <div className='flex items-center gap-2'>
          <MotionNumber
            value={figures.teams}
            className='text-foreground text-3xl font-semibold'
          />
          <span
            className={cn(
              'rounded-sm px-1.5 text-xs font-medium transition-colors duration-200',
              changeToneOf(figures.change)
            )}
          >
            <MotionNumber value={figures.change} format={CHANGE_FORMAT} />
          </span>
        </div>
        <span className='text-muted-foreground text-xs'>
          Illustrative figures
        </span>
      </div>
    </div>
  );
}
