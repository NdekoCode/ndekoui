'use client';

import { useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { positionLabelsOf } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import {
  dayLabelsOf,
  formatCompact,
  formatCount,
  formatSigned,
  nounOf,
  percentChangeOf,
} from './_parts/format';
import { LINE_STROKE, MorphPath } from './_parts/morph-path';
import {
  areaPathOf,
  linePathOf,
  plotPointsOf,
  VIEW_WIDTH,
  yOf,
} from './_parts/path';
import { PathLayer, PlotFrame } from './_parts/plot';
import {
  Readout,
  ReadoutDot,
  ReadoutRow,
  ReadoutTitle,
} from './_parts/readout';
import {
  clamp,
  columnCenterOf,
  extentOf,
  niceScaleOf,
  positionsTo,
} from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { readingAloud, useReading } from './_parts/use-reading';
import { useSvgId } from './_parts/use-svg-id';

type ValueFormat = (value: number) => string;

export type BaselineChartProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One label per position: what the readout names and the axis writes. */
  labels: readonly string[];
  values: readonly number[];
  /** The position every other one is compared with. */
  baselineIndex: number;
  /** A click on a position, or Enter on the one being read. */
  onBaselineChange: (index: number) => void;
  /** What the values count, in the plural: "signups". */
  valueNoun: string;
  /** What one position is: "day". */
  positionNoun?: string;
  formatValue?: ValueFormat;
  formatTick?: ValueFormat;
  /** Controls beside the title. */
  actions?: React.ReactNode;
  /** Shows the readout at a position without a pointer, for a demonstration. */
  guideIndex?: number | null;
  className?: string;
};

const PLOT_HEIGHT = 176;

const MAX_LINES = 4;

const FALLBACK_WIDTH = 360;

/** The clips reach past the plot, so the stroke of a line that touches an edge is not cut in half. */
const CLIP_MARGIN = 8;

const CLIP_TOP = -CLIP_MARGIN;

const CLIP_BOTTOM = PLOT_HEIGHT + CLIP_MARGIN;

const GLIDE = 'transition-transform duration-300 ease-(--ease-out-strong)';

type Side = 'above' | 'below' | 'level';

const SIDE_COLOR: Record<Side, string> = {
  above: 'var(--primary)',
  below: 'var(--destructive)',
  level: 'var(--foreground)',
};

function sideOf(difference: number): Side {
  if (difference > 0) {
    return 'above';
  }
  if (difference < 0) {
    return 'below';
  }
  return 'level';
}

/** A band across the whole plot from one height to another, as the outline of a clip. */
function bandClipOf(top: number, bottom: number) {
  const high = top.toFixed(1);
  const low = bottom.toFixed(1);
  return `M0 ${high} L${VIEW_WIDTH} ${high} L${VIEW_WIDTH} ${low} L0 ${low} Z`;
}

function changeWordsOf(percent: number) {
  if (percent === 0) {
    return 'level';
  }
  const size = Math.abs(percent);
  if (percent > 0) {
    return `up ${size}%`;
  }
  return `down ${size}%`;
}

/** How a position compares with the level, in words: a colour alone would not say it. */
function comparisonOf(difference: number, baselineLabel: string) {
  const side = sideOf(difference);
  if (side === 'level') {
    return `the level, ${baselineLabel}`;
  }
  return `${side} ${baselineLabel}`;
}

type Standing = {
  /** The latest value against the level, as a whole percentage. */
  percent: number;
  /** The positions after the level, and how many of them sit above it. */
  since: number;
  above: number;
};

function standingOf(values: readonly number[], baselineIndex: number) {
  const level = values[baselineIndex] ?? 0;
  const later = values.slice(baselineIndex + 1);
  const latest = later.at(-1) ?? level;
  const higher = later.filter((value) => value > level);
  const standing: Standing = {
    percent: percentChangeOf(latest, level),
    since: later.length,
    above: higher.length,
  };
  return standing;
}

type SentenceProps = {
  standing: Standing;
  baselineLabel: string;
  valueNoun: string;
  positionNoun: string;
};

const FIGURE = 'text-foreground font-medium';

