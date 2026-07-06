'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { positionLabelsOf } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import {
  COUNT_FORMAT,
  dayLabelsOf,
  formatCompact,
  formatCount,
} from './_parts/format';
import { LINE_STROKE, MorphPath } from './_parts/morph-path';
import {
  bandPathOf,
  linePathOf,
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
  type Scale,
} from './_parts/scale';
import { TodayMark } from './_parts/today-mark';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { readingAloud, useReading } from './_parts/use-reading';
import { useSvgId } from './_parts/use-svg-id';

type ValueFormat = (value: number) => string;

export type OutlookActual = {
  label: string;
  value: number;
};

export type OutlookForecast = {
  label: string;
  /** The most likely value. */
  median: number;
  /** One standard deviation of the forecast: it grows with the distance from today. */
  spread: number;
};

/** The share of likely outcomes the band holds, in percent. */
export type Confidence = 50 | 80 | 95;

export type OutlookChartProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** What happened, up to today. */
  actuals: readonly OutlookActual[];
  /** What might happen, from the position after today. */
  forecast: readonly OutlookForecast[];
  confidence: Confidence;
  /** What the values count, in the plural: "signups a week". */
  valueNoun: string;
  /** What one position is, for screen readers: "week". */
  positionNoun?: string;
  formatValue?: ValueFormat;
  formatTick?: ValueFormat;
  /** Controls beside the title, such as the confidence switch. */
  actions?: React.ReactNode;
  /** Shows the readout at a position without a pointer, for a demonstration. */
  guideIndex?: number | null;
  className?: string;
};

const PLOT_HEIGHT = 176;

const MAX_LINES = 4;

const FALLBACK_WIDTH = 360;

/** How many standard deviations each side of the median hold that share of the outcomes. */
const DEVIATIONS: Record<Confidence, number> = {
  50: 0.674,
  80: 1.282,
  95: 1.96,
};

/** The axis is fitted to the widest band, so it stays still when the confidence changes. */
const WIDEST = DEVIATIONS[95];

/** The band is three bands of the same faint tint, one inside the other, so its heart looks solid and its edges thin. */
const BAND_LAYERS = [0.34, 0.67, 1];

const LAYER_OPACITY = 0.11;

/** The tint keeps this much of itself at the far end of the forecast. */
const FAR_OPACITY = 0.35;

const BAND_TINT: React.CSSProperties = { stopColor: 'var(--primary)' };

const FIGURE = 'text-foreground font-medium';

type Range = {
  low: number;
  high: number;
};

function rangeOf(point: OutlookForecast, deviations: number): Range {
  const reach = point.spread * deviations;
  const low = point.median - reach;
  const high = point.median + reach;
  return { low, high };
}

function scaleOf(
  actuals: readonly OutlookActual[],
  forecast: readonly OutlookForecast[]
) {
  const values = actuals.map((point) => point.value);
  for (const point of forecast) {
    const widest = rangeOf(point, WIDEST);
    values.push(widest.low, widest.high);
  }
  const extent = extentOf(values);
  return niceScaleOf(extent, MAX_LINES);
}

type Plot = {
  /** Every position, the actuals then the forecast. */
  count: number;
  scale: Scale;
};

function pointOf(index: number, value: number, plot: Plot): Point {
  const share = columnCenterOf(index, plot.count);
  const x = share * VIEW_WIDTH;
  const y = yOf(value, plot.scale, PLOT_HEIGHT);
  return { x, y };
}

function actualPointsOf(actuals: readonly OutlookActual[], plot: Plot) {
  return actuals.map((point, index) => pointOf(index, point.value, plot));
}

/**
 * A line through the forecast, from today outwards, `reach` standard deviations away from the
 * median: above it when `reach` is positive, below when it is negative, on it at zero. It leaves
 * from the last actual value, where nothing is uncertain yet.
 */
function edgeOf(
  today: Point,
  forecast: readonly OutlookForecast[],
  reach: number,
  plot: Plot
) {
  const firstIndex = plot.count - forecast.length;
  const edge = forecast.map((point, index) => {
    const offset = point.spread * reach;
    const value = point.median + offset;
    return pointOf(firstIndex + index, value, plot);
  });
  return [today, ...edge];
}

function bandOf(
  today: Point,
  forecast: readonly OutlookForecast[],
  reach: number,
  plot: Plot
) {
  const upper = edgeOf(today, forecast, reach, plot);
  const lower = edgeOf(today, forecast, -reach, plot);
  return bandPathOf(upper, lower);
}

type Reading = {
  label: string;
  /** The value drawn at this position: what happened, or what is most likely. */
  value: number;
  /** Null for a position that already happened. */
  range: Range | null;
};

