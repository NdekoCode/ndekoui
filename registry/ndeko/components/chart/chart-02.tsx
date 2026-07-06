'use client';

import { motion, type Transition } from 'motion/react';
import { useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { CategoryAxis, gridToneOf, type AxisLabel } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import {
  ROUNDED_BOTTOM,
  ROUNDED_LEFT,
  ROUNDED_RIGHT,
  ROUNDED_TOP,
  SQUARE,
} from './_parts/corners';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import { formatCompact, formatCount, formatSigned } from './_parts/format';
import { Legend, type LegendEntry } from './_parts/legend';
import { PLOT_SURFACE, PlotFrame } from './_parts/plot';
import { Readout, ReadoutRow, ReadoutTitle } from './_parts/readout';
import {
  clamp,
  columnCenterOf,
  extentOf,
  niceScaleOf,
  percentOf,
  ratioOf,
  sumOf,
  withZero,
  type Domain,
  type Scale,
} from './_parts/scale';
import { markColorOf } from './_parts/series-color';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { activeIndexOf, readingAloud, useReading } from './_parts/use-reading';

export type BarSeries = {
  id: string;
  name: string;
  /** Fixed per series, so a colour always names the same thing whatever else is shown. */
  series: SeriesSlot;
  /** One value per category. A value below zero hangs under the baseline. */
  values: readonly number[];
};

export type BarMode = 'grouped' | 'stacked';

type ValueFormat = (value: number) => string;

export type BarChartProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  categories: readonly string[];
  series: readonly BarSeries[];
  /** Side by side to compare the series, or one on the other to read the total. */
  mode: BarMode;
  /** What one category is, for screen readers: "quarter". */
  categoryNoun?: string;
  formatValue?: ValueFormat;
  formatTick?: ValueFormat;
  /** A figure or a sentence above the plot. */
  headline?: React.ReactNode;
  /** Controls beside the title, such as the switch between the two modes. */
  actions?: React.ReactNode;
  /** Shows the readout of a bar without a pointer, for a demonstration. Bars count across the categories, then across the series. */
  guideIndex?: number | null;
  className?: string;
};

type Orientation = 'vertical' | 'horizontal';

type Bar = {
  id: string;
  categoryIndex: number;
  seriesIndex: number;
  value: number;
  /** Across the categories and along the values, as shares of the plot. */
  bandStart: number;
  bandSize: number;
  valueStart: number;
  valueSize: number;
  /** Only the end that carries the value is rounded: the baseline end and the joints of a stack stay square. */
  hasRoundedEnd: boolean;
};

type Layout = {
  /** The plot in pixels: across the categories, and along the values. */
  bandLength: number;
  valueLength: number;
  scale: Scale;
};

const PLOT_HEIGHT = 176;

const ROW_HEIGHT = 48;

const MAX_THICKNESS = 24;

const MIN_THICKNESS = 3;

const GAP_PX = 2;

/** How much of its band a group of bars takes, and a stack. */
const GROUP_SHARE = 0.72;

const STACK_SHARE = 0.5;

const MAX_LINES = 4;

/** The value axis and its gap, taken from the width of the piece to know the width of the plot. */
const AXIS_ROOM_PX = 44;

/** Below this width the categories no longer fit side by side: the bars lie down, one row each. */
const HORIZONTAL_BELOW_PX = 352;

const FALLBACK_WIDTH = 480;

const REARRANGE: Transition = {
  layout: { duration: 0.35, ease: EASE_OUT_STRONG },
};

const NO_REARRANGE: Transition = { layout: INSTANT };

function rearrangeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return NO_REARRANGE;
  }
  return REARRANGE;
}

function orientationOf(width: number): Orientation {
  if (width < HORIZONTAL_BELOW_PX) {
    return 'horizontal';
  }
  return 'vertical';
}

function valueAt(entry: BarSeries, categoryIndex: number) {
  return entry.values[categoryIndex] ?? 0;
}

