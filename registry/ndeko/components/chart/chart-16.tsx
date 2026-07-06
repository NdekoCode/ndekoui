'use client';

import { useMemo, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import {
  typingSteps,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import {
  hold,
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { positionLabelsOf } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { ChipButton } from './_parts/chip-button';
import { DataTable, type DataRow } from './_parts/data-table';
import { formatUsd, nounOf } from './_parts/format';
import { Legend, type LegendEntry } from './_parts/legend';
import { LINE_STROKE, MorphPath } from './_parts/morph-path';
import { linePathOf, VIEW_WIDTH, yOf, type Point } from './_parts/path';
import { PathLayer, PlotFrame } from './_parts/plot';
import { QuestionForm } from './_parts/question-form';
import { seededRandom, spreadOf } from './_parts/random';
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
  withZero,
  type Scale,
} from './_parts/scale';
import { TodayMark } from './_parts/today-mark';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { readingAloud, useReading } from './_parts/use-reading';
import { WrappingRoll } from './_parts/wrapping-roll';

type ValueFormat = (value: number) => string;

/** One line for the forecast, or a swarm of the futures it could become. */
export type ForecastView = 'line' | 'range';

export type ForecastWhatIfProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One label per month: the months that happened, then the months ahead. */
  labels: readonly string[];
  /** The cash at the end of each month that happened. The last one is today. */
  actuals: readonly number[];
  /** The cash the plan expects at the end of each month ahead. It may fall below zero: the chart stops at zero. */
  plan: readonly number[];
  /** The cash at the end of each month ahead with the what-if, or the plan when there is none. */
  forecast: readonly number[];
  /** How far the cash flow of a month can stray from the forecast: each likely future drifts and wanders within it. */
  monthlySpread: number;
  view: ForecastView;
  onViewChange: (view: ForecastView) => void;
  /** The what-if as it was understood: "Two engineers from Mar 2026, $36K a month". Null on the plan. */
  whatIf: string | null;
  /** Leaves the what-if and goes back to the plan. */
  onClear: () => void;
  question: string;
  onQuestionChange: (question: string) => void;
  onAsk: (question: string) => void;
  /** What-ifs offered under the field. */
  suggestions: readonly string[];
  /** Said under the field when a what-if was not understood: what to try next. */
  hint?: string | null;
  formatValue?: ValueFormat;
  /** Shows Try held down, for a demonstration that presses it. */
  isTryPressed?: boolean;
  className?: string;
};

const PLOT_HEIGHT = 176;

const MAX_LINES = 4;

const FALLBACK_WIDTH = 420;

/** How many likely futures the range is read from, and the share of them left out at each end. */
const FUTURE_COUNT = 30;

const TAIL_SHARE = 0.1;

const TAILS_IN_TEN = TAIL_SHARE * 20;

const KEPT_SHARE_IN_TEN = 10 - TAILS_IN_TEN;

const KEPT_IN_TEN = Math.round(KEPT_SHARE_IN_TEN);

const LIKELY_WORDS = `in ${KEPT_IN_TEN} of 10 likely futures`;

/** The part of a future's spread that is surprise from month to month; the rest is a drift that builds up. */
const SURPRISE_SHARE = 0.4;

/** Spreads the seeds of the futures over the whole range of the generator, so no two of them start alike. */
const SEED_STEP = 2_654_435_761;

const CASH_COLOR = 'var(--primary)';

const PLAN_COLOR = 'color-mix(in oklab, var(--foreground) 35%, transparent)';

const FORECAST_DASH = 'stroke-primary [stroke-dasharray:5_5]';

const FUTURE_STROKE =
  'stroke-primary fill-none stroke-1 [stroke-linecap:round] [stroke-linejoin:round]';

const GLIDE =
  'transition-[transform,opacity] duration-300 ease-(--ease-out-strong)';

const OUT_DOT =
  'bg-primary ring-card absolute top-0 left-0 size-2.5 -translate-1/2 rounded-full ring-2';

const UNIT = 'text-muted-foreground text-[13px] font-normal';

const ON_PLAN = 'No what-if yet, the forecast follows the plan';

const VIEWS: Segment<ForecastView>[] = [
  { value: 'line', label: 'Line' },
  { value: 'range', label: 'Range' },
];

const LEGEND: LegendEntry[] = [
  { id: 'cash', label: 'Cash', color: CASH_COLOR },
  { id: 'plan', label: 'Plan', color: PLAN_COLOR },
];

const TABLE_COLUMNS = [
  'Month',
  'Cash',
  'Plan',
  'Forecast',
  'Likely low',
  'Likely high',
];

const RANKS = Array.from({ length: FUTURE_COUNT }, (_, rank) => rank);

/** Cash that has run out stays at zero: it does not come back on its own. */
function flooredOf(balances: readonly number[]) {
  let isOut = false;
  return balances.map((balance) => {
    if (balance <= 0) {
      isOut = true;
    }
    if (isOut) {
      return 0;
    }
    return balance;
  });
}

/** The whole months the cash lasts, or null when it lasts past the last month drawn. */
function runwayOf(balances: readonly number[]) {
  const outIndex = balances.findIndex((balance) => balance <= 0);
  if (outIndex === -1) {
    return null;
  }
  return outIndex;
}

/**
 * Where a future sits among the others, from -1 to 1: most of them near the middle and a few at the
 * edges, so the heart of the swarm looks solid and its edges thin.
 */
function placeOf(rank: number) {
  const middle = rank + 0.5;
  const share = middle / FUTURE_COUNT;
  if (share < 0.5) {
    const doubled = share * 2;
    const rise = Math.sqrt(doubled);
    return rise - 1;
  }
  const left = 1 - share;
  const doubled = left * 2;
  const fall = Math.sqrt(doubled);
  return 1 - fall;
}

/** One likely future: the forecast plus a drift that builds month after month, and small surprises on the way. */
function futureOf(forecast: readonly number[], spread: number, rank: number) {
  const order = rank + 1;
  const seed = Math.imul(order, SEED_STEP);
  const next = seededRandom(seed);
  const place = placeOf(rank);
  const drift = place * spread;
  const surpriseSize = spread * SURPRISE_SHARE;
  let strayed = 0;
  return forecast.map((balance) => {
    const surprise = spreadOf(next) * surpriseSize;
    const step = drift + surprise;
    strayed += step;
    return balance + strayed;
  });
}

function futuresOf(forecast: readonly number[], spread: number) {
  return RANKS.map((rank) => futureOf(forecast, spread, rank));
}

type RunwayRange = {
  /** Null when even that future lasts past the last month drawn. */
  low: number | null;
  high: number | null;
};

function lastingOf(runway: number | null) {
  if (runway === null) {
    return Number.POSITIVE_INFINITY;
  }
  return runway;
}

function byLasting(first: number | null, second: number | null) {
  const firstLasting = lastingOf(first);
  const secondLasting = lastingOf(second);
  if (firstLasting === secondLasting) {
    return 0;
  }
  return firstLasting - secondLasting;
}

function tailCountOf(count: number) {
  const tail = count * TAIL_SHARE;
  return Math.floor(tail);
}

/** The runways most futures fall between, once the tenth that runs out soonest and the tenth that lasts longest are left out. */
function runwayRangeOf(futures: readonly (readonly number[])[]): RunwayRange {
  const runways = futures.map((future) => runwayOf(future));
  const ordered = [...runways].sort(byLasting);
  const tail = tailCountOf(ordered.length);
  const lastIndex = ordered.length - 1;
  const highIndex = lastIndex - tail;
  return { low: ordered[tail] ?? null, high: ordered[highIndex] ?? null };
}

type Band = {
  low: number;
  high: number;
};

function bandAt(futures: readonly (readonly number[])[], month: number): Band {
  const values = futures.map((future) => future[month] ?? 0);
  const ordered = [...values].sort((first, second) => first - second);
  const tail = tailCountOf(ordered.length);
  const lastIndex = ordered.length - 1;
  const highIndex = lastIndex - tail;
  return { low: ordered[tail] ?? 0, high: ordered[highIndex] ?? 0 };
}

type Months = {
  value: number;
  /** True when the cash lasts past the last month drawn: the figure is that many months and more. */
  isBeyond: boolean;
};

type Runway = {
  line: Months;
  low: Months;
  high: Months;
};

function monthsOf(runway: number | null, horizon: number): Months {
  if (runway === null) {
    return { value: horizon, isBeyond: true };
  }
  return { value: runway, isBeyond: false };
}

function runwayModelOf(
  line: number | null,
  range: RunwayRange,
  horizon: number
): Runway {
  return {
    line: monthsOf(line, horizon),
    low: monthsOf(range.low, horizon),
    high: monthsOf(range.high, horizon),
  };
}

function plusOf(months: Months) {
  if (months.isBeyond) {
    return '+';
  }
  return undefined;
}

function monthsTextOf(months: Months) {
  const plus = plusOf(months) ?? '';
  return `${months.value}${plus}`;
}

function isSameMonths(first: Months, second: Months) {
  const isSameValue = first.value === second.value;
  const isSameReach = first.isBeyond === second.isBeyond;
  return isSameValue && isSameReach;
}

/** A range whose two ends meet is said as one figure. */
function isSpread(runway: Runway) {
  return !isSameMonths(runway.low, runway.high);
}

function figureWordOf(key: string, months: Months): WordRollWord {
  return {
    key,
    text: monthsTextOf(months),
    node: <MotionNumber value={months.value} suffix={plusOf(months)} />,
  };
}

function unitWordOf(months: Months): WordRollWord {
  const unit = nounOf(months.value, 'month', 'months');
  return {
    key: 'unit',
    text: unit,
    node: <span className={UNIT}>{unit}</span>,
  };
}

const TO_WORD: WordRollWord = {
  key: 'to',
  text: 'to',
  node: <span className={UNIT}>to</span>,
};

/** The runway in words that roll: the figure keeps its place and its digits turn, the words around it come and go. */
function runwayWordsOf(view: ForecastView, runway: Runway): WordRollWord[] {
  if (view === 'line') {
    return [figureWordOf('low', runway.line), unitWordOf(runway.line)];
  }
  if (!isSpread(runway)) {
    return [figureWordOf('low', runway.low), unitWordOf(runway.low)];
  }
  return [
    figureWordOf('low', runway.low),
    TO_WORD,
    figureWordOf('high', runway.high),
    unitWordOf(runway.high),
  ];
}

function leadOf(view: ForecastView, runway: Runway) {
  if (view === 'line') {
    return runway.line.value;
  }
  return runway.low.value;
}

function wordTextOf(word: WordRollWord) {
  if (typeof word === 'string') {
    return word;
  }
  return word.text;
}

function spokenWordsOf(words: readonly WordRollWord[]) {
  const texts = words.map((word) => wordTextOf(word));
  return texts.join(' ');
}

function planFigureOf(view: ForecastView, plan: Runway) {
  if (view === 'line') {
    return monthsTextOf(plan.line);
  }
  if (!isSpread(plan)) {
    return monthsTextOf(plan.low);
  }
  const low = monthsTextOf(plan.low);
  const high = monthsTextOf(plan.high);
  return `${low} to ${high}`;
}

function lineComparisonOf(hasWhatIf: boolean, plan: Runway) {
  if (!hasWhatIf) {
    return 'on the current plan';
  }
  const figure = planFigureOf('line', plan);
  return `was ${figure} on plan`;
}

function rangeComparisonOf(hasWhatIf: boolean, plan: Runway) {
  if (!hasWhatIf) {
    return LIKELY_WORDS;
  }
  const figure = planFigureOf('range', plan);
  return `${LIKELY_WORDS}, was ${figure}`;
}

function comparisonOf(view: ForecastView, hasWhatIf: boolean, plan: Runway) {
  if (view === 'line') {
    return lineComparisonOf(hasWhatIf, plan);
  }
  return rangeComparisonOf(hasWhatIf, plan);
}

type Plot = {
  count: number;
  scale: Scale;
};

function pointAt(index: number, value: number, plot: Plot): Point {
  const share = columnCenterOf(index, plot.count);
  const x = share * VIEW_WIDTH;
  const y = yOf(value, plot.scale, PLOT_HEIGHT);
  return { x, y };
}

function pathFrom(firstIndex: number, values: readonly number[], plot: Plot) {
  const points = values.map((value, offset) => {
    const index = firstIndex + offset;
    return pointAt(index, value, plot);
  });
  return linePathOf(points);
}

type Start = {
  index: number;
  cash: number;
};

function aheadPathOf(start: Start, ahead: readonly number[], plot: Plot) {
  const values = [start.cash, ...ahead];
  return pathFrom(start.index, values, plot);
}

function scaleOf(
  actuals: readonly number[],
  plan: readonly number[],
  forecast: readonly number[],
  futures: readonly (readonly number[])[]
) {
  const futureValues = futures.flat();
  const values = [...actuals, ...plan, ...forecast, ...futureValues];
  const extent = extentOf(values);
  const domain = withZero(extent);
  return niceScaleOf(domain, MAX_LINES);
}

/** On the line view the futures lie folded on the forecast, so switching view spreads them out from it. */
function futureShapeOf(view: ForecastView, future: string, forecast: string) {
  if (view === 'range') {
    return future;
  }
  return forecast;
}

function shownIn(view: ForecastView, shownView: ForecastView) {
  if (view === shownView) {
    return undefined;
  }
  return 'opacity-0';
}

function futureToneOf(view: ForecastView) {
  if (view === 'range') {
    return 'opacity-20';
  }
  return 'opacity-0';
}

/** Where the month the cash runs out sits across the plot, or null when it lasts past the last month. */
function outShareOf(runway: number | null, todayIndex: number, count: number) {
  if (runway === null) {
    return null;
  }
  const monthsAhead = runway + 1;
  const outIndex = todayIndex + monthsAhead;
  const lastIndex = count - 1;
  const index = Math.min(outIndex, lastIndex);
  return columnCenterOf(index, count);
}

type OutSpan = {
  from: number | null;
  to: number | null;
};

function outSpanOf(
  view: ForecastView,
  runway: number | null,
  range: RunwayRange,
  todayIndex: number,
  count: number
): OutSpan {
  if (view === 'line') {
    const share = outShareOf(runway, todayIndex, count);
    return { from: share, to: share };
  }
  const from = outShareOf(range.low, todayIndex, count);
  const to = outShareOf(range.high, todayIndex, count);
  return { from, to };
}

function fadedUnless(isShown: boolean) {
  if (isShown) {
    return undefined;
  }
  return 'opacity-0';
}

type OutMarksProps = {
  span: OutSpan;
  /** Pixels from the top of the plot down to zero. */
  zeroTop: number;
};

/**
 * Where the cash runs out, on the zero line: one mark under the line, or the soonest and the latest
 * of the likely futures with a bar between them. The marks only move, so the one mark parts in two.
 * When the latest futures outlast the plot, the bar runs to its edge.
 */
function OutMarks({ span, zeroTop }: OutMarksProps) {
  const hasFrom = span.from !== null;
  const hasTo = span.to !== null;
  const from = span.from ?? 0;
  const to = span.to ?? 1;
  const reach = to - from;
  const fromPercent = from * 100;
  const toPercent = to * 100;

  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-x-0 top-0 h-0'
      style={{ transform: `translateY(${zeroTop}px)` }}
    >
      <span
        className={cn(
          'bg-primary/30 absolute top-0 left-0 h-1 w-full origin-left -translate-y-1/2',
          GLIDE,
          fadedUnless(hasFrom)
        )}
        style={{ transform: `translateX(${fromPercent}cqw) scaleX(${reach})` }}
      />
      <span
        className={cn(OUT_DOT, GLIDE, fadedUnless(hasFrom))}
        style={{ transform: `translateX(${fromPercent}cqw)` }}
      />
      <span
        className={cn(OUT_DOT, GLIDE, fadedUnless(hasTo))}
        style={{ transform: `translateX(${toPercent}cqw)` }}
      />
    </div>
  );
}