function readingAt(
  index: number,
  actuals: readonly OutlookActual[],
  forecast: readonly OutlookForecast[],
  deviations: number
): Reading {
  const actual = actuals[index];
  if (actual) {
    return { label: actual.label, value: actual.value, range: null };
  }
  const point = forecast[index - actuals.length];
  if (!point) {
    return { label: '', value: 0, range: null };
  }
  const range = rangeOf(point, deviations);
  return { label: point.label, value: point.median, range };
}

function rangeWordsOf(range: Range, format: ValueFormat) {
  const low = format(range.low);
  const high = format(range.high);
  return `${low} to ${high}`;
}

function spokenOf(
  reading: Reading,
  valueNoun: string,
  confidence: Confidence,
  format: ValueFormat
) {
  const value = format(reading.value);
  if (!reading.range) {
    return `${reading.label}: ${value} ${valueNoun}`;
  }
  const range = rangeWordsOf(reading.range, format);
  return `${reading.label}: most likely ${value} ${valueNoun}, ${range} at ${confidence}% confidence`;
}

function cellsOf(reading: Reading, format: ValueFormat) {
  const value = format(reading.value);
  if (!reading.range) {
    return [value, '', ''];
  }
  return [value, format(reading.range.low), format(reading.range.high)];
}

export function OutlookChart({
  title,
  note,
  actuals,
  forecast,
  confidence,
  valueNoun,
  positionNoun = 'point',
  formatValue = formatCount,
  formatTick = formatCompact,
  actions,
  guideIndex = null,
  className,
}: OutlookChartProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const fadeId = useSvgId('outlook-fade');
  const count = actuals.length + forecast.length;
  const todayIndex = Math.max(actuals.length - 1, 0);
  const lastIndex = Math.max(count - 1, 0);
  const deviations = DEVIATIONS[confidence];
  const scale = scaleOf(actuals, forecast);
  const plot: Plot = { count: Math.max(count, 1), scale };
  const actualPoints = actualPointsOf(actuals, plot);
  const today = actualPoints.at(-1) ?? { x: 0, y: PLOT_HEIGHT };
  const median = edgeOf(today, forecast, 0, plot);
  const todayShare = today.x / VIEW_WIDTH;
  const reading = useReading({ count, defaultIndex: lastIndex, guideIndex });
  const shown = readingAt(reading.shownIndex, actuals, forecast, deviations);
  const shownTop = yOf(shown.value, scale, PLOT_HEIGHT);
  const bubbleTop = yOf(shown.range?.high ?? shown.value, scale, PLOT_HEIGHT);
  const isReadoutShown = reading.isActive && count > 0;
  const horizon = readingAt(lastIndex, actuals, forecast, deviations);
  const horizonLow = Math.round(horizon.range?.low ?? horizon.value);
  const horizonHigh = Math.round(horizon.range?.high ?? horizon.value);
  const positions = [...actuals, ...forecast];
  const labels = positions.map((point) => point.label);
  const summary = `${valueNoun}: ${actuals.length} positions of history and ${forecast.length} of forecast, one per ${positionNoun}, with the range that holds ${confidence}% of likely outcomes.`;

  const rows: DataRow[] = labels.map((label, index) => {
    const row = readingAt(index, actuals, forecast, deviations);
    return { id: `${index}-${label}`, label, cells: cellsOf(row, formatValue) };
  });

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      actions={actions}
      className={className}
    >
      <p className='text-muted-foreground text-sm leading-6 text-pretty'>
        Likely{' '}
        <MotionNumber
          value={horizonLow}
          format={COUNT_FORMAT}
          className={FIGURE}
        />{' '}
        to{' '}
        <MotionNumber
          value={horizonHigh}
          format={COUNT_FORMAT}
          className={FIGURE}
        />{' '}
        {valueNoun} by <span className={FIGURE}>{horizon.label}</span>, at{' '}
        <MotionNumber value={confidence} suffix='%' className={FIGURE} />{' '}
        confidence
      </p>
      <PlotFrame
        label={`${title}. Use the arrow keys to read each ${positionNoun}.`}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatTick}
        axisLabels={positionLabelsOf(labels, width, todayIndex)}
        plotRef={plotRef}
        plotProps={reading.handlers}
      >
        <PathLayer height={PLOT_HEIGHT}>
          <defs>
            <linearGradient
              id={fadeId}
              gradientUnits='userSpaceOnUse'
              x1={today.x}
              x2={VIEW_WIDTH}
              y1={0}
              y2={0}
            >
              <stop offset='0' style={BAND_TINT} />
              <stop offset='1' stopOpacity={FAR_OPACITY} style={BAND_TINT} />
            </linearGradient>
          </defs>
          {BAND_LAYERS.map((layer) => {
            const reach = deviations * layer;

            return (
              <MorphPath
                key={layer}
                d={bandOf(today, forecast, reach, plot)}
                style={{ fill: `url(#${fadeId})`, fillOpacity: LAYER_OPACITY }}
              />
            );
          })}
          <MorphPath
            d={linePathOf(median)}
            className={cn(
              LINE_STROKE,
              'stroke-primary/70 [stroke-dasharray:5_5]'
            )}
          />
          <MorphPath
            d={linePathOf(actualPoints)}
            className={cn(LINE_STROKE, 'stroke-primary')}
          />
        </PathLayer>
        <TodayMark ratio={todayShare} top={today.y} />
        <Readout
          ratio={columnCenterOf(reading.shownIndex, plot.count)}
          top={bubbleTop}
          isVisible={isReadoutShown}
          isGliding={reading.isGliding}
          marks={<ReadoutDot top={shownTop} color='var(--primary)' />}
        >
          <ReadoutTitle>{shown.label}</ReadoutTitle>
          {!shown.range && (
            <ReadoutRow
              value={formatValue(shown.value)}
              name={valueNoun}
              color='var(--primary)'
            />
          )}
          {shown.range && (
            <>
              <ReadoutRow
                value={formatValue(shown.value)}
                name='most likely'
                color='var(--primary)'
              />
              <span className='text-muted-foreground'>
                Likely between{' '}
                <span className='text-foreground font-medium tabular-nums'>
                  {formatValue(shown.range.low)}
                </span>{' '}
                and{' '}
                <span className='text-foreground font-medium tabular-nums'>
                  {formatValue(shown.range.high)}
                </span>
              </span>
            </>
          )}
        </Readout>
      </PlotFrame>
      <LiveRegion
        message={readingAloud(
          reading.isReadingByKeys,
          spokenOf(shown, valueNoun, confidence, formatValue)
        )}
      />
      <DataTable
        caption={`${title}, with the range at ${confidence}% confidence`}
        columns={[positionNoun, valueNoun, 'Likely low', 'Likely high']}
        rows={rows}
      />
    </ChartCard>
  );
}

