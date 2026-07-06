'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps } from './_parts/demo';
import { clamp, positionsTo } from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { useStepDrag } from './_parts/use-step-drag';

export type GoalTrack = {
  id: string;
  name: string;
  /** Progress at each period as a share of the goal: 1 is the goal met, 1.12 is 12% past it. */
  progress: readonly number[];
};

export type GoalNumeralsProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One short label per period: the scrubber writes them. */
  periods: readonly string[];
  goals: readonly GoalTrack[];
  periodIndex: number;
  onPeriodIndexChange: (index: number) => void;
  /** What the scrubber moves through, for screen readers: "Month". */
  periodLabel?: string;
  className?: string;
};

/** One pixel is one point of progress: the track ends at the goal, and what goes past it sticks out above. */
const GOAL_PX = 100;

const OVER_ROOM_PX = 28;

const GAP_PX = 2;

/** Room above the goal for the bar to give a little when it reaches it. */
const RUBBER_PX = 3;

const BAR_HEIGHT = GOAL_PX + GAP_PX + OVER_ROOM_PX;

const HOLD_HEIGHT = GOAL_PX + RUBBER_PX;

type Standing = 'under' | 'met' | 'over';

function standingOf(percent: number): Standing {
  if (percent > 100) {
    return 'over';
  }
  if (percent === 100) {
    return 'met';
  }
  return 'under';
}

function percentAt(goal: GoalTrack, periodIndex: number) {
  const share = goal.progress[periodIndex] ?? 0;
  return Math.round(share * 100);
}

function percentTextAt(goal: GoalTrack, periodIndex: number) {
  const percent = percentAt(goal, periodIndex);
  return `${percent}%`;
}

/**
 * A bar that arrives at its goal goes a few pixels past it and comes back, like something that
 * meets resistance: the one place where an easing overshoots, and it is cut at `RUBBER_PX`.
 */
function arrivalOf(standing: Standing) {
  if (standing === 'under') {
    return 'ease-(--ease-out-strong)';
  }
  return 'ease-[cubic-bezier(0.3,1.5,0.6,1)]';
}

/** Once a bar is past its goal its top is a joint, not its end: the part above carries the rounded end. */
function capOf(standing: Standing) {
  if (standing === 'over') {
    return 'rounded-t-none';
  }
  return 'rounded-t-[4px]';
}

/** The part past the goal waits for the bar to reach the goal, then breaks through. */
function breakthroughOf(standing: Standing) {
  if (standing === 'over') {
    return 'delay-150';
  }
  return 'delay-0';
}

type GoalColumnProps = {
  goal: GoalTrack;
  percent: number;
};

function GoalColumn({ goal, percent }: GoalColumnProps) {
  const standing = standingOf(percent);
  const reached = clamp(percent, 0, 100);
  const hiddenPercent = 100 - reached;
  const pastGoal = percent - 100;
  const overPx = clamp(pastGoal, 0, OVER_ROOM_PX);
  const hiddenOverPx = OVER_ROOM_PX - overPx;

  return (
    <li className='flex min-w-0 flex-col items-center gap-1.5'>
      <span className='sr-only'>{goal.name}</span>
      <MotionNumber
        value={percent}
        suffix='%'
        className='text-base leading-6 font-semibold @xs:text-xl @xs:leading-7 @md:text-2xl'
      />
      <span className='flex h-5 items-center'>
        <Swap swapKey={standing}>
          {standing === 'over' && (
            <Badge variant='warning'>
              <span aria-hidden='true' className='@xs:hidden'>
                Over
              </span>
              <span className='sr-only @xs:not-sr-only'>Over goal</span>
            </Badge>
          )}
          {standing === 'met' && (
            <Badge variant='success'>
              <span aria-hidden='true' className='@xs:hidden'>
                Met
              </span>
              <span className='sr-only @xs:not-sr-only'>Goal met</span>
            </Badge>
          )}
        </Swap>
      </span>
      <span
        aria-hidden='true'
        className='relative w-6'
        style={{ height: BAR_HEIGHT }}
      >
        <span
          className='bg-foreground/[0.05] absolute inset-x-0 bottom-0 rounded-t-[4px]'
          style={{ height: GOAL_PX }}
        />
        <span
          className='absolute inset-x-0 bottom-0 overflow-hidden'
          style={{ height: HOLD_HEIGHT }}
        >
          <span
            className={cn(
              'bg-primary absolute inset-x-0 bottom-0 transition-[transform,border-radius] duration-300',
              arrivalOf(standing),
              capOf(standing)
            )}
            style={{
              height: GOAL_PX,
              transform: `translateY(${hiddenPercent}%)`,
            }}
          />
        </span>
        <span
          className='absolute inset-x-0 top-0 overflow-hidden'
          style={{ height: OVER_ROOM_PX }}
        >
          <span
            className={cn(
              'bg-warning absolute inset-0 rounded-t-[4px] transition-transform duration-300 ease-(--ease-out-strong)',
              breakthroughOf(standing)
            )}
            style={{ transform: `translateY(${hiddenOverPx}px)` }}
          />
        </span>
      </span>
      <span
        aria-hidden='true'
        className='text-muted-foreground w-full text-center text-[11px] leading-4 text-balance @xs:text-xs'
      >
        {goal.name}
      </span>
    </li>
  );
}

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

