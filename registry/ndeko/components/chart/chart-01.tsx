'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { positionLabelsOf } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import {
  changeWordsOf,
  COUNT_FORMAT,
  dayLabelsOf,
  formatCompact,
  formatCount,
  percentChangeOf,
} from './_parts/format';
import { Legend, type LegendEntry } from './_parts/legend';
import { LINE_STROKE, MorphPath } from './_parts/morph-path';
import { densifyOf, linePathOf, plotPointsOf, yOf } from './_parts/path';
import { PathLayer, PlotFrame } from './_parts/plot';
import { seededRandom } from './_parts/random';
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
  sumOf,
  withZero,
  type Scale,
} from './_parts/scale';
import { markColorOf } from './_parts/series-color';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { readingAloud, useReading } from './_parts/use-reading';

export type LineSeries = {
  id: string;
  name: string;
  /** Fixed per series, so a colour always names the same thing whatever else is shown. */
  series: SeriesSlot;
  /** One value per label. */
  values: readonly number[];
};

export type LineChartProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One label per position: what the readout names and the axis writes. */
  labels: readonly string[];
  /** One to three series. A single series is drawn in the primary colour. */
  series: readonly LineSeries[];
  /** The series taken off the plot. They keep their place and their colour in the legend. */
  hiddenIds: readonly string[];
  onHiddenIdsChange: (hiddenIds: string[]) => void;
  /** What one position is, for screen readers: "day". */
  positionNoun?: string;
  formatValue?: ValueFormat;
  formatTick?: ValueFormat;
  /** A figure or a sentence above the plot. */
  headline?: React.ReactNode;
  /** Controls beside the title, such as a period switch. */
  actions?: React.ReactNode;
  /** Shows the readout at a position without a pointer, for a demonstration. */
  guideIndex?: number | null;
  /** The legend entry a demonstration is pressing. */
  pressedSeriesId?: string | null;
  className?: string;
};

const PLOT_HEIGHT = 176;

const MAX_LINES = 4;

/** Every line is drawn through this many points, so a week can glide into a quarter. */
const MORPH_POINTS = 90;

const FALLBACK_WIDTH = 360;

function visibleOf(
  series: readonly LineSeries[],
  hiddenIds: readonly string[]
) {
  return series.filter((entry) => !hiddenIds.includes(entry.id));
}

/** With every series off the plot keeps the scale of all of them, so its lines do not jump. */
function scaledSeriesOf(
  series: readonly LineSeries[],
  visible: readonly LineSeries[]
) {
  if (visible.length === 0) {
    return series;
  }
  return visible;
}

function scaleOf(
  series: readonly LineSeries[],
  visible: readonly LineSeries[]
) {
  const scaled = scaledSeriesOf(series, visible);
  const values = scaled.flatMap((entry) => entry.values);
  const extent = extentOf(values);
  const domain = withZero(extent);
  return niceScaleOf(domain, MAX_LINES);
}

function valueAt(entry: LineSeries, index: number) {
  return entry.values[index] ?? 0;
}

function topAt(entry: LineSeries, index: number, scale: Scale) {
  const value = valueAt(entry, index);
  return yOf(value, scale, PLOT_HEIGHT);
}

type ValueFormat = (value: number) => string;

function formattedAt(entry: LineSeries, index: number, format: ValueFormat) {
  const value = valueAt(entry, index);
  return format(value);
}

function linePathFor(entry: LineSeries, scale: Scale) {
  const points = plotPointsOf(entry.values, scale, PLOT_HEIGHT);
  const dense = densifyOf(points, MORPH_POINTS);
  return linePathOf(dense);
}

function hiddenLineOf(isHidden: boolean) {
  if (isHidden) {
    return 'opacity-0';
  }
  return undefined;
}

/** The bubble sits above the highest line at that position. */
function readoutTopOf(
  visible: readonly LineSeries[],
  index: number,
  scale: Scale
) {
  const tops = visible.map((entry) => topAt(entry, index, scale));
  if (tops.length === 0) {
    return 0;
  }
  return Math.min(...tops);
}

function toggledIdsOf(hiddenIds: readonly string[], id: string) {
  const isHidden = hiddenIds.includes(id);
  if (isHidden) {
    return hiddenIds.filter((hiddenId) => hiddenId !== id);
  }
  return [...hiddenIds, id];
}

function namesOf(series: readonly LineSeries[]) {
  const names = series.map((entry) => entry.name);
  return names.join(', ');
}

function summaryOf(
  visible: readonly LineSeries[],
  labels: readonly string[],
  positionNoun: string
) {
  if (labels.length === 0) {
    return 'Nothing to draw yet.';
  }
  if (visible.length === 0) {
    return 'Every series is off.';
  }
  const lastIndex = labels.length - 1;
  const names = namesOf(visible);
  return `${names}: one value per ${positionNoun}, from ${labels[0]} to ${labels[lastIndex]}.`;
}

