'use client';

import { useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps } from './_parts/demo';
import {
  COUNT_FORMAT,
  formatCount,
  formatSigned,
  SIGNED_FORMAT,
} from './_parts/format';
import { MorphPath } from './_parts/morph-path';
import { VIEW_WIDTH } from './_parts/path';
import { PathLayer } from './_parts/plot';
import { clamp, columnCenterOf, percentOf, positionsTo } from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';

export type FunnelStep = {
  id: string;
  name: string;
  /** The share of the step before that reaches this one, in percent. The first step is where everyone enters: its rate is not read. */
  rate: number;
};

/** The rate tried for a step, in percent, by step id. A step that is not listed keeps its real rate. */
export type FunnelTrial = Readonly<Record<string, number>>;

export type FlowFunnelProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** How many enter the first step. */
  entrants: number;
  steps: readonly FunnelStep[];
  trial: FunnelTrial;
  onTrialChange: (trial: FunnelTrial) => void;
  /** What comes out of the last step, in the plural with its period: "customers a month". */
  outcome: string;
  /** Shows Reset held down, for a demonstration that presses it. */
  isResetPressed?: boolean;
  className?: string;
};

type Level = {
  step: FunnelStep;
  realRate: number;
  rate: number;
  realCount: number;
  count: number;
};

const PLOT_HEIGHT = 150;

const CENTRE = PLOT_HEIGHT / 2;

/** The share of a column, on each of its sides, that the curve to the next column takes. */
const JOIN = 0.26;

/** How far a rate can be tried below and above the real one, in points. */
const ROOM_BELOW = 15;

const ROOM_ABOVE = 25;

/** A rate within this many points of the real one catches on it, so the way back is easy to find. */
const DETENT = 1;

const PAGE_STEP = 5;

/**
 * A point of rate takes this much of a drag on every edge. The edges of the later steps sit a few
 * pixels apart across their whole range, so a drag read against the shape would jump several points
 * a pixel there and the catch at the real rate could not be felt.
 */
const PX_PER_POINT = 2;

const NO_TRIAL: FunnelTrial = {};

function rateOf(step: FunnelStep, trial: FunnelTrial) {
  return trial[step.id] ?? step.rate;
}

/** How many of those who enter a step get through it at a rate in percent. */
function passedOf(entering: number, rate: number) {
  const share = rate / 100;
  return entering * share;
}

function levelsOf(
  entrants: number,
  steps: readonly FunnelStep[],
  trial: FunnelTrial
) {
  const levels: Level[] = [];
  let realCount = entrants;
  let count = entrants;
  for (const [index, step] of steps.entries()) {
    const rate = rateOf(step, trial);
    if (index > 0) {
      realCount = passedOf(realCount, step.rate);
      count = passedOf(count, rate);
    }
    levels.push({
      step,
      realRate: step.rate,
      rate,
      realCount,
      count,
    });
  }
  return levels;
}

function limitsOf(step: FunnelStep) {
  const min = Math.max(step.rate - ROOM_BELOW, 1);
  const max = Math.min(step.rate + ROOM_ABOVE, 100);
  return { min, max };
}

/** A whole rate inside the limits of its step, caught by the real rate when it is close to it. */
function settledRateOf(step: FunnelStep, wanted: number) {
  const limits = limitsOf(step);
  const whole = Math.round(wanted);
  const distance = Math.abs(whole - step.rate);
  if (distance <= DETENT) {
    return step.rate;
  }
  return clamp(whole, limits.min, limits.max);
}

/** The trial with one rate changed. A rate back at its real value leaves the trial. */
function trialWith(trial: FunnelTrial, step: FunnelStep, rate: number) {
  const next: Record<string, number> = { ...trial };
  if (rate === step.rate) {
    delete next[step.id];
    return next;
  }
  next[step.id] = rate;
  return next;
}

function topOf(share: number) {
  const half = share * CENTRE;
  return CENTRE - half;
}

function bottomOf(share: number) {
  const half = share * CENTRE;
  return CENTRE + half;
}

function xy(x: number, y: number) {
  const left = x.toFixed(1);
  const top = y.toFixed(1);
  return `${left} ${top}`;
}

/** A curve from the level of one column to the level of its neighbour, across the line between them. */
function joinTo(boundary: number, fromY: number, toX: number, toY: number) {
  const leaving = xy(boundary, fromY);
  const arriving = xy(boundary, toY);
  const end = xy(toX, toY);
  return `C${leaving} ${arriving} ${end}`;
}