function cursorOf(isDragging: boolean) {
  if (isDragging) {
    return 'cursor-grabbing';
  }
  return 'cursor-grab';
}

/** A narrow scrubber writes each period by its first letter, as month scales do: J F M A. */
function initialOf(period: string) {
  return period.charAt(0);
}

function periodToneOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'text-foreground font-medium';
  }
  return 'text-muted-foreground';
}

type PeriodScrubberProps = {
  periods: readonly string[];
  index: number;
  onIndexChange: (index: number) => void;
  label: string;
};

/** A slider with one stop per period: the thumb catches on each, and keeps going when it is flicked. */
function PeriodScrubber({
  periods,
  index,
  onIndexChange,
  label,
}: PeriodScrubberProps) {
  const count = Math.max(periods.length, 1);
  const drag = useStepDrag({ count, index, onIndexChange });
  const columnShare = 100 / count;
  const offset = index * columnShare;
  const thumbStyle = {
    width: `${columnShare}cqw`,
    transform: `translateX(${offset}cqw)`,
  };

  return (
    <div
      role='slider'
      tabIndex={0}
      aria-label={label}
      aria-orientation='horizontal'
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-valuenow={index}
      aria-valuetext={periods[index]}
      className={cn(
        'bg-foreground/[0.05] focus-visible:ring-ring/25 @container relative flex h-8 touch-pan-y items-center rounded-lg outline-none select-none focus-visible:ring-[3px]',
        cursorOf(drag.isDragging)
      )}
      {...drag.sliderProps}
    >
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0.5 left-0 p-px transition-transform duration-150 ease-(--ease-out-strong)'
        style={thumbStyle}
      >
        <span className={cn('block size-full rounded-md', THUMB)} />
      </span>
      {periods.map((period, periodIndex) => (
        <span
          key={`${periodIndex}-${period}`}
          aria-hidden='true'
          className={cn(
            'pointer-events-none relative min-w-0 flex-1 text-center text-[11px] transition-colors duration-150',
            periodToneOf(periodIndex === index)
          )}
        >
          <span className='@xs:hidden'>{initialOf(period)}</span>
          <span className='hidden @xs:inline'>{period}</span>
        </span>
      ))}
    </div>
  );
}

function reachedCountOf(percents: readonly number[]) {
  const reached = percents.filter((percent) => percent >= 100);
  return reached.length;
}

function sentenceOf(period: string, reachedCount: number, goalCount: number) {
  return `By ${period}, ${reachedCount} of ${goalCount} goals reached`;
}

/**
 * Every sentence the scrubber can show. Given to the roll, its line keeps the widest one, so the
 * month and the count roll on each step without the width being animated frame by frame.
 */
function sentencesOf(periods: readonly string[], goalCount: number) {
  const sentences: string[] = [];
  for (const period of periods) {
    for (let reached = 0; reached <= goalCount; reached += 1) {
      const sentence = sentenceOf(period, reached, goalCount);
      sentences.push(sentence);
    }
  }
  return sentences;
}

