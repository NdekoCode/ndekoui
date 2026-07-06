'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import { ChartCard } from './chart-card';
import { GOALS, type Goal } from './data';
import { COUNT_FORMAT, formatCount } from './format';
import type { GoalResult, PeriodData } from './period-data';

const TICK_COUNT = 28;

const TICKS = Array.from({ length: TICK_COUNT }, (_, index) => index);

/** Each tick follows the one before by this long, so a meter fills like a wave and no two meters move at once alone. */
const TICK_WAVE_MS = 14;

function filledOf(share: number) {
  const capped = Math.min(share, 1);
  return Math.round(capped * TICK_COUNT);
}

function tickToneOf(isFilled: boolean, isReached: boolean) {
  if (!isFilled) {
    return 'bg-foreground/[0.08]';
  }
  if (isReached) {
    return 'bg-success';
  }
  return 'bg-primary';
}

type TickMeterProps = {
  goal: Goal;
  result: GoalResult;
};

function TickMeter({ goal, result }: TickMeterProps) {
  const filled = filledOf(result.share);
  const isReached = result.share >= 1;
  const spoken = `${goal.label}: ${formatCount(result.actual)} of ${formatCount(result.target)} ${goal.noun}`;

  return (
    <div
      role='meter'
      aria-label={spoken}
      aria-valuemin={0}
      aria-valuemax={result.target}
      aria-valuenow={result.actual}
      className='flex h-4 gap-0.5'
    >
      {TICKS.map((tick) => {
        const isFilled = tick < filled;
        return (
          <span
            key={tick}
            aria-hidden='true'
            className={cn(
              'min-w-0 flex-1 rounded-[2px] transition-colors duration-300',
              tickToneOf(isFilled, isReached)
            )}
            style={{ transitionDelay: `${tick * TICK_WAVE_MS}ms` }}
          />
        );
      })}
    </div>
  );
}

type GoalMetersProps = {
  data: PeriodData;
};

export function GoalMeters({ data }: GoalMetersProps) {
  return (
    <ChartCard
      title='Goals'
      description={
        <p className='text-muted-foreground text-xs'>
          Against the target for the period
        </p>
      }
    >
      <ul className='flex flex-col gap-4'>
        {GOALS.map((goal, index) => {
          const result = data.goals[index];
          return (
            <li key={goal.id} className='flex flex-col gap-1.5'>
              <p className='flex items-baseline gap-2'>
                <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
                  {goal.label}
                </span>
                <MotionNumber
                  value={Math.round(result.share * 100)}
                  format={COUNT_FORMAT}
                  suffix='%'
                  className='text-[13px] font-semibold'
                />
              </p>
              <TickMeter goal={goal} result={result} />
              <p className='text-muted-foreground flex items-baseline gap-1 text-xs'>
                <MotionNumber value={result.actual} format={COUNT_FORMAT} />
                <span>of</span>
                <MotionNumber value={result.target} format={COUNT_FORMAT} />
                <span>{goal.noun}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