/** The chart in words. Only what changed rolls when the level moves. */
function Sentence({
  standing,
  baselineLabel,
  valueNoun,
  positionNoun,
}: SentenceProps) {
  if (standing.since === 0) {
    return (
      <p className='text-muted-foreground text-sm leading-6 text-pretty'>
        <span className={FIGURE}>{baselineLabel}</span> is the latest{' '}
        {positionNoun}. Pick an earlier one to compare from.
      </p>
    );
  }
  const positions = nounOf(standing.since, positionNoun, `${positionNoun}s`);

  return (
    <p className='text-muted-foreground text-sm leading-6 text-pretty'>
      Since <WordRoll text={baselineLabel} className={FIGURE} />, {valueNoun}{' '}
      are{' '}
      <WordRoll
        text={changeWordsOf(standing.percent)}
        value={standing.percent}
        className={FIGURE}
      />{' '}
      and stayed above that {positionNoun} on{' '}
      <WordRoll
        text={`${standing.above} of ${standing.since}`}
        value={standing.above}
        className={FIGURE}
      />{' '}
      {positions}
    </p>
  );
}

function summaryOf(
  standing: Standing,
  valueNoun: string,
  levelLabel: string,
  positionNoun: string
) {
  const change = changeWordsOf(standing.percent);
  const positions = nounOf(standing.since, positionNoun, `${positionNoun}s`);
  return `${valueNoun} against ${levelLabel}: ${change} since, above it on ${standing.above} of ${standing.since} ${positions}.`;
}

export function BaselineChart({
  title,
  note,
  labels,
  values,
  baselineIndex,
  onBaselineChange,
  valueNoun,
  positionNoun = 'day',
  formatValue = formatCount,
  formatTick = formatCompact,
  actions,
  guideIndex = null,
  className,
}: BaselineChartProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const aboveClipId = useSvgId('above-level');
  const belowClipId = useSvgId('below-level');
  const count = values.length;
  const lastIndex = Math.max(count - 1, 0);
  const levelIndex = clamp(baselineIndex, 0, lastIndex);
  const levelValue = values[levelIndex] ?? 0;
  const levelLabel = labels[levelIndex] ?? '';
  const extent = extentOf(values);
  const scale = niceScaleOf(extent, MAX_LINES);
  const points = plotPointsOf(values, scale, PLOT_HEIGHT);
  const levelY = yOf(levelValue, scale, PLOT_HEIGHT);
  const line = linePathOf(points);
  const area = areaPathOf(points, levelY);
  const standing = standingOf(values, levelIndex);
  const reading = useReading({
    count,
    defaultIndex: lastIndex,
    guideIndex,
    onSelect: onBaselineChange,
  });
  const shownIndex = reading.shownIndex;
  const shownLabel = labels[shownIndex] ?? '';
  const shownNumber = values[shownIndex] ?? 0;
  const shownTop = yOf(shownNumber, scale, PLOT_HEIGHT);
  const shownDifference = shownNumber - levelValue;
  const shownSide = sideOf(shownDifference);
  const shownValue = formatValue(shownNumber);
  const shownComparison = comparisonOf(shownDifference, levelLabel);
  const levelRatio = columnCenterOf(levelIndex, Math.max(count, 1));
  const levelShare = levelRatio * 100;
  const isReadoutShown = reading.isActive && count > 0;
  const shownGap = formatSigned(shownDifference);
  const summary = summaryOf(standing, valueNoun, levelLabel, positionNoun);
  const spokenReading = `${shownLabel}: ${shownValue} ${valueNoun}, ${shownGap}, ${shownComparison}`;

  const rows: DataRow[] = labels.map((label, index) => {
    const value = values[index] ?? 0;
    const difference = value - levelValue;
    return {
      id: `${index}-${label}`,
      label,
      cells: [formatValue(value), formatSigned(difference)],
    };
  });

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      actions={actions}
      className={className}
    >
      <Sentence
        standing={standing}
        baselineLabel={levelLabel}
        valueNoun={valueNoun}
        positionNoun={positionNoun}
      />
      <PlotFrame
        label={`${title}. Use the arrow keys to read each ${positionNoun}, and Enter to compare from it.`}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatTick}
        axisLabels={positionLabelsOf(labels, width)}
        plotRef={plotRef}
        plotProps={reading.handlers}
        plotClassName='cursor-pointer'
      >
        <PathLayer height={PLOT_HEIGHT}>
          <defs>
            <clipPath id={aboveClipId}>
              <MorphPath d={bandClipOf(CLIP_TOP, levelY)} />
            </clipPath>
            <clipPath id={belowClipId}>
              <MorphPath d={bandClipOf(levelY, CLIP_BOTTOM)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${aboveClipId})`}>
            <MorphPath d={area} className='fill-primary/12' />
            <MorphPath d={line} className={cn(LINE_STROKE, 'stroke-primary')} />
          </g>
          <g clipPath={`url(#${belowClipId})`}>
            <MorphPath d={area} className='fill-destructive/12' />
            <MorphPath
              d={line}
              className={cn(LINE_STROKE, 'stroke-destructive')}
            />
          </g>
        </PathLayer>
        <div
          aria-hidden='true'
          className={cn('pointer-events-none absolute inset-x-0 top-0', GLIDE)}
          style={{ transform: `translateY(${levelY}px)` }}
        >
          <span className='hairline-t border-foreground/40 absolute inset-x-0 top-0' />
        </div>
        <div
          aria-hidden='true'
          className={cn(
            'pointer-events-none absolute top-0 left-0 size-0',
            GLIDE
          )}
          style={{ transform: `translate(${levelShare}cqw, ${levelY}px)` }}
        >
          <span className='bg-foreground ring-card absolute size-2.5 -translate-1/2 rounded-full ring-2' />
        </div>
        <Readout
          ratio={columnCenterOf(shownIndex, Math.max(count, 1))}
          top={Math.min(shownTop, levelY)}
          isVisible={isReadoutShown}
          isGliding={reading.isGliding}
          marks={<ReadoutDot top={shownTop} color={SIDE_COLOR[shownSide]} />}
        >
          <ReadoutTitle>{shownLabel}</ReadoutTitle>
          <ReadoutRow value={shownValue} name={valueNoun} />
          <ReadoutRow
            value={shownGap}
            name={shownComparison}
            color={SIDE_COLOR[shownSide]}
          />
        </Readout>
      </PlotFrame>
      <p className='text-muted-foreground text-xs'>
        Click a {positionNoun}, or press Enter on it, to compare from there
      </p>
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, spokenReading)}
      />
      <DataTable
        caption={`${title}, compared with ${levelLabel}`}
        columns={[positionNoun, valueNoun, `Against ${levelLabel}`]}
        rows={rows}
      />
    </ChartCard>
  );
}