type PastMonth = {
  kind: 'past';
  label: string;
  cash: number;
};

type MonthAhead = {
  kind: 'ahead';
  label: string;
  plan: number;
  forecast: number;
  likely: Band;
};

type MonthReading = PastMonth | MonthAhead;

type Model = {
  labels: readonly string[];
  actuals: readonly number[];
  todayIndex: number;
  plan: readonly number[];
  forecast: readonly number[];
  futures: readonly (readonly number[])[];
};

function readingAt(index: number, model: Model): MonthReading {
  const label = model.labels[index] ?? '';
  if (index <= model.todayIndex) {
    const cash = model.actuals[index] ?? 0;
    return { kind: 'past', label, cash };
  }
  const gap = index - model.todayIndex;
  const month = gap - 1;
  return {
    kind: 'ahead',
    label,
    plan: model.plan[month] ?? 0,
    forecast: model.forecast[month] ?? 0,
    likely: bandAt(model.futures, month),
  };
}

type Spot = {
  top: number;
  color: string;
};

function spotsOf(reading: MonthReading, view: ForecastView, scale: Scale) {
  if (reading.kind === 'past') {
    const cashSpot: Spot = {
      top: yOf(reading.cash, scale, PLOT_HEIGHT),
      color: CASH_COLOR,
    };
    return [cashSpot];
  }
  const planSpot: Spot = {
    top: yOf(reading.plan, scale, PLOT_HEIGHT),
    color: PLAN_COLOR,
  };
  if (view === 'range') {
    return [planSpot];
  }
  const forecastSpot: Spot = {
    top: yOf(reading.forecast, scale, PLOT_HEIGHT),
    color: CASH_COLOR,
  };
  return [forecastSpot, planSpot];
}