export function GoalNumerals({
  title,
  note,
  periods,
  goals,
  periodIndex,
  onPeriodIndexChange,
  periodLabel = 'Period',
  className,
}: GoalNumeralsProps) {
  const lastIndex = Math.max(periods.length - 1, 0);
  const index = clamp(periodIndex, 0, lastIndex);
  const period = periods[index] ?? '';
  const percents = goals.map((goal) => percentAt(goal, index));
  const reachedCount = reachedCountOf(percents);
  const sentence = sentenceOf(period, reachedCount, goals.length);
  const sentences = sentencesOf(periods, goals.length);
  const readings = goals.map((goal) => {
    const percent = percentTextAt(goal, index);
    return `${goal.name} ${percent}`;
  });
  const readingList = readings.join(', ');
  const summary = `Progress by ${period}: ${readingList}.`;
  const columns = {
    gridTemplateColumns: `repeat(${goals.length}, minmax(0, 1fr))`,
  };

  const rows: DataRow[] = periods.map((label, rowIndex) => ({
    id: `${rowIndex}-${label}`,
    label,
    cells: goals.map((goal) => percentTextAt(goal, rowIndex)),
  }));

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      className={className}
    >
      <p className='text-muted-foreground text-sm'>
        <WordRoll text={sentence} labels={sentences} value={index} />
      </p>
      <ul className='grid gap-2' style={columns}>
        {goals.map((goal, goalIndex) => (
          <GoalColumn key={goal.id} goal={goal} percent={percents[goalIndex]} />
        ))}
      </ul>
      <PeriodScrubber
        periods={periods}
        index={index}
        onIndexChange={onPeriodIndexChange}
        label={periodLabel}
      />
      <DataTable
        caption={title}
        columns={[periodLabel, ...goals.map((goal) => goal.name)]}
        rows={rows}
      />
    </ChartCard>
  );
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const GOALS: GoalTrack[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    progress: [
      0.06, 0.13, 0.21, 0.3, 0.39, 0.49, 0.58, 0.68, 0.79, 0.91, 1, 1.12,
    ],
  },
  {
    id: 'customers',
    name: 'New signups',
    progress: [
      0.09, 0.19, 0.3, 0.42, 0.55, 0.67, 0.78, 0.9, 1.04, 1.17, 1.26, 1.31,
    ],
  },
  {
    id: 'retention',
    name: 'Renewals',
    progress: [
      0.08, 0.15, 0.22, 0.3, 0.37, 0.45, 0.52, 0.6, 0.67, 0.75, 0.82, 0.89,
    ],
  },
  {
    id: 'support',
    name: 'Help articles',
    progress: [
      0.07, 0.16, 0.24, 0.31, 0.4, 0.48, 0.59, 0.66, 0.74, 0.83, 0.94, 1,
    ],
  },
];

const SEPTEMBER = 8;

const DECEMBER = 11;

const JUNE = 5;

export default function Chart06() {
  const [periodIndex, setPeriodIndex] = useState(SEPTEMBER);

  function resetDemo() {
    setPeriodIndex(SEPTEMBER);
  }

  const toYearEnd = positionsTo(SEPTEMBER, DECEMBER);
  const backToJune = positionsTo(DECEMBER, JUNE);
  const toSeptember = positionsTo(JUNE, SEPTEMBER);
  const steps: AutoplayStep[] = [
    ...walkSteps(toYearEnd, setPeriodIndex, { startAfter: 1500, stepMs: 620 }),
    ...walkSteps(backToJune, setPeriodIndex, { startAfter: 2200, stepMs: 130 }),
    ...walkSteps(toSeptember, setPeriodIndex, {
      startAfter: 1600,
      stepMs: 420,
    }),
    { after: 1200, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1800,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[23.5rem] w-full max-w-[26rem]'
    >
      <GoalNumerals
        title='Goals for the year'
        note='Illustrative'
        periods={MONTHS}
        goals={GOALS}
        periodIndex={periodIndex}
        onPeriodIndexChange={setPeriodIndex}
        periodLabel='Month'
        className='w-full'
      />
    </div>
  );
}