function stackedExtentOf(
  categoryCount: number,
  series: readonly BarSeries[]
): Domain {
  let min = 0;
  let max = 0;
  for (let category = 0; category < categoryCount; category += 1) {
    let rise = 0;
    let fall = 0;
    for (const entry of series) {
      const value = valueAt(entry, category);
      rise += Math.max(value, 0);
      fall += Math.min(value, 0);
    }
    max = Math.max(max, rise);
    min = Math.min(min, fall);
  }
  return { min, max };
}

function extentFor(
  mode: BarMode,
  categoryCount: number,
  series: readonly BarSeries[]
) {
  if (mode === 'stacked') {
    return stackedExtentOf(categoryCount, series);
  }
  const values = series.flatMap((entry) => entry.values);
  return extentOf(values);
}

function scaleOf(
  mode: BarMode,
  categoryCount: number,
  series: readonly BarSeries[]
) {
  const extent = extentFor(mode, categoryCount, series);
  const domain = withZero(extent);
  return niceScaleOf(domain, MAX_LINES);
}

function layoutOf(
  orientation: Orientation,
  categoryCount: number,
  plotWidth: number,
  scale: Scale
): Layout {
  if (orientation === 'horizontal') {
    const rowCount = Math.max(categoryCount, 1);
    const bandLength = rowCount * ROW_HEIGHT;
    return { bandLength, valueLength: plotWidth, scale };
  }
  return { bandLength: plotWidth, valueLength: PLOT_HEIGHT, scale };
}

function groupThicknessOf(bandPx: number, seriesCount: number) {
  const room = bandPx * GROUP_SHARE;
  const gapCount = seriesCount - 1;
  const gaps = gapCount * GAP_PX;
  const barsRoom = room - gaps;
  const each = barsRoom / seriesCount;
  return clamp(each, MIN_THICKNESS, MAX_THICKNESS);
}

function stackThicknessOf(bandPx: number) {
  const room = bandPx * STACK_SHARE;
  return clamp(room, MIN_THICKNESS, MAX_THICKNESS);
}

function groupedBarsOf(
  categoryCount: number,
  series: readonly BarSeries[],
  layout: Layout
) {
  const bandPx = layout.bandLength / categoryCount;
  const thickness = groupThicknessOf(bandPx, series.length);
  const pitch = thickness + GAP_PX;
  const pitches = series.length * pitch;
  const groupPx = pitches - GAP_PX;
  const halfGroupPx = groupPx / 2;
  const bandSize = thickness / layout.bandLength;
  const bars: Bar[] = [];
  for (let category = 0; category < categoryCount; category += 1) {
    const centerShare = columnCenterOf(category, categoryCount);
    const centerPx = centerShare * layout.bandLength;
    const groupStartPx = centerPx - halfGroupPx;
    for (const [seriesIndex, entry] of series.entries()) {
      const value = valueAt(entry, category);
      const offsetPx = seriesIndex * pitch;
      const startPx = groupStartPx + offsetPx;
      const low = Math.min(value, 0);
      const high = Math.max(value, 0);
      const valueStart = ratioOf(low, layout.scale);
      const valueEnd = ratioOf(high, layout.scale);
      bars.push({
        id: `${category}-${entry.id}`,
        categoryIndex: category,
        seriesIndex,
        value,
        bandStart: startPx / layout.bandLength,
        bandSize,
        valueStart,
        valueSize: valueEnd - valueStart,
        hasRoundedEnd: true,
      });
    }
  }
  return bars;
}

/** Where a value sits in its stack: values above zero pile up from the baseline, values below hang from it. */
function segmentOf(value: number, rise: number, fall: number) {
  if (value >= 0) {
    const high = rise + value;
    const touchesBaseline = rise === 0;
    return { low: rise, high, touchesBaseline };
  }
  const low = fall + value;
  const touchesBaseline = fall === 0;
  return { low, high: fall, touchesBaseline };
}