function likelyTopOf(reading: MonthReading, view: ForecastView, scale: Scale) {
  if (view === 'line') {
    return null;
  }
  if (reading.kind === 'past') {
    return null;
  }
  return yOf(reading.likely.high, scale, PLOT_HEIGHT);
}

/** The bubble sits above the highest thing read at that month, the top of the likely range included. */
function bubbleTopOf(
  reading: MonthReading,
  view: ForecastView,
  spots: readonly Spot[],
  scale: Scale
) {
  const tops = spots.map((spot) => spot.top);
  const likelyTop = likelyTopOf(reading, view, scale);
  if (likelyTop !== null) {
    tops.push(likelyTop);
  }
  return Math.min(...tops);
}

const FIGURE_TEXT = 'text-foreground font-medium tabular-nums';

type ReadoutLinesProps = {
  reading: MonthReading;
  view: ForecastView;
  format: ValueFormat;
};

function ReadoutLines({ reading, view, format }: ReadoutLinesProps) {
  if (reading.kind === 'past') {
    return (
      <ReadoutRow value={format(reading.cash)} name='Cash' color={CASH_COLOR} />
    );
  }
  const planRow = (
    <ReadoutRow value={format(reading.plan)} name='Plan' color={PLAN_COLOR} />
  );
  if (view === 'range') {
    return (
      <>
        <span className='text-muted-foreground'>
          Likely{' '}
          <span className={FIGURE_TEXT}>{format(reading.likely.low)}</span> to{' '}
          <span className={FIGURE_TEXT}>{format(reading.likely.high)}</span>
        </span>
        {planRow}
      </>
    );
  }
  return (
    <>
      <ReadoutRow
        value={format(reading.forecast)}
        name='Forecast'
        color={CASH_COLOR}
      />
      {planRow}
    </>
  );
}

