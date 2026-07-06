'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';

import { CategoryAxis, LABEL_ROOM_PX, type AxisLabel } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps } from './_parts/demo';
import { formatCount } from './_parts/format';
import { PLOT_SURFACE } from './_parts/plot';
import { clamp, positionsTo, sumOf } from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { useStepDrag } from './_parts/use-step-drag';

export type HistogramBin = {
  /** Where the bin starts and where it ends, in the unit of the measure. */
  from: number;
  to: number;
  /** How many readings fell in it. */
  count: number;
};

export type DotHistogramProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** The bins from the lowest to the highest, each as wide as the others. */
  bins: readonly HistogramBin[];
  /** How many readings one dot stands for. */
  perDot: number;
  /** The edge the target sits on: 0 is before the first bin, `bins.length` is after the last. */
  targetEdge: number;
  onTargetEdgeChange: (edge: number) => void;
  /** The unit of the measure, written after a figure: "ms". */
  unit: string;
  /** What is counted, in the plural: "requests". */
  noun: string;
  className?: string;
};

const DOT_PX = 10;

const DOT_GAP_PX = 2;

const DOT_PITCH_PX = DOT_PX + DOT_GAP_PX;

/** Room above the tallest column for the label of the target. */
const PIN_ROOM_PX = 28;

/** Columns change colour one after the other, starting from the one beside the pin. */
const STAGGER_MS = 30;

/** One label of the axis every this many edges: the first step that leaves each label its room, so the values stay round. */
const LABEL_STEPS = [4, 8];

const WIDEST_LABEL_STEP = 16;

const FALLBACK_WIDTH = 420;

function labelStepFor(binCount: number, plotWidth: number) {
  for (const step of LABEL_STEPS) {
    const gapCount = Math.floor(binCount / step);
    const labelCount = gapCount + 1;
    const room = plotWidth / labelCount;
    if (room >= LABEL_ROOM_PX) {
      return step;
    }
  }
  return WIDEST_LABEL_STEP;
}

function dotCountOf(bin: HistogramBin, perDot: number) {
  const dots = bin.count / perDot;
  return Math.round(dots);
}

function tallestOf(bins: readonly HistogramBin[], perDot: number) {
  let tallest = 1;
  for (const bin of bins) {
    const dots = dotCountOf(bin, perDot);
    tallest = Math.max(tallest, dots);
  }
  return tallest;
}

/** The value an edge sits on: the start of the bin after it, or the end of the last bin. */
function edgeValueOf(bins: readonly HistogramBin[], edge: number) {
  const bin = bins[edge];
  if (bin) {
    return bin.from;
  }
  const last = bins.at(-1);
  return last?.to ?? 0;
}

function countPast(bins: readonly HistogramBin[], edge: number) {
  const past = bins.slice(edge);
  const counts = past.map((bin) => bin.count);
  return sumOf(counts);
}

/** How many columns lie between a column and the pin, on whichever side of it the column is. */
function distanceFromPin(column: number, edge: number) {
  if (column >= edge) {
    return column - edge;
  }
  const lastBefore = edge - 1;
  return lastBefore - column;
}

function dotToneOf(isPastTarget: boolean) {
  if (isPastTarget) {
    return 'bg-destructive';
  }
  return 'bg-primary';
}

type DotColumnProps = {
  dotCount: number;
  isPastTarget: boolean;
  /** How many columns away from the pin this one is: the further, the later it changes colour. */
  distance: number;
};

function DotColumn({ dotCount, isPastTarget, distance }: DotColumnProps) {
  const dots = Array.from({ length: dotCount }, (_, index) => index);
  const delayMs = distance * STAGGER_MS;

  return (
    <span className='flex min-w-0 flex-1 flex-col-reverse items-center gap-0.5'>
      {dots.map((dot) => (
        <span
          key={dot}
          className={cn(
            'size-2.5 shrink-0 rounded-full transition-colors duration-200 ease-(--ease-out-strong)',
            dotToneOf(isPastTarget)
          )}
          style={{ transitionDelay: `${delayMs}ms` }}
        />
      ))}
    </span>
  );
}

function axisLabelsOf(
  bins: readonly HistogramBin[],
  unit: string,
  plotWidth: number
) {
  const edgeCount = bins.length + 1;
  const edges = Array.from({ length: edgeCount }, (_, edge) => edge);
  const step = labelStepFor(bins.length, plotWidth);
  const written = edges.filter((edge) => edge % step === 0);
  return written.map((edge): AxisLabel => {
    const edgeValue = edgeValueOf(bins, edge);
    const value = formatCount(edgeValue);
    const isLast = edge === bins.length;
    return {
      id: String(edge),
      text: labelTextOf(value, unit, isLast),
      ratio: edge / bins.length,
    };
  });
}

/** Only the last label carries the unit, so the axis is not a row of the same two letters. */
function labelTextOf(value: string, unit: string, isLast: boolean) {
  if (isLast) {
    return `${value}${unit}`;
  }
  return value;
}

function rangeTextOf(bin: HistogramBin, unit: string) {
  const from = formatCount(bin.from);
  const to = formatCount(bin.to);
  return `${from} to ${to}${unit}`;
}

function standingOf(isPastTarget: boolean) {
  if (isPastTarget) {
    return 'Slower than the target';
  }
  return 'Within the target';
}