export function LineChart({
  title,
  note,
  labels,
  series,
  hiddenIds,
  onHiddenIdsChange,
  positionNoun = 'point',
  formatValue = formatCount,
  formatTick = formatCompact,
  headline,
  actions,
  guideIndex = null,
  pressedSeriesId = null,
  className,
}: LineChartProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const count = labels.length;
  const lastIndex = Math.max(count - 1, 0);
  const visible = visibleOf(series, hiddenIds);
  const hasVisible = visible.length > 0;
  const hasSeries = series.length > 0;
  const isEverySeriesOff = hasSeries && !hasVisible;
  const scale = scaleOf(series, visible);
  const reading = useReading({ count, defaultIndex: lastIndex, guideIndex });
  const shownIndex = reading.shownIndex;
  const shownLabel = labels[shownIndex] ?? '';
  const readoutRatio = columnCenterOf(shownIndex, Math.max(count, 1));
  const readoutTop = readoutTopOf(visible, shownIndex, scale);
  const isReadoutShown = reading.isActive && hasVisible;
  const axisLabels = positionLabelsOf(labels, width);
  const summary = summaryOf(visible, labels, positionNoun);

  const legend: LegendEntry[] = series.map((entry) => ({
    id: entry.id,
    label: entry.name,
    color: markColorOf(entry.series, series.length),
    isOff: hiddenIds.includes(entry.id),
  }));

  const rows: DataRow[] = labels.map((label, index) => ({
    id: `${index}-${label}`,
    label,
    cells: visible.map((entry) => formattedAt(entry, index, formatValue)),
  }));

  const readings = visible.map((entry) => {
    const value = formattedAt(entry, shownIndex, formatValue);
    return `${entry.name} ${value}`;
  });
  const spokenReading = `${shownLabel}: ${readings.join(', ')}`;

  function toggleSeries(id: string) {
    onHiddenIdsChange(toggledIdsOf(hiddenIds, id));
  }

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
        label={`${title}. Use the arrow keys to read each ${positionNoun}.`}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatTick}
        axisLabels={axisLabels}
        plotRef={plotRef}
        plotProps={reading.handlers}
      >
        <PathLayer height={PLOT_HEIGHT}>
          {series.map((entry) => (
            <MorphPath
              key={entry.id}
              d={linePathFor(entry, scale)}
              className={cn(
                LINE_STROKE,
                'transition-opacity duration-200',
                hiddenLineOf(hiddenIds.includes(entry.id))
              )}
              style={{ stroke: markColorOf(entry.series, series.length) }}
            />
          ))}
        </PathLayer>
        {!hasSeries && (
          <p className='text-muted-foreground absolute inset-0 flex items-center justify-center text-[13px]'>
            Nothing to draw yet
          </p>
        )}
        {isEverySeriesOff && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center transition-opacity duration-200 starting:opacity-0'>
            <p className='text-muted-foreground text-[13px]'>
              Every series is off
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onHiddenIdsChange([])}
            >
              Show all series
            </Button>
          </div>
        )}
        <Readout
          ratio={readoutRatio}
          top={readoutTop}
          isVisible={isReadoutShown}
          isGliding={reading.isGliding}
          marks={visible.map((entry) => (
            <ReadoutDot
              key={entry.id}
              top={topAt(entry, shownIndex, scale)}
              color={markColorOf(entry.series, series.length)}
            />
          ))}
        >
          <ReadoutTitle>{shownLabel}</ReadoutTitle>
          {visible.map((entry) => (
            <ReadoutRow
              key={entry.id}
              value={formattedAt(entry, shownIndex, formatValue)}
              name={entry.name}
              color={markColorOf(entry.series, series.length)}
            />
          ))}
        </Readout>
      </PlotFrame>
      <Legend
        entries={legend}
        label='Series, press one to take it off the plot'
        onToggle={toggleSeries}
        pressedId={pressedSeriesId}
      />
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, spokenReading)}
      />
      <DataTable
        caption={title}
        columns={[positionNoun, ...visible.map((entry) => entry.name)]}
        rows={rows}
      />
    </ChartCard>
  );
}

type PeriodId = '7' | '30' | '90';

type Source = {
  id: string;
  name: string;
  series: SeriesSlot;
  seed: number;
  /** Visits on the first day, the visits gained each day, and how far a day strays from the trend. */
  base: number;
  growth: number;
  swing: number;
};