function spokenReadingOf(
  reading: MonthReading,
  view: ForecastView,
  format: ValueFormat
) {
  if (reading.kind === 'past') {
    const cash = format(reading.cash);
    return `${reading.label}: cash ${cash}`;
  }
  const plan = format(reading.plan);
  if (view === 'range') {
    const low = format(reading.likely.low);
    const high = format(reading.likely.high);
    return `${reading.label}: likely ${low} to ${high}, plan ${plan}`;
  }
  const forecast = format(reading.forecast);
  return `${reading.label}: forecast ${forecast}, plan ${plan}`;
}

function cellsOf(reading: MonthReading, format: ValueFormat) {
  if (reading.kind === 'past') {
    return [format(reading.cash), '', '', '', ''];
  }
  return [
    '',
    format(reading.plan),
    format(reading.forecast),
    format(reading.likely.low),
    format(reading.likely.high),
  ];
}

function whatIfToneOf(isOnPlan: boolean) {
  if (isOnPlan) {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

type WhatIfLineProps = {
  whatIf: string | null;
  onClear: () => void;
};

/** What the words were understood as, so a person sees what the forecast now holds. */
function WhatIfLine({ whatIf, onClear }: WhatIfLineProps) {
  const isOnPlan = whatIf === null;
  const text = whatIf ?? ON_PLAN;

  return (
    <div className='flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1'>
      <p
        className={cn(
          'min-w-0 text-xs transition-colors duration-200',
          whatIfToneOf(isOnPlan)
        )}
      >
        <WrappingRoll text={text} />
      </p>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        disabled={isOnPlan}
        onClick={onClear}
        className='text-muted-foreground shrink-0'
      >
        Back to plan
      </Button>
    </div>
  );
}

export function ForecastWhatIf({
  title,
  note,
  labels,
  actuals,
  plan,
  forecast,
  monthlySpread,
  view,
  onViewChange,
  whatIf,
  onClear,
  question,
  onQuestionChange,
  onAsk,
  suggestions,
  hint = null,
  formatValue = formatUsd,
  isTryPressed = false,
  className,
}: ForecastWhatIfProps) {
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const [hasActed, setHasActed] = useState(false);
  const horizon = plan.length;
  const count = actuals.length + horizon;
  const safeCount = Math.max(count, 1);
  const lastIndex = Math.max(count - 1, 0);
  const todayIndex = Math.max(actuals.length - 1, 0);
  const today = actuals.at(-1) ?? 0;
  const hasWhatIf = whatIf !== null;
  const rawFutures = useMemo(
    () => futuresOf(forecast, monthlySpread),
    [forecast, monthlySpread]
  );
  const planFutures = useMemo(
    () => futuresOf(plan, monthlySpread),
    [plan, monthlySpread]
  );
  const floorPlan = flooredOf(plan);
  const floorForecast = flooredOf(forecast);
  const futures = rawFutures.map((future) => flooredOf(future));
  const forecastRunway = runwayOf(forecast);
  const forecastRange = runwayRangeOf(rawFutures);
  const runway = runwayModelOf(forecastRunway, forecastRange, horizon);
  const planLine = runwayOf(plan);
  const planRange = runwayRangeOf(planFutures);
  const planRunway = runwayModelOf(planLine, planRange, horizon);
  const scale = scaleOf(actuals, floorPlan, floorForecast, futures);
  const plot: Plot = { count: safeCount, scale };
  const start: Start = { index: todayIndex, cash: today };
  const actualPath = pathFrom(0, actuals, plot);
  const planPath = aheadPathOf(start, floorPlan, plot);
  const forecastPath = aheadPathOf(start, floorForecast, plot);
  const futurePaths = futures.map((future) => aheadPathOf(start, future, plot));
  const todayShare = columnCenterOf(todayIndex, safeCount);
  const todayTop = yOf(today, scale, PLOT_HEIGHT);
  const zeroTop = yOf(0, scale, PLOT_HEIGHT);
  const outSpan = outSpanOf(
    view,
    forecastRunway,
    forecastRange,
    todayIndex,
    safeCount
  );
  const runwayWords = runwayWordsOf(view, runway);
  const runwayText = spokenWordsOf(runwayWords);
  const comparison = comparisonOf(view, hasWhatIf, planRunway);
  const sentence = `Runway ${runwayText}, ${comparison}`;
  const model: Model = {
    labels,
    actuals,
    todayIndex,
    plan: floorPlan,
    forecast: floorForecast,
    futures,
  };
  const reading = useReading({ count, defaultIndex: lastIndex });
  const shownIndex = reading.shownIndex;
  const shown = readingAt(shownIndex, model);
  const spots = spotsOf(shown, view, scale);
  const bubbleTop = bubbleTopOf(shown, view, spots, scale);
  const spokenReading = spokenReadingOf(shown, view, formatValue);
  const canTry = question.trim() !== '';
  const spoken = hint ?? sentence;
  const firstLabel = labels[0] ?? '';
  const todayLabel = labels[todayIndex] ?? '';
  const lastLabel = labels[lastIndex] ?? '';
  const summary = `Cash from ${firstLabel} to ${todayLabel}, then the plan and the forecast to ${lastLabel}. ${sentence}.`;

  const rows: DataRow[] = labels.map((label, index) => {
    const row = readingAt(index, model);
    return { id: `${index}-${label}`, label, cells: cellsOf(row, formatValue) };
  });

  /** What a person does is said aloud; what a demonstration does stays silent. */
  function askByHand(text: string) {
    setHasActed(true);
    onAsk(text);
  }

  function clearByHand() {
    setHasActed(true);
    onClear();
  }

  function changeViewByHand(next: ForecastView) {
    setHasActed(true);
    onViewChange(next);
  }

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      className={className}
      actions={
        <Segments
          value={view}
          segments={VIEWS}
          onValueChange={changeViewByHand}
          label='How to draw the forecast'
        />
      }
    >
      <div className='flex flex-col gap-2'>
        <QuestionForm
          value={question}
          onValueChange={onQuestionChange}
          onSubmit={askByHand}
          label='A what-if to try, in plain words'
          placeholder='What if we raise $1M in June?'
          submitLabel='Try'
          isSubmitDisabled={!canTry}
          isSubmitPressed={isTryPressed}
          hint={hint}
        />
        <div
          role='group'
          aria-label='What-ifs to try'
          className='flex flex-wrap gap-1.5'
        >
          {suggestions.map((suggestion) => (
            <ChipButton key={suggestion} onClick={() => askByHand(suggestion)}>
              {suggestion}
            </ChipButton>
          ))}
        </div>
      </div>
      <div className='flex flex-col'>
        <WhatIfLine whatIf={whatIf} onClear={clearByHand} />
        <p className='text-2xl leading-8 font-semibold'>
          <WordRoll words={runwayWords} value={leadOf(view, runway)} />
        </p>
        <p className='text-muted-foreground text-xs'>
          <WrappingRoll text={comparison} />
        </p>
      </div>
      <PlotFrame
        label={`${title}. Use the arrow keys to read each month.`}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatValue}
        axisLabels={positionLabelsOf(labels, width, todayIndex)}
        plotRef={plotRef}
        plotProps={reading.handlers}
      >
        <PathLayer height={PLOT_HEIGHT}>
          {futurePaths.map((path, rank) => (
            <MorphPath
              key={rank}
              d={futureShapeOf(view, path, forecastPath)}
              className={cn(
                FUTURE_STROKE,
                'transition-opacity duration-300',
                futureToneOf(view)
              )}
            />
          ))}
          <MorphPath
            d={planPath}
            className={LINE_STROKE}
            style={{ stroke: PLAN_COLOR }}
          />
          <MorphPath
            d={forecastPath}
            className={cn(
              LINE_STROKE,
              FORECAST_DASH,
              'transition-opacity duration-200',
              shownIn(view, 'line')
            )}
          />
          <MorphPath
            d={actualPath}
            className={cn(LINE_STROKE, 'stroke-primary')}
          />
        </PathLayer>
        <TodayMark ratio={todayShare} top={todayTop} />
        <OutMarks span={outSpan} zeroTop={zeroTop} />
        <Readout
          ratio={columnCenterOf(shownIndex, safeCount)}
          top={bubbleTop}
          isVisible={reading.isActive}
          isGliding={reading.isGliding}
          marks={spots.map((spot) => (
            <ReadoutDot key={spot.color} top={spot.top} color={spot.color} />
          ))}
        >
          <ReadoutTitle>{shown.label}</ReadoutTitle>
          <ReadoutLines reading={shown} view={view} format={formatValue} />
        </Readout>
      </PlotFrame>
      <Legend entries={LEGEND} label='What the lines are' />
      <LiveRegion message={spokenUnless(!hasActed, spoken)} />
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, spokenReading)}
      />
      <DataTable caption={title} columns={TABLE_COLUMNS} rows={rows} />
    </ChartCard>
  );
}