function stackedBarsOf(
  categoryCount: number,
  series: readonly BarSeries[],
  layout: Layout
) {
  const bandPx = layout.bandLength / categoryCount;
  const thickness = stackThicknessOf(bandPx);
  const halfThickness = thickness / 2;
  const bandSize = thickness / layout.bandLength;
  const gapShare = GAP_PX / layout.valueLength;
  const bars: Bar[] = [];
  for (let category = 0; category < categoryCount; category += 1) {
    const centerShare = columnCenterOf(category, categoryCount);
    const centerPx = centerShare * layout.bandLength;
    const startPx = centerPx - halfThickness;
    let rise = 0;
    let fall = 0;
    let highest: Bar | null = null;
    let lowest: Bar | null = null;
    for (const [seriesIndex, entry] of series.entries()) {
      const value = valueAt(entry, category);
      const segment = segmentOf(value, rise, fall);
      let valueStart = ratioOf(segment.low, layout.scale);
      let valueEnd = ratioOf(segment.high, layout.scale);
      const isRise = value >= 0;
      const leavesGap = !segment.touchesBaseline;
      if (leavesGap && isRise) {
        valueStart += gapShare;
      }
      if (leavesGap && !isRise) {
        valueEnd -= gapShare;
      }
      const size = valueEnd - valueStart;
      const bar: Bar = {
        id: `${category}-${entry.id}`,
        categoryIndex: category,
        seriesIndex,
        value,
        bandStart: startPx / layout.bandLength,
        bandSize,
        valueStart,
        valueSize: Math.max(size, 0),
        hasRoundedEnd: false,
      };
      if (value > 0) {
        rise = segment.high;
        highest = bar;
      }
      if (value < 0) {
        fall = segment.low;
        lowest = bar;
      }
      bars.push(bar);
    }
    if (highest) {
      highest.hasRoundedEnd = true;
    }
    if (lowest) {
      lowest.hasRoundedEnd = true;
    }
  }
  return bars;
}

function barsOf(
  mode: BarMode,
  categoryCount: number,
  series: readonly BarSeries[],
  layout: Layout
) {
  const isEmpty = categoryCount === 0 || series.length === 0;
  if (isEmpty) {
    return [];
  }
  if (mode === 'stacked') {
    return stackedBarsOf(categoryCount, series, layout);
  }
  return groupedBarsOf(categoryCount, series, layout);
}

/** How far the high end of a bar is from the top of the value axis, as a share of it. */
function fromTopOf(bar: Bar) {
  const valueEnd = bar.valueStart + bar.valueSize;
  return 1 - valueEnd;
}

function boxOf(bar: Bar, orientation: Orientation): React.CSSProperties {
  const bandStart = percentOf(bar.bandStart);
  const bandSize = percentOf(bar.bandSize);
  const valueStart = percentOf(bar.valueStart);
  const valueSize = percentOf(bar.valueSize);
  if (orientation === 'horizontal') {
    return {
      top: bandStart,
      height: bandSize,
      left: valueStart,
      width: valueSize,
    };
  }
  const fromTop = fromTopOf(bar);
  return {
    left: bandStart,
    width: bandSize,
    top: percentOf(fromTop),
    height: valueSize,
  };
}

function roundedEndOf(bar: Bar, orientation: Orientation) {
  if (!bar.hasRoundedEnd) {
    return SQUARE;
  }
  const isRise = bar.value >= 0;
  const isHorizontal = orientation === 'horizontal';
  if (isHorizontal && isRise) {
    return ROUNDED_RIGHT;
  }
  if (isHorizontal) {
    return ROUNDED_LEFT;
  }
  if (isRise) {
    return ROUNDED_TOP;
  }
  return ROUNDED_BOTTOM;
}

/** Where the readout points: above an upright bar, and above the far end of a bar that lies down. */
function anchorOf(bar: Bar, orientation: Orientation, layout: Layout) {
  if (orientation === 'horizontal') {
    const ratio = bar.valueStart + bar.valueSize;
    const top = bar.bandStart * layout.bandLength;
    return { ratio, top };
  }
  const halfBand = bar.bandSize / 2;
  const ratio = bar.bandStart + halfBand;
  const fromTop = fromTopOf(bar);
  const top = fromTop * layout.valueLength;
  return { ratio, top };
}

const NO_ANCHOR = { ratio: 0, top: 0 };

function dimmedOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-55';
  }
  return undefined;
}