function lineTo(x: number, y: number) {
  const end = xy(x, y);
  return `L${end}`;
}

/**
 * One closed shape through every step: flat across each column, curved between two columns. The
 * top edge runs left to right and the bottom edge comes back, with the same number of points
 * whatever the shares, so one funnel can glide into another.
 */
function funnelPathOf(shares: readonly number[]) {
  const count = shares.length;
  if (count === 0) {
    return '';
  }
  const column = VIEW_WIDTH / count;
  const join = column * JOIN;
  const lastIndex = count - 1;
  const firstTop = topOf(shares[0]);
  const start = xy(0, firstTop);
  const commands = [`M${start}`];
  for (let index = 0; index < count; index += 1) {
    const top = topOf(shares[index]);
    const isLast = index === lastIndex;
    const columnEnd = (index + 1) * column;
    const flatEnd = columnEnd - joinOf(isLast, join);
    commands.push(lineTo(flatEnd, top));
    if (!isLast) {
      const nextTop = topOf(shares[index + 1]);
      commands.push(joinTo(columnEnd, top, columnEnd + join, nextTop));
    }
  }
  const lastBottom = bottomOf(shares[lastIndex]);
  commands.push(lineTo(VIEW_WIDTH, lastBottom));
  for (let index = lastIndex; index >= 0; index -= 1) {
    const bottom = bottomOf(shares[index]);
    const isFirst = index === 0;
    const columnStart = index * column;
    const flatStart = columnStart + joinOf(isFirst, join);
    commands.push(lineTo(flatStart, bottom));
    if (!isFirst) {
      const previousBottom = bottomOf(shares[index - 1]);
      commands.push(
        joinTo(columnStart, bottom, columnStart - join, previousBottom)
      );
    }
  }
  commands.push('Z');
  return commands.join(' ');
}

/** The first and the last column run flat to the edge of the plot: nothing joins them there. */
function joinOf(isAtEdge: boolean, join: number) {
  if (isAtEdge) {
    return 0;
  }
  return join;
}

function keyTargetOf(key: string, rate: number, step: FunnelStep) {
  const limits = limitsOf(step);
  const isUp = key === 'ArrowUp' || key === 'ArrowRight';
  const isDown = key === 'ArrowDown' || key === 'ArrowLeft';
  if (isUp) {
    return rate + 1;
  }
  if (isDown) {
    return rate - 1;
  }
  if (key === 'PageUp') {
    return rate + PAGE_STEP;
  }
  if (key === 'PageDown') {
    return rate - PAGE_STEP;
  }
  if (key === 'Home') {
    return limits.min;
  }
  if (key === 'End') {
    return limits.max;
  }
  return null;
}

type EdgeHandleProps = {
  level: Level;
  /** The share of everyone who entered that reaches this step, and where its column sits. */
  share: number;
  columnRatio: number;
  /** True while any edge follows a hand: the handles then move with it, with no glide behind. */
  isFollowing: boolean;
  onRateChange: (step: FunnelStep, rate: number) => void;
  onDraggingChange: (isDragging: boolean) => void;
};

type DragStart = {
  y: number;
  rate: number;
};

function handleGlideOf(isFollowing: boolean) {
  if (isFollowing) {
    return undefined;
  }
  return 'transition-transform duration-300 ease-(--ease-out-strong)';
}

