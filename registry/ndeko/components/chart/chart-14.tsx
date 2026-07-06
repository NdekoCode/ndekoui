'use client';

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { CategoryAxis, type AxisLabel } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { formatUsd } from './_parts/format';
import { yOf } from './_parts/path';
import { PlotFrame } from './_parts/plot';
import {
  clamp,
  columnCenterOf,
  extentOf,
  niceScaleOf,
  percentOf,
  type Scale,
} from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';

type ValueFormat = (value: number) => string;

export type BridgeStep = {
  id: string;
  name: string;
  /** What the step adds to the total, or takes from it when below zero. */
  change: number;
};

export type BridgeHandle = {
  /** Empties the chart and pours the total across it again. */
  pour: () => void;
};

export type BridgeProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** Where the total starts, and what the first and the last column are called. */
  startValue: number;
  startLabel: string;
  endLabel: string;
  steps: readonly BridgeStep[];
  formatValue?: ValueFormat;
  /** The same format as options, for the total that rolls. */
  numberFormat?: Intl.NumberFormatOptions;
  /** Pour the total again from outside, for a demonstration. */
  handleRef?: React.Ref<BridgeHandle>;
  className?: string;
};

type Column = {
  id: string;
  name: string;
  /** The total before and after the column. The first and the last column do not move it. */
  before: number;
  after: number;
  change: number;
  isLevel: boolean;
};

const PLOT_HEIGHT = 176;

const MAX_LINES = 5;

/** A bar fills while the pour crosses this share of its column, then stays full. */
const FILL_SPAN = 0.85;

/** How long the pour takes to cross one column when it is replayed, in seconds. */
const SECONDS_PER_COLUMN = 0.5;

const STEP_SECONDS = 0.35;

const USD_ROLL_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

function columnsOf(
  startValue: number,
  startLabel: string,
  endLabel: string,
  steps: readonly BridgeStep[]
) {
  const first: Column = {
    id: 'start',
    name: startLabel,
    before: startValue,
    after: startValue,
    change: 0,
    isLevel: true,
  };
  const columns = [first];
  let total = startValue;
  for (const step of steps) {
    const before = total;
    total += step.change;
    columns.push({
      id: step.id,
      name: step.name,
      before,
      after: total,
      change: step.change,
      isLevel: false,
    });
  }
  columns.push({
    id: 'end',
    name: endLabel,
    before: total,
    after: total,
    change: 0,
    isLevel: true,
  });
  return columns;
}

function scaleOf(columns: readonly Column[]) {
  const totals = columns.flatMap((column) => [column.before, column.after]);
  const extent = extentOf(totals);
  return niceScaleOf(extent, MAX_LINES);
}

/** How many columns the pour has crossed completely. */
function crossedCountOf(pour: number, columnCount: number) {
  const crossed = Math.floor(pour * columnCount + 0.0001);
  return clamp(crossed, 0, columnCount);
}

/** The total once the pour has crossed that many columns. */
function totalAfter(columns: readonly Column[], crossedCount: number) {
  const lastCrossed = Math.max(crossedCount - 1, 0);
  const column = columns[lastCrossed];
  return column?.after ?? 0;
}

function standingOf(
  columns: readonly Column[],
  crossedCount: number,
  startLabel: string
) {
  const lastIndex = columns.length - 1;
  const lastCrossed = crossedCount - 1;
  const column = columns[lastCrossed];
  const isAtStart = lastCrossed <= 0 || column === undefined;
  if (isAtStart) {
    return startLabel;
  }
  if (lastCrossed === lastIndex) {
    return column.name;
  }
  return `after ${column.name.toLowerCase()}`;
}

/**
 * Every phrase the standing can read. Given to the roll, its line keeps the widest one, so the
 * words change on each step without its width being animated frame by frame.
 */
function standingsOf(columns: readonly Column[], startLabel: string) {
  const standings: string[] = [];
  for (let crossed = 0; crossed <= columns.length; crossed += 1) {
    const standing = standingOf(columns, crossed, startLabel);
    standings.push(standing);
  }
  return standings;
}

/** The shares of the plot the pour has crossed when the fill of a bar starts, and when it is full. */
function fillRangeOf(index: number, columnCount: number) {
  const start = index / columnCount;
  const span = FILL_SPAN / columnCount;
  const end = start + span;
  return [start, end];
}