/** A change to the plan, read from a sentence. */
type WhatIf = {
  /** What the words were understood as, in a few words. */
  label: string;
  /** The month ahead it starts in, from 1 for the month after today. */
  fromMonth: number;
  /** What it does to the cash every month from then on: below zero when it costs. */
  monthly: number;
  /** What it does to the cash once, in its first month. */
  once: number;
};

const PAST_MONTHS = 6;

const HORIZON = 24;

const FIRST_YEAR = 2025;

/** July, counted from 0 for January. */
const FIRST_CALENDAR_MONTH = 6;

const TODAY_INDEX = PAST_MONTHS - 1;

const TODAY_CALENDAR_MONTH = FIRST_CALENDAR_MONTH + TODAY_INDEX;

const MONTHS_IN_YEAR = 12;

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function monthLabelsOf(year: number, firstMonth: number, count: number) {
  return Array.from({ length: count }, (_, offset) => {
    const month = firstMonth + offset;
    const time = Date.UTC(year, month, 1);
    return MONTH_LABEL.format(time);
  });
}

const MONTH_COUNT = PAST_MONTHS + HORIZON;

const LABELS = monthLabelsOf(FIRST_YEAR, FIRST_CALENDAR_MONTH, MONTH_COUNT);

const ACTUALS = [
  3_250_000, 3_090_000, 2_950_000, 2_790_000, 2_610_000, 2_400_000,
];