/** Bars rearrange when the mode or a value changes, never when the piece is resized. */
function layoutKeyOf(mode: BarMode, series: readonly BarSeries[]) {
  const values = series.map((entry) => entry.values.join(','));
  return `${mode}|${values.join('|')}`;
}

type BarMarksProps = {
  bars: readonly Bar[];
  series: readonly BarSeries[];
  orientation: Orientation;
  layoutKey: string;
  /** The bar being read, or null when none is. */
  activeIndex: number | null;
  onPoint: (index: number) => void;
};

function BarMarks({
  bars,
  series,
  orientation,
  layoutKey,
  activeIndex,
  onPoint,
}: BarMarksProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = rearrangeOf(shouldReduceMotion);
  const isReading = activeIndex !== null;

  return (
    <div aria-hidden='true' className='absolute inset-0'>
      {bars.map((bar, index) => {
        const entry = series[bar.seriesIndex];
        const isDimmed = isReading && index !== activeIndex;

        return (
          <motion.span
            key={bar.id}
            layout
            layoutDependency={layoutKey}
            transition={transition}
            onPointerEnter={() => onPoint(index)}
            className={cn(
              'absolute transition-opacity duration-150',
              dimmedOf(isDimmed)
            )}
            style={{
              ...boxOf(bar, orientation),
              ...roundedEndOf(bar, orientation),
              backgroundColor: markColorOf(entry.series, series.length),
            }}
          >
            <span className='absolute top-1/2 left-1/2 size-full min-h-6 min-w-6 -translate-1/2' />
          </motion.span>
        );
      })}
    </div>
  );
}

type HorizontalFrameProps = {
  label: string;
  categories: readonly string[];
  scale: Scale;
  height: number;
  formatTick: ValueFormat;
  plotProps: React.HTMLAttributes<HTMLDivElement>;
  children: React.ReactNode;
};

/** The plot lying down: one row per category, the values running from left to right. */
function HorizontalFrame({
  label,
  categories,
  scale,
  height,
  formatTick,
  plotProps,
  children,
}: HorizontalFrameProps) {
  const tickLabels: AxisLabel[] = scale.ticks.map((tick) => ({
    id: String(tick),
    text: formatTick(tick),
    ratio: ratioOf(tick, scale),
  }));

  return (
    <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-2'>
      <div aria-hidden='true' className='flex flex-col' style={{ height }}>
        {categories.map((category, index) => (
          <span
            key={`${index}-${category}`}
            className='text-muted-foreground flex min-h-0 flex-1 items-center justify-end text-[11px]'
          >
            {category}
          </span>
        ))}
      </div>
      <div
        role='group'
        tabIndex={0}
        aria-label={label}
        className={PLOT_SURFACE}
        style={{ height }}
        {...plotProps}
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0'
        >
          {scale.ticks.map((tick) => (
            <span
              key={tick}
              className={cn(
                'hairline-l absolute inset-y-0',
                gridToneOf(tick, scale)
              )}
              style={{ left: percentOf(ratioOf(tick, scale)) }}
            />
          ))}
        </div>
        {children}
      </div>
      <span aria-hidden='true' />
      <CategoryAxis labels={tickLabels} className='mt-2' />
    </div>
  );
}

function modeWordsOf(mode: BarMode) {
  if (mode === 'stacked') {
    return 'stacked on one another';
  }
  return 'side by side';
}

function summaryOf(
  categories: readonly string[],
  series: readonly BarSeries[],
  mode: BarMode
) {
  const hasData = categories.length > 0 && series.length > 0;
  if (!hasData) {
    return 'Nothing to draw yet.';
  }
  const names = series.map((entry) => entry.name);
  const nameList = names.join(', ');
  const first = categories[0];
  const last = categories[categories.length - 1];
  const modeWords = modeWordsOf(mode);
  return `${nameList} from ${first} to ${last}, drawn ${modeWords}.`;
}

function formattedAt(
  entry: BarSeries,
  categoryIndex: number,
  format: ValueFormat
) {
  const value = valueAt(entry, categoryIndex);
  return format(value);
}