/** Where the fill waits before the pour reaches its bar: under a gain, above a loss. */
function emptyOffsetOf(isGain: boolean) {
  if (isGain) {
    return '100%';
  }
  return '-100%';
}

type BarFillProps = {
  pour: MotionValue<number>;
  index: number;
  columnCount: number;
  isGain: boolean;
};

/**
 * The fill follows the pour through a motion value written to this element alone. A value set on
 * the plot and inherited by every mark restyled the whole plot on each frame. At rest the pour is
 * whole and the bar full, which is the picture before any script runs.
 */
function BarFill({ pour, index, columnCount, isGain }: BarFillProps) {
  const range = fillRangeOf(index, columnCount);
  const empty = emptyOffsetOf(isGain);
  const offset = useTransform(pour, range, [empty, '0%']);

  return (
    <motion.span
      className={cn(
        'absolute inset-0',
        isGain && 'bg-primary rounded-t-[4px]',
        !isGain && 'bg-destructive rounded-b-[4px]'
      )}
      style={{ y: offset }}
    />
  );
}

function cursorTransformOf(pour: number) {
  const percent = pour * 100;
  return `translateX(${percent}cqw)`;
}

function shownUnless(isHidden: boolean) {
  if (isHidden) {
    return 'opacity-0';
  }
  return undefined;
}

function changeTextOf(change: number, format: ValueFormat) {
  const amount = Math.abs(change);
  const size = format(amount);
  if (change < 0) {
    return `-${size}`;
  }
  return `+${size}`;
}

type BridgeColumnProps = {
  column: Column;
  index: number;
  columnCount: number;
  scale: Scale;
  pour: MotionValue<number>;
  /** True once the pour has gone past the column: its figure and the line to the next column show. */
  isCrossed: boolean;
  format: ValueFormat;
};

/** The room above a level for its figure, and above a bar for its change. */
const LEVEL_LABEL_LIFT = 22;

const BAR_LABEL_LIFT = 18;

const BAR_LABEL_DROP = 4;

/** A level is a mark at the height of the total. A step is a bar that floats from the total before it to the total after it. */
function BridgeColumn({
  column,
  index,
  columnCount,
  scale,
  pour,
  isCrossed,
  format,
}: BridgeColumnProps) {
  const centre = columnCenterOf(index, columnCount);
  const left = percentOf(centre);
  const beforeY = yOf(column.before, scale, PLOT_HEIGHT);
  const afterY = yOf(column.after, scale, PLOT_HEIGHT);
  const top = Math.min(beforeY, afterY);
  const height = Math.abs(afterY - beforeY);
  const isGain = column.change >= 0;
  const isLast = index === columnCount - 1;
  const hidden = shownUnless(!isCrossed);
  const columnWidth = 100 / columnCount;
  const link = (
    <span
      className={cn(
        'hairline-t border-foreground/25 absolute left-0 transition-opacity duration-200',
        hidden,
        isLast && 'hidden'
      )}
      style={{ top: afterY, width: `${columnWidth}cqw` }}
    />
  );

  if (column.isLevel) {
    return (
      <div className='absolute inset-y-0 w-0' style={{ left }}>
        {link}
        <span
          className={cn(
            'bg-foreground absolute left-0 h-1 w-8 -translate-1/2 rounded-full transition-opacity duration-200',
            hidden
          )}
          style={{ top: afterY }}
        />
        <span
          className={cn(
            'absolute left-0 -translate-x-1/2 text-[11px] font-medium whitespace-nowrap tabular-nums transition-opacity duration-200',
            hidden
          )}
          style={{ top: afterY - LEVEL_LABEL_LIFT }}
        >
          {format(column.after)}
        </span>
      </div>
    );
  }

  return (
    <div className='absolute inset-y-0 w-0' style={{ left }}>
      {link}
      <span
        className='absolute left-0 w-6 -translate-x-1/2 overflow-hidden'
        style={{ top, height }}
      >
        <BarFill
          pour={pour}
          index={index}
          columnCount={columnCount}
          isGain={isGain}
        />
      </span>
      <span
        className={cn(
          'text-muted-foreground absolute left-0 -translate-x-1/2 text-[11px] whitespace-nowrap tabular-nums transition-opacity duration-200',
          hidden
        )}
        style={{ top: labelTopOf(top, height, isGain) }}
      >
        {changeTextOf(column.change, format)}
      </span>
    </div>
  );
}