/** The edge of a step as a slider: dragged up it widens the step, which is a better rate. */
function EdgeHandle({
  level,
  share,
  columnRatio,
  isFollowing,
  onRateChange,
  onDraggingChange,
}: EdgeHandleProps) {
  const dragStart = useRef<DragStart | null>(null);
  const limits = limitsOf(level.step);
  const style = {
    left: percentOf(columnRatio),
    transform: `translateY(${topOf(share)}px)`,
  };

  function rateAt(event: React.PointerEvent<HTMLElement>, start: DragStart) {
    const raised = start.y - event.clientY;
    const points = raised / PX_PER_POINT;
    const wanted = start.rate + points;
    return settledRateOf(level.step, wanted);
  }

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { y: event.clientY, rate: level.rate };
    onDraggingChange(true);
  }

  function drag(event: React.PointerEvent<HTMLElement>) {
    const start = dragStart.current;
    if (!start) {
      return;
    }
    const rate = rateAt(event, start);
    if (rate !== level.rate) {
      onRateChange(level.step, rate);
    }
  }

  function endDrag() {
    if (!dragStart.current) {
      return;
    }
    dragStart.current = null;
    onDraggingChange(false);
  }

  function pressKey(event: React.KeyboardEvent<HTMLElement>) {
    const target = keyTargetOf(event.key, level.rate, level.step);
    if (target === null) {
      return;
    }
    event.preventDefault();
    const rate = clamp(target, limits.min, limits.max);
    onRateChange(level.step, rate);
  }

  return (
    <span
      role='slider'
      tabIndex={0}
      aria-label={`${level.step.name} rate`}
      aria-orientation='vertical'
      aria-valuemin={limits.min}
      aria-valuemax={limits.max}
      aria-valuenow={level.rate}
      aria-valuetext={`${level.rate}%, the real rate is ${level.realRate}%`}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={pressKey}
      className={cn(
        'group/handle absolute top-0 flex size-7 -translate-1/2 cursor-ns-resize touch-none items-center justify-center rounded-full outline-none',
        handleGlideOf(isFollowing)
      )}
      style={style}
    >
      <span className='bg-card ring-foreground/40 group-hover/handle:ring-foreground/70 group-focus-visible/handle:ring-ring size-3 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] ring-2 transition-[box-shadow,scale] duration-150 group-focus-visible/handle:ring-[3px] group-active/handle:scale-110' />
    </span>
  );
}

function wholeCountOf(level: Level) {
  const whole = Math.round(level.count);
  return formatCount(whole);
}

function rateTextOf(level: Level) {
  if (level.rate === level.realRate) {
    return `${level.rate}%`;
  }
  return `${level.rate}%, was ${level.realRate}%`;
}

type HeadlineProps = {
  gain: number;
  realOutcome: number;
  trialOutcome: number;
  outcome: string;
};

function Headline({ gain, realOutcome, trialOutcome, outcome }: HeadlineProps) {
  const isTrying = gain !== 0;
  const real = formatCount(realOutcome);
  const tried = formatCount(trialOutcome);

  return (
    <div className='flex flex-col gap-0.5'>
      <p className='flex flex-wrap items-baseline gap-x-1.5'>
        {isTrying && (
          <MotionNumber
            value={gain}
            format={SIGNED_FORMAT}
            className='text-2xl leading-8 font-semibold'
          />
        )}
        {!isTrying && (
          <MotionNumber
            value={realOutcome}
            format={COUNT_FORMAT}
            className='text-2xl leading-8 font-semibold'
          />
        )}
        <span className='text-muted-foreground text-[13px]'>{outcome}</span>
      </p>
      <p className='text-muted-foreground text-xs tabular-nums'>
        {isTrying && <WordRoll text={`${tried} instead of ${real}`} />}
        {!isTrying && 'At the real rates. Pull an edge to try a better one'}
      </p>
    </div>
  );
}