export function BarChart({
  title,
  note,
  categories,
  series,
  mode,
  categoryNoun = 'category',
  formatValue = formatCount,
  formatTick = formatCompact,
  headline,
  actions,
  guideIndex = null,
  className,
}: BarChartProps) {
  const { plotRef: frameRef, width: frameWidth } = usePlotWidth(FALLBACK_WIDTH);
  const orientation = orientationOf(frameWidth);
  const categoryCount = categories.length;
  const scale = scaleOf(mode, categoryCount, series);
  const roomForPlot = frameWidth - AXIS_ROOM_PX;
  const plotWidth = Math.max(roomForPlot, 1);
  const layout = layoutOf(orientation, categoryCount, plotWidth, scale);
  const bars = barsOf(mode, categoryCount, series, layout);
  const reading = useReading({
    count: bars.length,
    defaultIndex: 0,
    guideIndex,
  });
  const shownBar = bars.at(reading.shownIndex);
  const shownSeries = series.at(shownBar?.seriesIndex ?? 0);
  const shownCategory = categories[shownBar?.categoryIndex ?? 0] ?? '';
  const shownName = shownSeries?.name ?? '';
  const shownValue = formatValue(shownBar?.value ?? 0);
  const anchor = anchorFor(shownBar, orientation, layout);
  const isReadoutShown = reading.isActive && shownBar !== undefined;
  const layoutKey = layoutKeyOf(mode, series);
  const plotLabel = `${title}. Use the arrow keys to read each bar.`;
  const summary = summaryOf(categories, series, mode);
  const spokenReading = `${shownCategory}, ${shownName}: ${shownValue}`;

  const axisLabels: AxisLabel[] = categories.map((category, index) => ({
    id: `${index}-${category}`,
    text: category,
    ratio: columnCenterOf(index, categoryCount),
  }));

  const legend: LegendEntry[] = series.map((entry) => ({
    id: entry.id,
    label: entry.name,
    color: markColorOf(entry.series, series.length),
  }));

  const rows: DataRow[] = categories.map((category, index) => ({
    id: `${index}-${category}`,
    label: category,
    cells: series.map((entry) => formattedAt(entry, index, formatValue)),
  }));

  const marks = (
    <>
      <BarMarks
        bars={bars}
        series={series}
        orientation={orientation}
        layoutKey={layoutKey}
        activeIndex={activeIndexOf(reading.isActive, reading.shownIndex)}
        onPoint={reading.pointTo}
      />
      <Readout
        ratio={anchor.ratio}
        top={anchor.top}
        isVisible={isReadoutShown}
        isGliding={reading.isGliding}
        hasCrosshair={false}
      >
        <ReadoutTitle>{shownCategory}</ReadoutTitle>
        <ReadoutRow
          value={shownValue}
          name={shownName}
          color={colorOf(shownSeries, series.length)}
        />
      </Readout>
    </>
  );

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      actions={actions}
      className={className}
    >
      {headline}
      <div ref={frameRef}>
        {orientation === 'vertical' && (
          <PlotFrame
            label={plotLabel}
            scale={scale}
            height={PLOT_HEIGHT}
            formatTick={formatTick}
            axisLabels={axisLabels}
            axisAlign='center'
            plotProps={reading.markHandlers}
          >
            {marks}
          </PlotFrame>
        )}
        {orientation === 'horizontal' && (
          <HorizontalFrame
            label={plotLabel}
            categories={categories}
            scale={scale}
            height={layout.bandLength}
            formatTick={formatTick}
            plotProps={reading.markHandlers}
          >
            {marks}
          </HorizontalFrame>
        )}
      </div>
      <Legend entries={legend} label='Series' />
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, spokenReading)}
      />
      <DataTable
        caption={title}
        columns={[categoryNoun, ...series.map((entry) => entry.name)]}
        rows={rows}
      />
    </ChartCard>
  );
}

function anchorFor(
  bar: Bar | undefined,
  orientation: Orientation,
  layout: Layout
) {
  if (!bar) {
    return NO_ANCHOR;
  }
  return anchorOf(bar, orientation, layout);
}