function isEvenIndex(index: number) {
  return index % 2 === 0;
}

type StepAxisProps = {
  labels: readonly AxisLabel[];
};

/**
 * The names under the bars. On a piece too narrow for them side by side, every other name drops to
 * a second row, so each one has the room of two columns; the hidden table keeps them all in order.
 */
function StepAxis({ labels }: StepAxisProps) {
  const upper = labels.filter((_, index) => isEvenIndex(index));
  const lower = labels.filter((_, index) => !isEvenIndex(index));

  return (
    <div className='mt-2'>
      <CategoryAxis
        labels={labels}
        align='center'
        className='hidden @lg:block'
      />
      <div className='flex flex-col gap-0.5 @lg:hidden'>
        <CategoryAxis labels={upper} align='center' />
        <CategoryAxis labels={lower} align='center' />
      </div>
    </div>
  );
}

/** A gain is labelled above its bar and a loss under it: on the side the bar points to. */
function labelTopOf(top: number, height: number, isGain: boolean) {
  if (isGain) {
    return top - BAR_LABEL_LIFT;
  }
  const bottom = top + height;
  return bottom + BAR_LABEL_DROP;
}

export function Bridge({
  title,
  note,
  startValue,
  startLabel,
  endLabel,
  steps,
  formatValue = formatUsd,
  numberFormat = USD_ROLL_FORMAT,
  handleRef,
  className,
}: BridgeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const columns = columnsOf(startValue, startLabel, endLabel, steps);
  const columnCount = columns.length;
  const scale = scaleOf(columns);
  const pour = useMotionValue(1);
  const cursorTransform = useTransform(pour, cursorTransformOf);
  const pouring = useRef<ReturnType<typeof animate> | null>(null);
  const isDragging = useRef(false);
  const [crossedCount, setCrossedCount] = useState(columnCount);
  const total = totalAfter(columns, crossedCount);
  const standing = standingOf(columns, crossedCount, startLabel);
  const standings = standingsOf(columns, startLabel);
  const isPoured = crossedCount === columnCount;
  const endTotal = columns.at(-1)?.after ?? startValue;
  const startText = formatValue(startValue);
  const endText = formatValue(endTotal);
  const totalText = formatValue(total);
  const summary = `${startLabel} ${startText}, ${endLabel} ${endText}, through ${steps.length} steps.`;

  useMotionValueEvent(pour, 'change', (latest) => {
    setCrossedCount(crossedCountOf(latest, columnCount));
  });

  useEffect(() => {
    return () => pouring.current?.stop();
  }, []);

  function stopPouring() {
    pouring.current?.stop();
    pouring.current = null;
  }

  function pourTo(target: number, seconds: number) {
    stopPouring();
    if (shouldReduceMotion) {
      pour.set(target);
      return;
    }
    pouring.current = animate(pour, target, {
      duration: seconds,
      ease: EASE_OUT_STRONG,
    });
  }

  function pourAgain() {
    stopPouring();
    if (shouldReduceMotion) {
      pour.set(1);
      return;
    }
    pour.set(0);
    pouring.current = animate(pour, 1, {
      duration: columnCount * SECONDS_PER_COLUMN,
      ease: 'linear',
    });
  }

  useImperativeHandle(handleRef, () => ({ pour: pourAgain }));

  function pourAt(event: React.PointerEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - box.left;
    const share = offset / box.width;
    pour.set(clamp(share, 0, 1));
  }

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    stopPouring();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDragging.current = true;
    pourAt(event);
  }

  function drag(event: React.PointerEvent<HTMLElement>) {
    if (isDragging.current) {
      pourAt(event);
    }
  }

  function endDrag() {
    isDragging.current = false;
  }

  function pressKey(event: React.KeyboardEvent<HTMLElement>) {
    const target = keyTargetOf(event.key, crossedCount, columnCount);
    if (target === null) {
      return;
    }
    event.preventDefault();
    pourTo(target / columnCount, STEP_SECONDS);
  }

  const axisLabels: AxisLabel[] = columns.map((column, index) => ({
    id: column.id,
    text: column.name,
    ratio: columnCenterOf(index, columnCount),
    isStrong: column.isLevel,
  }));

  const rows: DataRow[] = columns.map((column) => ({
    id: column.id,
    label: column.name,
    cells: [cellChangeOf(column, formatValue), formatValue(column.after)],
  }));

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      className={className}
      actions={<ReplayButton isShown onReplay={pourAgain} label='Pour again' />}
    >
      <div className='flex flex-col gap-0.5'>
        <MotionNumber
          value={total}
          format={numberFormat}
          className='text-2xl leading-8 font-semibold'
        />
        <p className='text-muted-foreground text-xs'>
          <WordRoll text={standing} labels={standings} value={crossedCount} />
        </p>
      </div>
      <PlotFrame
        label={title}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatValue}
        axisLabels={axisLabels}
        categoryAxis={<StepAxis labels={axisLabels} />}
        valueAxisClassName='hidden @xs:block'
        className='gap-x-0 @xs:gap-x-2'
        plotClassName='cursor-ew-resize touch-pan-y select-none'
        plotProps={{
          role: 'slider',
          'aria-label': `${title}. Pour the total across the steps with the arrow keys.`,
          'aria-orientation': 'horizontal',
          'aria-valuemin': 0,
          'aria-valuemax': columnCount,
          'aria-valuenow': crossedCount,
          'aria-valuetext': `${totalText}, ${standing}`,
          onPointerDown: startDrag,
          onPointerMove: drag,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
          onKeyDown: pressKey,
        }}
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0'
        >
          {columns.map((column, index) => (
            <BridgeColumn
              key={column.id}
              column={column}
              index={index}
              columnCount={columnCount}
              scale={scale}
              pour={pour}
              isCrossed={isCrossedAt(index, crossedCount)}
              format={formatValue}
            />
          ))}
          <motion.span
            className={cn(
              'bg-foreground/25 absolute inset-y-0 left-0 w-px transition-opacity duration-200',
              shownUnless(isPoured)
            )}
            style={{ transform: cursorTransform }}
          />
        </div>
      </PlotFrame>
      <p className='text-muted-foreground text-xs'>
        Drag across the steps, or use the arrow keys, to pour the total
      </p>
      <DataTable
        caption={title}
        columns={['Step', 'Change', 'Total after it']}
        rows={rows}
      />
    </ChartCard>
  );
}