const CASH_TODAY = ACTUALS[TODAY_INDEX];

/** What the plan burns in its first month ahead, and how much less each month after as revenue grows. */
const BURN = 150_000;

const BURN_EASING = 1_500;

const MONTHLY_SPREAD = 30_000;

/** The figures the rules work with: a fully loaded hire, monthly revenue, and what customers pay a month. */
const HEAD_COST = 18_000;

const REVENUE = 210_000;

const BIGGEST_CUSTOMER = 70_000;

const AVERAGE_CUSTOMER = 6_000;

const DEFAULT_PERCENT = 10;

function planOf(cash: number) {
  const plan: number[] = [];
  let balance = cash;
  for (let month = 1; month <= HORIZON; month += 1) {
    const easing = BURN_EASING * month;
    const burn = BURN - easing;
    balance -= burn;
    plan.push(balance);
  }
  return plan;
}

const PLAN = planOf(CASH_TODAY);

function impactAt(whatIf: WhatIf, month: number) {
  const monthsBefore = month - whatIf.fromMonth;
  const monthsIn = monthsBefore + 1;
  if (monthsIn <= 0) {
    return 0;
  }
  const flow = whatIf.monthly * monthsIn;
  return flow + whatIf.once;
}

function forecastOf(whatIf: WhatIf | null) {
  if (!whatIf) {
    return PLAN;
  }
  return PLAN.map((balance, index) => {
    const month = index + 1;
    const impact = impactAt(whatIf, month);
    return balance + impact;
  });
}

const CALENDAR_MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const NUMBER_WORDS = new Map([
  ['a', 1],
  ['an', 1],
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['nine', 9],
  ['ten', 10],
]);

const COUNT_NAMES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

const AMOUNT_UNITS = new Map([
  ['k', 1_000],
  ['thousand', 1_000],
  ['m', 1_000_000],
  ['million', 1_000_000],
]);

const WORD_PATTERN = /[a-z]+|\d+(?:\.\d+)?/g;

const PERCENT_PATTERN = /(\d+(?:\.\d+)?) ?(?:%|percent)/;

const SIGNED_AMOUNT_PATTERN = /\$ ?(\d+(?:\.\d+)?) ?(k|m|thousand|million)?/;

const UNIT_AMOUNT_PATTERN = /(\d+(?:\.\d+)?) ?(k|m|thousand|million)\b/;

type Role = {
  one: string;
  many: string;
};

const PEOPLE: Role = { one: 'person', many: 'people' };

const ROLES: Role[] = [
  { one: 'engineer', many: 'engineers' },
  { one: 'developer', many: 'developers' },
  { one: 'designer', many: 'designers' },
  { one: 'marketer', many: 'marketers' },
  { one: 'salesperson', many: 'salespeople' },
  PEOPLE,
];

const PRICE_WORDS = ['price', 'prices', 'pricing'];

const PRICE_DOWN_WORDS = ['lower', 'cut', 'drop', 'reduce', 'down', 'discount'];

const HIRE_WORDS = ['hire', 'hiring', 'add', 'adding', 'recruit', 'onboard'];

const LOSS_WORDS = ['lose', 'losing', 'lost', 'churn', 'churns'];

const WIN_WORDS = ['win', 'winning', 'sign', 'signing', 'land', 'landing'];

const CUSTOMER_WORDS = ['customer', 'customers', 'client', 'clients'];

const BIGGEST_WORDS = ['biggest', 'largest', 'top', 'main', 'big'];

const CUT_WORDS = ['cut', 'cutting', 'reduce', 'reducing', 'trim', 'save'];

const SPEND_WORDS = [
  'spend',
  'spending',
  'cost',
  'costs',
  'burn',
  'budget',
  'ads',
  'marketing',
];

const FUNDING_WORDS = ['raise', 'raising', 'funding', 'round', 'loan'];

function wordsIn(text: string) {
  const matches = text.match(WORD_PATTERN);
  return matches ?? [];
}

function hasAny(tokens: readonly string[], candidates: readonly string[]) {
  return tokens.some((token) => candidates.includes(token));
}

function countOf(token: string | undefined) {
  if (token === undefined) {
    return null;
  }
  const named = NUMBER_WORDS.get(token);
  if (named !== undefined) {
    return named;
  }
  const digits = Number(token);
  const isWhole = Number.isInteger(digits);
  const isPositive = digits > 0;
  const isCount = isWhole && isPositive;
  if (isCount) {
    return digits;
  }
  return null;
}

/** The count said just before a word, one adjective allowed between them: "two engineers", "3 senior designers". */
function countBefore(tokens: readonly string[], index: number) {
  const nearestIndex = index - 1;
  const nearest = countOf(tokens[nearestIndex]);
  if (nearest !== null) {
    return nearest;
  }
  const furtherIndex = index - 2;
  const further = countOf(tokens[furtherIndex]);
  if (further !== null) {
    return further;
  }
  return 1;
}

function countNameOf(count: number) {
  const name = COUNT_NAMES.at(count);
  if (name !== undefined) {
    return name;
  }
  return String(count);
}

function countTitleOf(count: number) {
  const name = countNameOf(count);
  const first = name.charAt(0);
  const rest = name.slice(1);
  const capital = first.toUpperCase();
  return `${capital}${rest}`;
}