const PERIODS: Segment<PeriodId>[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const PERIOD_DAYS: Record<PeriodId, number> = { '7': 7, '30': 30, '90': 90 };

/** Twice the longest period, so every period has the same span before it to compare with. */
const HISTORY_DAYS = 180;

const WEEKEND_FACTOR = 0.72;

const SOURCES: Source[] = [
  {
    id: 'search',
    name: 'Search',
    series: 1,
    seed: 11,
    base: 96,
    growth: 0.42,
    swing: 14,
  },
  {
    id: 'direct',
    name: 'Direct',
    series: 2,
    seed: 23,
    base: 82,
    growth: 0.1,
    swing: 11,
  },
  {
    id: 'referral',
    name: 'Referral',
    series: 3,
    seed: 37,
    base: 34,
    growth: 0.16,
    swing: 8,
  },
];

function rhythmOf(day: number) {
  const weekday = day % 7;
  if (weekday >= 5) {
    return WEEKEND_FACTOR;
  }
  return 1;
}

function historyOf(source: Source) {
  const next = seededRandom(source.seed);
  return Array.from({ length: HISTORY_DAYS }, (_, day) => {
    const trend = source.base + source.growth * day;
    const expected = trend * rhythmOf(day);
    const drift = next() - 0.5;
    const visits = expected + drift * 2 * source.swing;
    const whole = Math.round(visits);
    return Math.max(whole, 0);
  });
}

const HISTORY: Record<string, number[]> = Object.fromEntries(
  SOURCES.map((source) => [source.id, historyOf(source)])
);

const DAY_LABELS = dayLabelsOf('2026-01-01', HISTORY_DAYS);

function lastOf<Item>(items: readonly Item[], count: number) {
  return items.slice(items.length - count);
}

function seriesOf(days: number): LineSeries[] {
  return SOURCES.map((source) => ({
    id: source.id,
    name: source.name,
    series: source.series,
    values: lastOf(HISTORY[source.id], days),
  }));
}

/** The visits of the sources still on the plot, over the period and over the same span before it. */
function totalsOf(days: number, hiddenIds: readonly string[]) {
  let current = 0;
  let previous = 0;
  for (const source of SOURCES) {
    if (hiddenIds.includes(source.id)) {
      continue;
    }
    const twoSpans = lastOf(HISTORY[source.id], days * 2);
    const before = twoSpans.slice(0, days);
    const during = twoSpans.slice(days);
    previous += sumOf(before);
    current += sumOf(during);
  }
  return { current, previous };
}

type HeadlineProps = {
  total: number;
  change: string;
};

function Headline({ total, change }: HeadlineProps) {
  /** Alone on its line, the phrase takes its new width at once: its words still roll, and no width is animated frame by frame. */
  const changeWidths = [change];

  return (
    <div className='flex flex-col gap-0.5'>
      <p className='flex items-baseline gap-1.5'>
        <MotionNumber
          value={total}
          format={COUNT_FORMAT}
          className='text-2xl leading-8 font-semibold'
        />
        <span className='text-muted-foreground text-[13px]'>visits</span>
      </p>
      <p className='text-muted-foreground text-xs'>
        <WordRoll text={change} labels={changeWidths} />
      </p>
    </div>
  );
}

const WALK_MONTH = [20, 21, 22, 23, 24, 25, 26, 27];

const WALK_QUARTER = [62, 66, 70, 74, 78, 82];

const WALK_WEEK = [2, 3, 4, 5];

type PressKey = 'referral';

export default function Chart01() {
  const [periodId, setPeriodId] = useState<PeriodId>('30');
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [guide, setGuide] = useState<number | null>(null);
  const { pressed, press } = usePress<PressKey>();
  const days = PERIOD_DAYS[periodId];
  const totals = totalsOf(days, hiddenIds);
  const percent = percentChangeOf(totals.current, totals.previous);
  const change = changeWordsOf(percent, `the ${days} days before`);

  function changePeriod(next: PeriodId) {
    setGuide(null);
    setPeriodId(next);
  }

  function toggleReferral() {
    setHiddenIds((current) => {
      if (current.includes('referral')) {
        return [];
      }
      return ['referral'];
    });
  }

  function resetDemo() {
    setPeriodId('30');
    setHiddenIds([]);
    setGuide(null);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(WALK_MONTH, setGuide, { startAfter: 1100 }),
    { after: 900, run: () => changePeriod('90') },
    ...walkSteps(WALK_QUARTER, setGuide, { startAfter: 1000 }),
    { after: 900, run: () => setGuide(null) },
    { after: 500, run: () => press('referral') },
    { after: PRESS_LEAD_MS, run: toggleReferral },
    { after: 1700, run: () => press('referral') },
    { after: PRESS_LEAD_MS, run: toggleReferral },
    { after: 1100, run: () => changePeriod('7') },
    ...walkSteps(WALK_WEEK, setGuide, { startAfter: 1000, stepMs: 420 }),
    { after: 900, run: () => changePeriod('30') },
    { after: 1200, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 2000,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[24.5rem] w-full max-w-[34rem]'
    >
      <LineChart
        title='Visits by source'
        note='Illustrative'
        labels={lastOf(DAY_LABELS, days)}
        series={seriesOf(days)}
        hiddenIds={hiddenIds}
        onHiddenIdsChange={setHiddenIds}
        positionNoun='day'
        headline={<Headline total={totals.current} change={change} />}
        actions={
          <Segments
            value={periodId}
            segments={PERIODS}
            onValueChange={changePeriod}
            label='Period'
          />
        }
        guideIndex={whileDemonstrating(isAutoplaying, guide)}
        pressedSeriesId={whileDemonstrating(isAutoplaying, pressed)}
        className='w-full'
      />
    </div>
  );
}