function colorOf(entry: BarSeries | undefined, seriesCount: number) {
  if (!entry) {
    return undefined;
  }
  return markColorOf(entry.series, seriesCount);
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const PLANS: BarSeries[] = [
  { id: 'starter', name: 'Starter', series: 1, values: [34, 12, -9, 16] },
  { id: 'team', name: 'Team', series: 2, values: [22, 31, 27, 38] },
  { id: 'business', name: 'Business', series: 3, values: [9, 18, 26, 41] },
];

const MODES: Segment<BarMode>[] = [
  { value: 'grouped', label: 'Grouped' },
  { value: 'stacked', label: 'Stacked' },
];

type PlanTotal = {
  plan: BarSeries;
  total: number;
};

function planTotalsOf(plans: readonly BarSeries[]): PlanTotal[] {
  return plans.map((plan) => ({ plan, total: sumOf(plan.values) }));
}

function leaderOf(totals: readonly PlanTotal[]) {
  let leader = totals[0];
  for (const candidate of totals) {
    if (candidate.total > leader.total) {
      leader = candidate;
    }
  }
  return leader;
}

type Loss = {
  plan: BarSeries;
  quarter: string;
  seats: number;
};

/** The worst quarter of any plan, when one of them closed below zero. */
function deepestLossOf(plans: readonly BarSeries[]) {
  let deepest: Loss | null = null;
  for (const plan of plans) {
    for (const [index, value] of plan.values.entries()) {
      const isLoss = value < 0;
      const isDeeper = deepest === null || value < deepest.seats;
      if (isLoss && isDeeper) {
        deepest = { plan, quarter: QUARTERS[index], seats: value };
      }
    }
  }
  return deepest;
}

const PLAN_TOTALS = planTotalsOf(PLANS);

const ALL_SEATS = PLANS.flatMap((plan) => plan.values);

const NET_SEATS = sumOf(ALL_SEATS);

const LEADER = leaderOf(PLAN_TOTALS);

const DEEPEST_LOSS = deepestLossOf(PLANS);

function lossSentenceOf(loss: Loss | null) {
  if (!loss) {
    return 'No plan lost seats in any quarter.';
  }
  const seats = Math.abs(loss.seats);
  return `${loss.plan.name} lost ${seats} in ${loss.quarter}.`;
}

function Headline() {
  return (
    <div className='flex flex-col gap-0.5'>
      <p className='flex items-baseline gap-1.5'>
        <span className='text-2xl leading-8 font-semibold tabular-nums'>
          {formatSigned(NET_SEATS)}
        </span>
        <span className='text-muted-foreground text-[13px]'>
          net seats this year
        </span>
      </p>
      <p className='text-muted-foreground text-xs text-pretty'>
        {LEADER.plan.name} added the most, {formatCount(LEADER.total)}.{' '}
        {lossSentenceOf(DEEPEST_LOSS)}
      </p>
    </div>
  );
}

const WALK_GROUPED = [0, 1, 2, 6, 7, 8];

const WALK_STACKED = [6, 7, 8, 9, 10, 11];

export default function Chart02() {
  const [mode, setMode] = useState<BarMode>('grouped');
  const [guide, setGuide] = useState<number | null>(null);

  function changeMode(next: BarMode) {
    setGuide(null);
    setMode(next);
  }

  function resetDemo() {
    setMode('grouped');
    setGuide(null);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(WALK_GROUPED, setGuide, { startAfter: 1100, stepMs: 380 }),
    { after: 1000, run: () => changeMode('stacked') },
    ...walkSteps(WALK_STACKED, setGuide, { startAfter: 1300, stepMs: 380 }),
    { after: 1000, run: () => changeMode('grouped') },
    { after: 1400, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1800,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[24.5rem] w-full max-w-[34rem]'
    >
      <BarChart
        title='Net new seats by plan'
        note='Illustrative'
        categories={QUARTERS}
        series={PLANS}
        mode={mode}
        categoryNoun='quarter'
        formatValue={formatSigned}
        headline={<Headline />}
        actions={
          <Segments
            value={mode}
            segments={MODES}
            onValueChange={changeMode}
            label='Arrangement of the bars'
          />
        }
        guideIndex={whileDemonstrating(isAutoplaying, guide)}
        className='w-full'
      />
    </div>
  );
}
