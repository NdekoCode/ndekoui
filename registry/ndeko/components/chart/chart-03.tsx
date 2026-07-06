'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { positionLabelsOf } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import {
  changeWordsOf,
  dayLabelsOf,
  formatCompact,
  formatCount,
  formatUsd,
  percentChangeOf,
} from './_parts/format';
import { LINE_STROKE, MorphPath } from './_parts/morph-path';
import {
  areaPathOf,
  densifyOf,
  linePathOf,
  plotPointsOf,
  VIEW_WIDTH,
  yOf,
  type Point,
} from './_parts/path';
import { PathLayer, PlotFrame } from './_parts/plot';
import {
  Readout,
  ReadoutDot,
  ReadoutRow,
  ReadoutTitle,
} from './_parts/readout';
import {
  columnCenterOf,
  extentOf,
  niceScaleOf,
  percentOf,
  sumOf,
  withZero,
} from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { readingAloud, useReading } from './_parts/use-reading';

type ValueFormat = (value: number) => string;

const SPARK_HEIGHT = 28;

/** Room above and below the curve, so its 2px stroke and its end dot are never cut. */
const SPARK_INSET = 4;

const SPARK_INSETS = 2 * SPARK_INSET;

const SPARK_DRAWN_HEIGHT = SPARK_HEIGHT - SPARK_INSETS;

function lowered(point: Point): Point {
  return { x: point.x, y: point.y + SPARK_INSET };
}

function endStyleOf(end: Point): React.CSSProperties {
  const share = end.x / VIEW_WIDTH;
  return { left: percentOf(share), top: end.y };
}

export type SparklineProps = {
  values: readonly number[];
  /** What the curve shows, for screen readers: a sparkline has no axis to say it. */
  label: string;
  className?: string;
};

/** A curve with no axis: its shape and where it ends. The end wears a dot ringed in the colour of the surface. */
export function Sparkline({ values, label, className }: SparklineProps) {
  const domain = extentOf(values);
  const points = plotPointsOf(values, domain, SPARK_DRAWN_HEIGHT);
  const curve = points.map((point) => lowered(point));
  const end = curve.at(-1);

  return (
    <span
      role='img'
      aria-label={label}
      className={cn('relative block w-full', className)}
      style={{ height: SPARK_HEIGHT }}
    >
      <svg
        aria-hidden='true'
        viewBox={`0 0 ${VIEW_WIDTH} ${SPARK_HEIGHT}`}
        preserveAspectRatio='none'
        className='absolute inset-0 size-full overflow-visible'
      >
        <path
          d={linePathOf(curve)}
          vectorEffect='non-scaling-stroke'
          className={cn(LINE_STROKE, 'stroke-primary')}
        />
      </svg>
      {end && (
        <span
          aria-hidden='true'
          className='bg-primary ring-card absolute size-2 -translate-1/2 rounded-full ring-2'
          style={endStyleOf(end)}
        />
      )}
    </span>
  );
}

export type AreaChartProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One label per position: what the readout names and the axis writes. */
  labels: readonly string[];
  values: readonly number[];
  /** What the values count: "Signups". */
  valueName: string;
  /** What one position is, for screen readers: "day". */
  positionNoun?: string;
  formatValue?: ValueFormat;
  formatTick?: ValueFormat;
  /** What sits above the plot: a figure, a sentence, or the tiles that pick what it draws. */
  headline?: React.ReactNode;
  /** Controls beside the title. */
  actions?: React.ReactNode;
  /** Shows the readout at a position without a pointer, for a demonstration. */
  guideIndex?: number | null;
  className?: string;
};

const PLOT_HEIGHT = 160;

const MAX_LINES = 4;

/** The curve is drawn through this many points, so two series of different lengths can glide into each other. */
const MORPH_POINTS = 60;

const FALLBACK_WIDTH = 360;