export function DotHistogram({
  title,
  note,
  bins,
  perDot,
  targetEdge,
  onTargetEdgeChange,
  unit,
  noun,
  className,
}: DotHistogramProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const binCount = Math.max(bins.length, 1);
  const edge = clamp(targetEdge, 0, bins.length);
  const drag = useStepDrag({
    count: bins.length + 1,
    index: edge,
    onIndexChange: onTargetEdgeChange,
    placement: 'edges',
  });
  const tallest = tallestOf(bins, perDot);
  const columnsHeight = tallest * DOT_PITCH_PX;
  const plotHeight = columnsHeight + PIN_ROOM_PX;
  const counts = bins.map((bin) => bin.count);
  const counted = sumOf(counts);
  const total = Math.max(counted, 1);
  const slowCount = countPast(bins, edge);
  const slowShare = slowCount / total;
  const slowPercent = Math.round(slowShare * 100);
  const edgeValue = edgeValueOf(bins, edge);
  const targetValue = formatCount(edgeValue);
  const targetText = `${targetValue}${unit}`;
  const sentence = `${slowPercent}% of ${noun} are slower than ${targetText}`;
  const pinRatio = edge / binCount;
  const pinShare = pinRatio * 100;

  const rows: DataRow[] = bins.map((bin, column) => ({
    id: String(bin.from),
    label: rangeTextOf(bin, unit),
    cells: [formatCount(bin.count), standingOf(column >= edge)],
  }));

  return (
    <ChartCard
      title={title}
      note={note}
      summary={`${sentence}. One dot is ${perDot} ${noun}.`}
      className={className}
    >
      <p className='flex flex-wrap items-baseline gap-x-1.5'>
        <MotionNumber
          value={slowPercent}
          suffix='%'
          className='text-2xl leading-8 font-semibold'
        />
        <span className='text-muted-foreground text-[13px]'>
          of {noun} are slower than{' '}
          <WordRoll
            text={targetText}
            value={edge}
            className='text-foreground font-medium tabular-nums'
          />
        </span>
      </p>
      <div className='flex flex-col'>
        <div
          ref={plotRef}
          role='slider'
          tabIndex={0}
          aria-label={`Target, in ${unit}`}
          aria-orientation='horizontal'
          aria-valuemin={0}
          aria-valuemax={bins.length}
          aria-valuenow={edge}
          aria-valuetext={sentence}
          className={cn(
            PLOT_SURFACE,
            'flex cursor-ew-resize items-end select-none'
          )}
          style={{ height: plotHeight }}
          {...drag.sliderProps}
        >
          {bins.map((bin, column) => (
            <DotColumn
              key={bin.from}
              dotCount={dotCountOf(bin, perDot)}
              isPastTarget={column >= edge}
              distance={distanceFromPin(column, edge)}
            />
          ))}
          <span
            aria-hidden='true'
            className='pointer-events-none absolute inset-y-0 left-0 w-0 transition-transform duration-150 ease-(--ease-out-strong)'
            style={{ transform: `translateX(${pinShare}cqw)` }}
          >
            <span className='bg-foreground absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 rounded-full' />
            <span className='bg-foreground ring-card absolute -bottom-1.5 left-0 size-3 -translate-x-1/2 rounded-full ring-2' />
            <span
              className='bg-foreground text-background absolute top-0 left-0 flex h-5 w-max items-center rounded-md px-1.5 text-[11px] font-medium tabular-nums transition-transform duration-150 ease-(--ease-out-strong)'
              style={{ transform: `translateX(-${pinShare}%)` }}
            >
              {targetText}
            </span>
          </span>
        </div>
        <span aria-hidden='true' className='hairline-t border-border' />
        <CategoryAxis
          labels={axisLabelsOf(bins, unit, width)}
          className='mt-2'
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        One dot is {perDot} {noun}. Drag the pin, or use the arrow keys, to move
        the target
      </p>
      <DataTable
        caption={title}
        columns={['Range', noun, 'Against the target']}
        rows={rows}
      />
    </ChartCard>
  );
}

const BIN_WIDTH_MS = 100;

const REQUEST_COUNTS = [
  20, 60, 140, 200, 220, 180, 140, 120, 100, 80, 60, 60, 40, 40, 20, 20,
];

const BINS: HistogramBin[] = REQUEST_COUNTS.map((count, index) => {
  const from = index * BIN_WIDTH_MS;
  const to = from + BIN_WIDTH_MS;
  return { from, to, count };
});

const RESTING_EDGE = 8;

const STRICT_EDGE = 5;

const LOOSE_EDGE = 12;

export default function Chart10() {
  const [targetEdge, setTargetEdge] = useState(RESTING_EDGE);

  function resetDemo() {
    setTargetEdge(RESTING_EDGE);
  }

  const toStrict = positionsTo(RESTING_EDGE, STRICT_EDGE);
  const toLoose = positionsTo(STRICT_EDGE, LOOSE_EDGE);
  const toResting = positionsTo(LOOSE_EDGE, RESTING_EDGE);
  const steps: AutoplayStep[] = [
    ...walkSteps(toStrict, setTargetEdge, { startAfter: 1500, stepMs: 260 }),
    ...walkSteps(toLoose, setTargetEdge, { startAfter: 1800, stepMs: 110 }),
    ...walkSteps(toResting, setTargetEdge, { startAfter: 1800, stepMs: 260 }),
    { after: 1400, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[21.5rem] w-full max-w-[30rem]'
    >
      <DotHistogram
        title='Response time'
        note='Illustrative'
        bins={BINS}
        perDot={20}
        targetEdge={targetEdge}
        onTargetEdgeChange={setTargetEdge}
        unit='ms'
        noun='requests'
        className='w-full'
      />
    </div>
  );
}