export function FlowFunnel({
  title,
  note,
  entrants,
  steps,
  trial,
  onTrialChange,
  outcome,
  isResetPressed = false,
  className,
}: FlowFunnelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [spoken, setSpoken] = useState('');
  const levels = levelsOf(entrants, steps, trial);
  const safeEntrants = Math.max(entrants, 1);
  const realShares = levels.map((level) => level.realCount / safeEntrants);
  const shares = levels.map((level) => level.count / safeEntrants);
  const last = levels.at(-1);
  const realOutcome = Math.round(last?.realCount ?? 0);
  const trialOutcome = Math.round(last?.count ?? 0);
  const gain = trialOutcome - realOutcome;
  const isTrying = Object.keys(trial).length > 0;
  const columnCount = Math.max(steps.length, 1);
  const columns = {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };
  const outcomeText = formatCount(trialOutcome);
  const entrantText = formatCount(entrants);
  const gainText = formatSigned(gain);
  const summary = `${outcomeText} ${outcome} from ${entrantText} who enter, ${gainText} against the real rates.`;

  /** The outcome is said when a person lets go of an edge or moves it with a key, never on every point of a drag. */
  function say(nextTrial: FunnelTrial) {
    const nextLevels = levelsOf(entrants, steps, nextTrial);
    const nextLast = nextLevels.at(-1);
    const nextOutcome = Math.round(nextLast?.count ?? 0);
    const nextGain = formatSigned(nextOutcome - realOutcome);
    setSpoken(`${nextGain} ${outcome}`);
  }

  function changeRate(step: FunnelStep, rate: number) {
    const nextTrial = trialWith(trial, step, rate);
    onTrialChange(nextTrial);
    if (!isDragging) {
      say(nextTrial);
    }
  }

  function changeDragging(next: boolean) {
    setIsDragging(next);
    if (!next) {
      say(trial);
    }
  }

  function reset() {
    onTrialChange(NO_TRIAL);
    say(NO_TRIAL);
  }

  const rows: DataRow[] = levels.map((level) => ({
    id: level.step.id,
    label: level.step.name,
    cells: [wholeCountOf(level), `${level.rate}%`, `${level.realRate}%`],
  }));

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      className={className}
      actions={
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={!isTrying}
          onClick={reset}
          className={pressedQuietOf(isResetPressed)}
        >
          Reset
        </Button>
      }
    >
      <Headline
        gain={gain}
        realOutcome={realOutcome}
        trialOutcome={trialOutcome}
        outcome={outcome}
      />
      <div className='flex flex-col gap-2'>
        <div className='relative' style={{ height: PLOT_HEIGHT }}>
          <PathLayer height={PLOT_HEIGHT}>
            <MorphPath
              d={funnelPathOf(realShares)}
              className='fill-foreground/[0.07]'
            />
            <MorphPath
              d={funnelPathOf(shares)}
              isInstant={isDragging}
              className='fill-primary/25'
            />
          </PathLayer>
          {levels.map((level, index) => {
            if (index === 0) {
              return null;
            }
            return (
              <EdgeHandle
                key={level.step.id}
                level={level}
                share={shares[index]}
                columnRatio={columnCenterOf(index, levels.length)}
                isFollowing={isDragging}
                onRateChange={changeRate}
                onDraggingChange={changeDragging}
              />
            );
          })}
        </div>
        <ol className='flex flex-col gap-1 @sm:grid' style={columns}>
          {levels.map((level, index) => (
            <li
              key={level.step.id}
              className='grid min-w-0 grid-cols-[minmax(0,1fr)_auto_6rem] items-baseline gap-x-2 @sm:flex @sm:flex-col @sm:items-center @sm:text-center'
            >
              <span className='text-muted-foreground truncate text-xs @sm:w-full'>
                {level.step.name}
              </span>
              <MotionNumber
                value={Math.round(level.count)}
                format={COUNT_FORMAT}
                className='text-[13px] font-medium'
              />
              {index > 0 && (
                <span className='text-muted-foreground text-end text-[11px] text-pretty tabular-nums @sm:text-center'>
                  {rateTextOf(level)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
      <LiveRegion message={spoken} />
      <DataTable
        caption={title}
        columns={['Step', 'Count', 'Rate tried', 'Real rate']}
        rows={rows}
      />
    </ChartCard>
  );
}

const STEPS: FunnelStep[] = [
  { id: 'visitors', name: 'Visitors', rate: 100 },
  { id: 'signups', name: 'Signups', rate: 55 },
  { id: 'activated', name: 'Activated', rate: 65 },
  { id: 'trials', name: 'Trials', rate: 60 },
  { id: 'customers', name: 'Customers', rate: 50 },
];

const VISITORS = 4000;

/** The picture the piece rests on: one edge already pulled, so the gain is on the page. */
const RESTING_TRIAL: FunnelTrial = { activated: 72 };

const PULL_STEP_MS = 110;

type PressKey = 'reset';

export default function Chart13() {
  const [trial, setTrial] = useState<FunnelTrial>(RESTING_TRIAL);
  const { pressed, press } = usePress<PressKey>();

  function tryRate(stepId: string) {
    return function tryAt(rate: number) {
      setTrial((current) => ({ ...current, [stepId]: rate }));
    };
  }

  function resetDemo() {
    setTrial(RESTING_TRIAL);
  }

  const steps: AutoplayStep[] = [
    { after: 2000, run: () => press('reset') },
    { after: PRESS_LEAD_MS, run: () => setTrial(NO_TRIAL) },
    ...walkSteps(positionsTo(65, 74), tryRate('activated'), {
      startAfter: 1700,
      stepMs: PULL_STEP_MS,
    }),
    ...walkSteps(positionsTo(50, 57), tryRate('customers'), {
      startAfter: 2000,
      stepMs: PULL_STEP_MS,
    }),
    { after: 2400, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1200,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[23rem] w-full max-w-[34rem]'
    >
      <FlowFunnel
        title='From visitor to customer'
        note='Illustrative'
        entrants={VISITORS}
        steps={STEPS}
        trial={trial}
        onTrialChange={setTrial}
        outcome='customers a month'
        isResetPressed={pressed === 'reset'}
        className='w-full'
      />
    </div>
  );
}