export function AreaChart({
  title,
  note,
  labels,
  values,
  valueName,
  positionNoun = 'point',
  formatValue = formatCount,
  formatTick = formatCompact,
  headline,
  actions,
  guideIndex = null,
  className,
}: AreaChartProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const count = values.length;
  const lastIndex = Math.max(count - 1, 0);
  const extent = extentOf(values);
  const domain = withZero(extent);
  const scale = niceScaleOf(domain, MAX_LINES);
  const points = plotPointsOf(values, scale, PLOT_HEIGHT);
  const dense = densifyOf(points, MORPH_POINTS);
  const baseline = yOf(0, scale, PLOT_HEIGHT);
  const reading = useReading({ count, defaultIndex: lastIndex, guideIndex });
  const shownIndex = reading.shownIndex;
  const shownLabel = labels[shownIndex] ?? '';
  const shownNumber = values[shownIndex] ?? 0;
  const shownValue = formatValue(shownNumber);
  const shownTop = yOf(shownNumber, scale, PLOT_HEIGHT);
  const isReadoutShown = reading.isActive && count > 0;
  const firstLabel = labels[0] ?? '';
  const lastLabel = labels[lastIndex] ?? '';
  const summary = `${valueName}: one value per ${positionNoun}, from ${firstLabel} to ${lastLabel}.`;
  const spokenReading = `${shownLabel}: ${shownValue}`;

  const rows: DataRow[] = labels.map((label, index) => {
    const value = values[index] ?? 0;
    return { id: `${index}-${label}`, label, cells: [formatValue(value)] };
  });

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      actions={actions}
      className={className}
    >
      {headline}
      <PlotFrame
        label={`${valueName}. Use the arrow keys to read each ${positionNoun}.`}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatTick}
        axisLabels={positionLabelsOf(labels, width)}
        plotRef={plotRef}
        plotProps={reading.handlers}
      >
        <PathLayer height={PLOT_HEIGHT}>
          <MorphPath
            d={areaPathOf(dense, baseline)}
            className='fill-primary/10'
          />
          <MorphPath
            d={linePathOf(dense)}
            className={cn(LINE_STROKE, 'stroke-primary')}
          />
        </PathLayer>
        <Readout
          ratio={columnCenterOf(shownIndex, Math.max(count, 1))}
          top={shownTop}
          isVisible={isReadoutShown}
          isGliding={reading.isGliding}
          marks={<ReadoutDot top={shownTop} color='var(--primary)' />}
        >
          <ReadoutTitle>{shownLabel}</ReadoutTitle>
          <ReadoutRow
            value={shownValue}
            name={valueName}
            color='var(--primary)'
          />
        </Readout>
      </PlotFrame>
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, spokenReading)}
      />
      <DataTable
        caption={`${valueName} per ${positionNoun}`}
        columns={[positionNoun, valueName]}
        rows={rows}
      />
    </ChartCard>
  );
}

type MetricId = 'signups' | 'trials' | 'conversions' | 'revenue';

type Metric = {
  id: MetricId;
  label: string;
  /** Fourteen days: last week, then this week. */
  values: number[];
  format: ValueFormat;
  formatTick: ValueFormat;
};

const WEEK = 7;

const METRICS: Metric[] = [
  {
    id: 'signups',
    label: 'Signups',
    values: [48, 52, 55, 49, 51, 38, 35, 56, 61, 63, 58, 64, 44, 41],
    format: formatCount,
    formatTick: formatCompact,
  },
  {
    id: 'trials',
    label: 'Trials started',
    values: [19, 22, 21, 24, 20, 14, 12, 22, 25, 24, 27, 23, 15, 13],
    format: formatCount,
    formatTick: formatCompact,
  },
  {
    id: 'conversions',
    label: 'New customers',
    values: [6, 7, 5, 8, 6, 4, 3, 5, 6, 6, 7, 5, 3, 3],
    format: formatCount,
    formatTick: formatCompact,
  },
  {
    id: 'revenue',
    label: 'Revenue',
    values: [
      1180, 1240, 1090, 1320, 1210, 860, 790, 1260, 1310, 1380, 1290, 1420, 940,
      880,
    ],
    format: formatUsd,
    formatTick: formatUsd,
  },
];

const DAYS = dayLabelsOf('2026-05-04', WEEK * 2);