const DAYS = dayLabelsOf('2026-03-01', 30);

const SIGNUPS = [
  92, 96, 101, 98, 104, 88, 84, 99, 105, 109, 112, 108, 86, 82, 97, 94, 90, 93,
  79, 76, 88, 95, 104, 110, 118, 121, 104, 99, 124, 128,
];

/** The day the demonstration starts from, and the two it compares from in turn. */
const FIRST_LEVEL = 11;

const DIP_LEVEL = 19;

const PEAK_LEVEL = 25;

const WALK_STEP_MS = 150;

export default function Chart04() {
  const [baselineIndex, setBaselineIndex] = useState(FIRST_LEVEL);
  const [guide, setGuide] = useState<number | null>(null);

  function resetDemo() {
    setBaselineIndex(FIRST_LEVEL);
    setGuide(null);
  }

  const toDip = positionsTo(FIRST_LEVEL, DIP_LEVEL);
  const toPeak = positionsTo(DIP_LEVEL, PEAK_LEVEL);
  const backToFirst = positionsTo(PEAK_LEVEL, FIRST_LEVEL);
  const steps: AutoplayStep[] = [
    { after: 1200, run: () => setGuide(FIRST_LEVEL) },
    ...walkSteps(toDip, setGuide, { startAfter: 500, stepMs: WALK_STEP_MS }),
    { after: 500, run: () => setBaselineIndex(DIP_LEVEL) },
    ...walkSteps(toPeak, setGuide, { startAfter: 1900, stepMs: WALK_STEP_MS }),
    { after: 500, run: () => setBaselineIndex(PEAK_LEVEL) },
    ...walkSteps(backToFirst, setGuide, {
      startAfter: 1900,
      stepMs: WALK_STEP_MS,
    }),
    { after: 500, run: () => setBaselineIndex(FIRST_LEVEL) },
    { after: 1200, run: () => setGuide(null) },
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
      className='flex min-h-[23.5rem] w-full max-w-[34rem]'
    >
      <BaselineChart
        title='Signups per day'
        note='Illustrative'
        labels={DAYS}
        values={SIGNUPS}
        baselineIndex={baselineIndex}
        onBaselineChange={setBaselineIndex}
        valueNoun='signups'
        guideIndex={whileDemonstrating(isAutoplaying, guide)}
        className='w-full'
      />
    </div>
  );
}