/** The first column is where the pour starts from: its level is there before anything is poured. */
function isCrossedAt(index: number, crossedCount: number) {
  const isStart = index === 0;
  return isStart || index < crossedCount;
}

function cellChangeOf(column: Column, format: ValueFormat) {
  if (column.isLevel) {
    return '';
  }
  return changeTextOf(column.change, format);
}

/** How many columns to have crossed after a key: one more, one fewer, none or all of them. */
function keyTargetOf(key: string, crossedCount: number, columnCount: number) {
  const isForward = key === 'ArrowRight' || key === 'ArrowUp';
  const isBackward = key === 'ArrowLeft' || key === 'ArrowDown';
  if (isForward) {
    return Math.min(crossedCount + 1, columnCount);
  }
  if (isBackward) {
    return Math.max(crossedCount - 1, 0);
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return columnCount;
  }
  return null;
}

const MRR_STEPS: BridgeStep[] = [
  { id: 'new', name: 'New', change: 6400 },
  { id: 'expansion', name: 'Expansion', change: 3100 },
  { id: 'contraction', name: 'Contraction', change: -1800 },
  { id: 'churn', name: 'Churn', change: -2600 },
];

const MRR_LAST_MONTH = 48_200;

/** The pour crosses six columns: the round waits for it, then leaves the full chart to be read. */
const POUR_MS = 6 * SECONDS_PER_COLUMN * 1000;

const READ_AFTER_MS = POUR_MS + 2600;

export default function Chart14() {
  const handle = useRef<BridgeHandle>(null);

  const steps: AutoplayStep[] = [
    { after: 1800, run: () => handle.current?.pour() },
    { after: READ_AFTER_MS, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1200,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[23rem] w-full max-w-[34rem]'
    >
      <Bridge
        title='Monthly recurring revenue'
        note='Illustrative'
        startValue={MRR_LAST_MONTH}
        startLabel='Last month'
        endLabel='This month'
        steps={MRR_STEPS}
        handleRef={handle}
        className='w-full'
      />
    </div>
  );
}