function calendarMonthOf(token: string) {
  const isLongEnough = token.length >= 3;
  if (!isLongEnough) {
    return -1;
  }
  return CALENDAR_MONTHS.findIndex((name) => name.startsWith(token));
}

/** How many months ahead a named month is: March means the next March to come. */
function monthsAheadOf(calendarMonth: number) {
  const shifted = calendarMonth - TODAY_CALENDAR_MONTH;
  const wrapped = shifted + MONTHS_IN_YEAR;
  const ahead = wrapped % MONTHS_IN_YEAR;
  if (ahead === 0) {
    return MONTHS_IN_YEAR;
  }
  return ahead;
}

/** The month a what-if starts in: a month it names, "in 3 months", or else the next month. */
function startMonthOf(tokens: readonly string[]) {
  for (const token of tokens) {
    const calendarMonth = calendarMonthOf(token);
    if (calendarMonth >= 0) {
      return monthsAheadOf(calendarMonth);
    }
  }
  const monthsIndex = tokens.indexOf('months');
  const countIndex = monthsIndex - 1;
  const count = countOf(tokens[countIndex]);
  if (count !== null) {
    return clamp(count, 1, HORIZON);
  }
  return 1;
}

function monthLabelOf(fromMonth: number) {
  const index = TODAY_INDEX + fromMonth;
  return LABELS[index] ?? '';
}