function metricOf(id: MetricId) {
  const metric = METRICS.find((candidate) => candidate.id === id);
  return metric ?? METRICS[0];
}

function weekTotalsOf(metric: Metric) {
  const lastWeek = metric.values.slice(0, WEEK);
  const thisWeek = metric.values.slice(WEEK);
  return { current: sumOf(thisWeek), previous: sumOf(lastWeek) };
}

function changeOf(metric: Metric) {
  const totals = weekTotalsOf(metric);
  const percent = percentChangeOf(totals.current, totals.previous);
  return changeWordsOf(percent, 'last week');
}

type StatTilesProps = {
  metrics: readonly Metric[];
  value: MetricId;
  onValueChange: (id: MetricId) => void;
};

/** Each tile is a tab that picks the curve the plot draws, and shows that same curve in small. */
function StatTiles({ metrics, value, onValueChange }: StatTilesProps) {
  function changeValue(nextValue: unknown) {
    const metric = metrics.find((candidate) => candidate.id === nextValue);
    if (metric) {
      onValueChange(metric.id);
    }
  }

  return (
    <TabsPrimitive.Root value={value} onValueChange={changeValue}>
      <TabsPrimitive.List
        aria-label='Figure drawn in the chart'
        className='relative -mx-2 grid grid-cols-2 gap-x-1 gap-y-2 @md:grid-cols-4'
      >
        {metrics.map((metric) => {
          const totals = weekTotalsOf(metric);
          const change = changeOf(metric);

          return (
            <TabsPrimitive.Tab
              key={metric.id}
              value={metric.id}
              className='group/tile hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-lg px-2 pt-2 pb-3 text-start transition-colors duration-150 outline-none focus-visible:ring-[3px]'
            >
              <span className='text-muted-foreground group-data-active/tile:text-foreground text-xs font-medium transition-colors duration-150'>
                {metric.label}
              </span>
              <span className='text-lg leading-7 font-semibold tabular-nums'>
                {metric.format(totals.current)}
              </span>
              <Sparkline
                values={metric.values}
                label={`${metric.label} over the last 14 days`}
              />
              <span className='text-muted-foreground text-xs text-pretty'>
                {change}
              </span>
            </TabsPrimitive.Tab>
          );
        })}
        <TabsPrimitive.Indicator className='bg-primary pointer-events-none absolute top-0 left-0 h-0.5 w-[calc(var(--active-tab-width)-1rem)] translate-x-[calc(var(--active-tab-left)+0.5rem)] translate-y-[calc(var(--active-tab-top)+var(--active-tab-height)-2px)] rounded-full transition-[translate,width] duration-300 ease-(--ease-out-strong)' />
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

const WALK = [8, 9, 10, 11, 12];

export default function Chart03() {
  const [metricId, setMetricId] = useState<MetricId>('signups');
  const [guide, setGuide] = useState<number | null>(null);
  const metric = metricOf(metricId);

  function pickMetric(next: MetricId) {
    setGuide(null);
    setMetricId(next);
  }

  function resetDemo() {
    setMetricId('signups');
    setGuide(null);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(WALK, setGuide, { startAfter: 1100, stepMs: 320 }),
    { after: 900, run: () => pickMetric('trials') },
    { after: 1700, run: () => pickMetric('conversions') },
    ...walkSteps(WALK, setGuide, { startAfter: 1100, stepMs: 320 }),
    { after: 900, run: () => pickMetric('revenue') },
    { after: 1900, run: () => pickMetric('signups') },
    { after: 1200, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1800,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[26rem] w-full max-w-[34rem]'
    >
      <AreaChart
        title='This week against last week'
        note='Illustrative'
        labels={DAYS}
        values={metric.values}
        valueName={metric.label}
        positionNoun='day'
        formatValue={metric.format}
        formatTick={metric.formatTick}
        headline={
          <StatTiles
            metrics={METRICS}
            value={metricId}
            onValueChange={pickMetric}
          />
        }
        guideIndex={whileDemonstrating(isAutoplaying, guide)}
        className='w-full'
      />
    </div>
  );
}
