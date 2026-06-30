'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  WEEK_AVERAGES,
  WEEKS,
  cellOf,
  formatCount,
  percentOf,
  weekLabelOf,
  type Cohort,
  type Selection,
} from './cohort-model';

const FADE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const FADE_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

type Comparison = { label: string; color: string };

function comparisonOf(deltaPoints: number, week: number): Comparison {
  if (week === 0) {
    return {
      label: 'Every cohort starts at 100%',
      color: 'var(--muted-foreground)',
    };
  }
  const averageName = `the week ${week} average`;
  if (deltaPoints > 0) {
    return {
      label: `${deltaPoints} pts above ${averageName}`,
      color: 'var(--success)',
    };
  }
  if (deltaPoints < 0) {
    const gap = Math.abs(deltaPoints);
    return {
      label: `${gap} pts below ${averageName}`,
      color: 'var(--warning)',
    };
  }
  return {
    label: `Level with ${averageName}`,
    color: 'var(--muted-foreground)',
  };
}

function barToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'bg-primary';
  }
  return 'bg-foreground/12';
}

function heightOf(rate: number) {
  const percent = rate * 100;
  return `${percent}%`;
}

type CohortCurveProps = {
  cohort: Cohort;
  selectedWeek: number;
};

/** The selected cohort week by week, each bar against the average of every cohort that reached that week. */
function CohortCurve({ cohort, selectedWeek }: CohortCurveProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div aria-hidden='true' className='flex h-24 items-end gap-1.5'>
        {WEEKS.map((week) => {
          const cell = cohort.cells[week];
          const average = WEEK_AVERAGES[week];
          if (!cell) {
            return (
              <span
                key={week}
                className='hairline-border border-foreground/15 h-2 flex-1 rounded-[3px] border-dashed'
              />
            );
          }
          const isSelected = week === selectedWeek;

          return (
            <span key={week} className='relative h-full flex-1'>
              <span
                style={{ height: heightOf(cell.rate) }}
                className={cn(
                  'absolute inset-x-0 bottom-0 rounded-[3px] transition-colors duration-150',
                  barToneOf(isSelected)
                )}
              />
              <span
                style={{ bottom: heightOf(average.rate) }}
                className='bg-foreground/60 absolute -inset-x-0.5 h-0.5 rounded-full'
              />
            </span>
          );
        })}
      </div>
      <div
        aria-hidden='true'
        className='text-muted-foreground flex gap-1.5 text-[11px] tabular-nums'
      >
        {WEEKS.map((week) => (
          <span key={week} className='flex-1 text-center'>
            {`W${week}`}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CohortPanel({ selection }: { selection: Selection }) {
  const { cohort, cell } = cellOf(selection);
  const average = WEEK_AVERAGES[selection.week];
  const percent = percentOf(cell.rate);
  const averagePercent = percentOf(average.rate);
  const deltaPoints = percent - averagePercent;
  const comparison = comparisonOf(deltaPoints, selection.week);
  const weekLabel = weekLabelOf(selection.week);
  const retained = formatCount(cell.retained);
  const size = formatCount(cohort.size);
  const curveKey = cohort.id;

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-1'>
        <p className='text-muted-foreground text-xs'>
          {cohort.label} cohort · {weekLabel}
        </p>
        <MotionNumber
          value={percent}
          suffix='%'
          className='text-3xl leading-9 font-semibold'
        />
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {retained} of {size} customers still subscribed
        </p>
      </div>
      <Chip color={comparison.color} className='h-6 px-2 text-xs'>
        {comparison.label}
      </Chip>
      <div className='flex flex-col gap-2'>
        <p className='text-xs font-medium'>{cohort.label} week by week</p>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div
              key={curveKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: FADE_IN }}
              exit={{ opacity: 0, transition: FADE_OUT }}
            >
              <CohortCurve cohort={cohort} selectedWeek={selection.week} />
            </motion.div>
          </AnimatePresence>
        </div>
        <p className='text-muted-foreground text-xs text-pretty'>
          Bars are this cohort, the line on each is the average of every cohort
        </p>
      </div>
    </div>
  );
}