function percentIn(text: string) {
  const match = PERCENT_PATTERN.exec(text);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

/** An amount with a dollar sign, or with a unit such as 20k or 1m. */
function amountMatchOf(text: string) {
  const signed = SIGNED_AMOUNT_PATTERN.exec(text);
  if (signed) {
    return signed;
  }
  return UNIT_AMOUNT_PATTERN.exec(text);
}

function amountIn(text: string) {
  const match = amountMatchOf(text);
  if (!match) {
    return null;
  }
  const figure = Number(match[1]);
  const unit = AMOUNT_UNITS.get(match[2]) ?? 1;
  return figure * unit;
}

function signOf(isDown: boolean) {
  if (isDown) {
    return -1;
  }
  return 1;
}

function wayOf(isDown: boolean) {
  if (isDown) {
    return 'down';
  }
  return 'up';
}

/** A sentence as the rules read it: the text in lower case, and its words and figures in order. */
type Sentence = {
  text: string;
  tokens: readonly string[];
};

function priceChangeOf({ text, tokens }: Sentence) {
  const isAboutPrices = hasAny(tokens, PRICE_WORDS);
  if (!isAboutPrices) {
    return null;
  }
  const percent = percentIn(text) ?? DEFAULT_PERCENT;
  const isDown = hasAny(tokens, PRICE_DOWN_WORDS);
  const share = percent / 100;
  const change = REVENUE * share;
  const sign = signOf(isDown);
  const fromMonth = startMonthOf(tokens);
  const way = wayOf(isDown);
  const month = monthLabelOf(fromMonth);
  const amount = formatUsd(change);
  const whatIf: WhatIf = {
    label: `Prices ${way} ${percent}% from ${month}, ${amount} a month`,
    fromMonth,
    monthly: sign * change,
    once: 0,
  };
  return whatIf;
}

type FoundRole = {
  role: Role;
  index: number;
};

function roleIn(tokens: readonly string[]): FoundRole | null {
  for (const [index, token] of tokens.entries()) {
    const role = ROLES.find((candidate) => {
      const isOne = candidate.one === token;
      const isMany = candidate.many === token;
      return isOne || isMany;
    });
    if (role) {
      return { role, index };
    }
  }
  return null;
}

/** The first count said after the word that hires, when no role is named: "hire two". */
function countAfterHire(tokens: readonly string[]) {
  const hireIndex = tokens.findIndex((token) => HIRE_WORDS.includes(token));
  const afterIndex = hireIndex + 1;
  const after = tokens.slice(afterIndex);
  for (const token of after) {
    const count = countOf(token);
    if (count !== null) {
      return count;
    }
  }
  return 1;
}

function hireOf({ tokens }: Sentence) {
  const isHiring = hasAny(tokens, HIRE_WORDS);
  if (!isHiring) {
    return null;
  }
  const found = roleIn(tokens);
  const role = found?.role ?? PEOPLE;
  let count = countAfterHire(tokens);
  if (found) {
    count = countBefore(tokens, found.index);
  }
  const cost = count * HEAD_COST;
  const fromMonth = startMonthOf(tokens);
  const who = countTitleOf(count);
  const noun = nounOf(count, role.one, role.many);
  const month = monthLabelOf(fromMonth);
  const amount = formatUsd(cost);
  const whatIf: WhatIf = {
    label: `${who} ${noun} from ${month}, ${amount} a month`,
    fromMonth,
    monthly: -cost,
    once: 0,
  };
  return whatIf;
}

function bigCustomerOf(isLoss: boolean) {
  if (isLoss) {
    return 'Biggest customer';
  }
  return 'A big customer';
}

function customersOf(tokens: readonly string[], isLoss: boolean) {
  const isBiggest = hasAny(tokens, BIGGEST_WORDS);
  if (isBiggest) {
    return { amount: BIGGEST_CUSTOMER, name: bigCustomerOf(isLoss) };
  }
  const customerIndex = tokens.findIndex((token) =>
    CUSTOMER_WORDS.includes(token)
  );
  const count = countBefore(tokens, customerIndex);
  const amount = count * AVERAGE_CUSTOMER;
  const who = countTitleOf(count);
  const noun = nounOf(count, 'customer', 'customers');
  return { amount, name: `${who} ${noun}` };
}

function customerChangeOf({ tokens }: Sentence) {
  const isAboutCustomers = hasAny(tokens, CUSTOMER_WORDS);
  const isLoss = hasAny(tokens, LOSS_WORDS);
  const isWin = hasAny(tokens, WIN_WORDS);
  const isChange = isLoss || isWin;
  const isCustomerChange = isAboutCustomers && isChange;
  if (!isCustomerChange) {
    return null;
  }
  const customers = customersOf(tokens, isLoss);
  const sign = signOf(isLoss);
  const fromMonth = startMonthOf(tokens);
  const month = monthLabelOf(fromMonth);
  const amount = formatUsd(customers.amount);
  const outcome = outcomeOf(isLoss);
  const whatIf: WhatIf = {
    label: `${customers.name} ${outcome} from ${month}, ${amount} a month`,
    fromMonth,
    monthly: sign * customers.amount,
    once: 0,
  };
  return whatIf;
}

function outcomeOf(isLoss: boolean) {
  if (isLoss) {
    return 'lost';
  }
  return 'won';
}

/** A saving said as an amount, as a share of the burn, or a tenth of the burn when no figure is given. */
function savingOf(text: string) {
  const amount = amountIn(text);
  if (amount !== null) {
    return amount;
  }
  const percent = percentIn(text) ?? DEFAULT_PERCENT;
  const share = percent / 100;
  return BURN * share;
}

function spendingCutOf({ text, tokens }: Sentence) {
  const isCut = hasAny(tokens, CUT_WORDS);
  const isAboutSpending = hasAny(tokens, SPEND_WORDS);
  const isSpendingCut = isCut && isAboutSpending;
  if (!isSpendingCut) {
    return null;
  }
  const saving = savingOf(text);
  const fromMonth = startMonthOf(tokens);
  const month = monthLabelOf(fromMonth);
  const amount = formatUsd(saving);
  const whatIf: WhatIf = {
    label: `Spending down ${amount} a month from ${month}`,
    fromMonth,
    monthly: saving,
    once: 0,
  };
  return whatIf;
}

function fundingOf({ text, tokens }: Sentence) {
  const isFunding = hasAny(tokens, FUNDING_WORDS);
  const amount = amountIn(text);
  const hasAmount = amount !== null;
  const isRaise = isFunding && hasAmount;
  if (!isRaise) {
    return null;
  }
  const fromMonth = startMonthOf(tokens);
  const month = monthLabelOf(fromMonth);
  const figure = formatUsd(amount);
  const whatIf: WhatIf = {
    label: `${figure} raised in ${month}`,
    fromMonth,
    monthly: 0,
    once: amount,
  };
  return whatIf;
}

type Rule = (sentence: Sentence) => WhatIf | null;

/** The first rule that recognises the sentence reads it. Prices come first, since "raise prices" is not a raise. */
const RULES: Rule[] = [
  priceChangeOf,
  hireOf,
  customerChangeOf,
  spendingCutOf,
  fundingOf,
];

/** Longer than any what-if: the patterns never read more than this, however much is pasted. */
const MAX_SENTENCE_LENGTH = 200;

function whatIfOf(words: string) {
  const lowered = words.toLowerCase();
  const text = lowered.slice(0, MAX_SENTENCE_LENGTH);
  const tokens = wordsIn(text);
  const sentence: Sentence = { text, tokens };
  for (const rule of RULES) {
    const whatIf = rule(sentence);
    if (whatIf) {
      return whatIf;
    }
  }
  return null;
}

const SUGGESTIONS = [
  'Hire two engineers in March',
  'Lose our biggest customer',
  'Raise prices 10% in May',
];

const NOT_UNDERSTOOD =
  'Not understood. Try a hire, a customer lost or won, a price change, a spending cut or a raise';

const RESTING_TEXT = 'hire two engineers in March';

const DEMO_TEXT = 'lose our biggest customer';

const RESTING_WHAT_IF = whatIfOf(RESTING_TEXT);

type PressKey = 'try';

export default function Chart16() {
  const [view, setView] = useState<ForecastView>('line');
  const [whatIf, setWhatIf] = useState<WhatIf | null>(RESTING_WHAT_IF);
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const { pressed, press } = usePress<PressKey>();
  const forecast = forecastOf(whatIf);
  const whatIfLabel = whatIf?.label ?? null;

  function tryWhatIf(text: string) {
    const next = whatIfOf(text);
    if (!next) {
      setHint(NOT_UNDERSTOOD);
      return;
    }
    setHint(null);
    setQuestion('');
    setWhatIf(next);
  }

  function changeQuestion(text: string) {
    setHint(null);
    setQuestion(text);
  }

  function backToPlan() {
    setHint(null);
    setWhatIf(null);
  }

  function resetDemo() {
    setView('line');
    setWhatIf(RESTING_WHAT_IF);
    setQuestion('');
    setHint(null);
  }

  const steps: AutoplayStep[] = [
    { after: 1600, run: () => setView('range') },
    { after: 3000, run: () => setView('line') },
    ...typingSteps(DEMO_TEXT, setQuestion, { startAfter: 1200 }),
    { after: 420, run: () => press('try') },
    { after: PRESS_LEAD_MS, run: () => tryWhatIf(DEMO_TEXT) },
    { after: 2600, run: () => setView('range') },
    { after: 3000, run: () => setView('line') },
    ...typingSteps(RESTING_TEXT, setQuestion, { startAfter: 1200 }),
    { after: 420, run: () => press('try') },
    { after: PRESS_LEAD_MS, run: () => tryWhatIf(RESTING_TEXT) },
    { after: 2000, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1200,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[31rem] w-full max-w-[36rem]'
    >
      <ForecastWhatIf
        title='Cash runway'
        note='Illustrative'
        labels={LABELS}
        actuals={ACTUALS}
        plan={PLAN}
        forecast={forecast}
        monthlySpread={MONTHLY_SPREAD}
        view={view}
        onViewChange={setView}
        whatIf={whatIfLabel}
        onClear={backToPlan}
        question={question}
        onQuestionChange={changeQuestion}
        onAsk={tryWhatIf}
        suggestions={SUGGESTIONS}
        hint={hint}
        isTryPressed={pressed === 'try'}
        className='w-full'
      />
    </div>
  );
}