const WEEK_COUNT = 20;

const WEEKS = dayLabelsOf('2026-03-02', WEEK_COUNT, 7);

const PAST_SIGNUPS = [
  820, 860, 845, 910, 940, 925, 990, 1040, 1010, 1080, 1130, 1160,
];

const NEXT_SIGNUPS = [
  { median: 1195, spread: 28 },
  { median: 1230, spread: 42 },
  { median: 1262, spread: 54 },
  { median: 1295, spread: 65 },
  { median: 1328, spread: 74 },
  { median: 1360, spread: 83 },
  { median: 1390, spread: 91 },
  { median: 1420, spread: 98 },
];

const ACTUALS: OutlookActual[] = PAST_SIGNUPS.map((value, index) => ({
  label: WEEKS[index],
  value,
}));

const FORECAST: OutlookForecast[] = NEXT_SIGNUPS.map((point, index) => ({
  label: WEEKS[PAST_SIGNUPS.length + index],
  median: point.median,
  spread: point.spread,
}));

type ConfidenceId = '50' | '80' | '95';

const CONFIDENCES: Segment<ConfidenceId>[] = [
  { value: '50', label: '50%' },
  { value: '80', label: '80%' },
  { value: '95', label: '95%' },
];

const CONFIDENCE_OF: Record<ConfidenceId, Confidence> = {
  '50': 50,
  '80': 80,
  '95': 95,
};

/** From the last weeks that happened into the weeks that might. */
const WALK = [9, 10, 11, 12, 13, 14, 15, 16];

export default function Chart05() {
  const [confidenceId, setConfidenceId] = useState<ConfidenceId>('80');
  const [guide, setGuide] = useState<number | null>(null);

  function resetDemo() {
    setConfidenceId('80');
    setGuide(null);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(WALK, setGuide, { startAfter: 1100, stepMs: 300 }),
    { after: 1300, run: () => setConfidenceId('95') },
    { after: 1900, run: () => setConfidenceId('50') },
    { after: 1900, run: () => setConfidenceId('80') },
    { after: 1500, run: () => setGuide(null) },
    { after: 800, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1800,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[22.5rem] w-full max-w-[34rem]'
    >
      <OutlookChart
        title='Signups a week'
        note='Illustrative'
        actuals={ACTUALS}
        forecast={FORECAST}
        confidence={CONFIDENCE_OF[confidenceId]}
        valueNoun='signups a week'
        positionNoun='week'
        actions={
          <Segments
            value={confidenceId}
            segments={CONFIDENCES}
            onValueChange={setConfidenceId}
            label='Confidence of the range'
          />
        }
        guideIndex={whileDemonstrating(isAutoplaying, guide)}
        className='w-full'
      />
    </div>
  );
}
