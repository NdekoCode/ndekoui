'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';

import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import {
  changeWordsOf,
  COUNT_FORMAT,
  formatCount,
  formatShare,
  formatSigned,
  percentChangeOf,
} from './_parts/format';
import { percentOf, sumOf } from './_parts/scale';
import { StreamedWords } from './_parts/streamed-words';
import { useChartDemo } from './_parts/use-chart-demo';
import {
  arrivedStreamOf,
  spokenStreamOf,
  textOf,
  useWordStream,
  wordsOf,
  type WordStream,
} from './_parts/use-word-stream';

export type MetricDriver = {
  id: string;
  name: string;
  /** How much of the change this driver accounts for, in the unit of the figure. Below zero when it pulled the figure down. */
  contribution: number;
};

export type MetricExplainerProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  value: number;
  previous: number;
  /** What the figure counts, in the plural: "teams". */
  unit: string;
  /** What the figure is compared with: "last week". */
  reference: string;
  drivers: readonly MetricDriver[];
  /** The reading of the change, as it arrives from the model. */
  explanation: WordStream;
  /** Explain, then Regenerate once a reading is there. */
  onExplain: () => void;
  /** Lights a driver from outside, for a demonstration or a control beside the piece. */
  spotlightId?: string | null;
  /** Shows the button held down, for a demonstration that presses it. */
  isExplainPressed?: boolean;
  className?: string;
};

type Ranked = {
  driver: MetricDriver;
  /** Its part of everything that moved, gains and losses alike, from 0 to 1. */
  share: number;
};

type Reach = {
  /** The largest gain and the largest loss, both as positive sizes. */
  gain: number;
  loss: number;
};

type Trend = 'up' | 'down' | 'level';

const TREND_ICON: Record<Trend, Icon> = {
  up: TrendingUpIcon,
  down: TrendingDownIcon,
  level: MinusIcon,
};

function trendOf(difference: number): Trend {
  if (difference > 0) {
    return 'up';
  }
  if (difference < 0) {
    return 'down';
  }
  return 'level';
}

function sizeOf(driver: MetricDriver) {
  return Math.abs(driver.contribution);
}

/** Drivers in the order of how much each one counted, whichever way it pushed. */
function rankedOf(drivers: readonly MetricDriver[]): Ranked[] {
  const sizes = drivers.map((driver) => sizeOf(driver));
  const total = sumOf(sizes);
  const moved = Math.max(total, 1);
  const ranked = drivers.map((driver) => {
    const share = sizeOf(driver) / moved;
    return { driver, share };
  });
  return ranked.sort((first, second) => second.share - first.share);
}

function reachOf(drivers: readonly MetricDriver[]): Reach {
  let gain = 0;
  let loss = 0;
  for (const driver of drivers) {
    gain = Math.max(gain, driver.contribution);
    loss = Math.max(loss, -driver.contribution);
  }
  return { gain, loss };
}

function totalsOf(drivers: readonly MetricDriver[]) {
  let gains = 0;
  let losses = 0;
  for (const driver of drivers) {
    gains += Math.max(driver.contribution, 0);
    losses += Math.min(driver.contribution, 0);
  }
  return { gains, losses };
}

/** Where zero sits between the largest loss on the left and the largest gain on the right. */
function zeroShareOf(reach: Reach) {
  const span = reach.gain + reach.loss;
  if (span === 0) {
    return 0;
  }
  return reach.loss / span;
}

function isGain(driver: MetricDriver) {
  return driver.contribution >= 0;
}

function toneOf(driver: MetricDriver) {
  if (isGain(driver)) {
    return 'bg-primary';
  }
  return 'bg-destructive';
}

/** How much of its side a bar leaves empty, as a percentage the fill is slid by. */
function hiddenPercentOf(driver: MetricDriver, reach: Reach) {
  const limit = sideLimitOf(driver, reach);
  if (limit === 0) {
    return 100;
  }
  const filled = sizeOf(driver) / limit;
  const hidden = 1 - filled;
  return hidden * 100;
}

function sideLimitOf(driver: MetricDriver, reach: Reach) {
  if (isGain(driver)) {
    return reach.gain;
  }
  return reach.loss;
}

const SLIDE = 'transition-transform duration-300 ease-(--ease-out-strong)';

type ContributionBarProps = {
  driver: MetricDriver;
  reach: Reach;
};

/**
 * A bar that leaves from zero: to the right for a gain, to the left for a loss. The fill slides out
 * of a slot that clips it, so its rounded end never stretches.
 */
function ContributionBar({ driver, reach }: ContributionBarProps) {
  const zeroShare = zeroShareOf(reach);
  const zero = percentOf(zeroShare);
  const hidden = hiddenPercentOf(driver, reach);
  const gains = isGain(driver);

  return (
    <span aria-hidden='true' className='relative block h-3'>
      {gains && (
        <span
          className='absolute inset-y-0 right-0 overflow-hidden'
          style={{ left: zero }}
        >
          <span
            className={cn('bg-primary absolute inset-0 rounded-e-[4px]', SLIDE)}
            style={{ transform: `translateX(-${hidden}%)` }}
          />
        </span>
      )}
      {!gains && (
        <span
          className='absolute inset-y-0 left-0 overflow-hidden'
          style={{ width: zero }}
        >
          <span
            className={cn(
              'bg-destructive absolute inset-0 rounded-s-[4px]',
              SLIDE
            )}
            style={{ transform: `translateX(${hidden}%)` }}
          />
        </span>
      )}
      <span
        className='hairline-l border-foreground/25 absolute -inset-y-1'
        style={{ left: zero }}
      />
    </span>
  );
}

function litRowOf(isLit: boolean) {
  if (isLit) {
    return 'bg-foreground/[0.03]';
  }
  return undefined;
}

type DriverRowProps = {
  ranked: Ranked;
  reach: Reach;
  isPinned: boolean;
  /** Its part of the total is the one lit now, whoever pointed at it. */
  isLit: boolean;
  onPreview: (id: string | null) => void;
  onTogglePin: (id: string) => void;
};

function DriverRow({
  ranked,
  reach,
  isPinned,
  isLit,
  onPreview,
  onTogglePin,
}: DriverRowProps) {
  const { driver, share } = ranked;

  function preview() {
    onPreview(driver.id);
  }

  function clearPreview() {
    onPreview(null);
  }

  return (
    <button
      type='button'
      aria-pressed={isPinned}
      onPointerEnter={preview}
      onPointerLeave={clearPreview}
      onFocus={preview}
      onBlur={clearPreview}
      onClick={() => onTogglePin(driver.id)}
      className={cn(
        'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 aria-pressed:bg-foreground/[0.05] grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-start text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        '@sm:h-8 @sm:grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_auto] @sm:py-0',
        litRowOf(isLit)
      )}
    >
      <span className='col-start-1 row-start-1 truncate'>{driver.name}</span>
      <span className='col-span-2 row-start-2 @sm:col-span-1 @sm:col-start-2 @sm:row-start-1'>
        <ContributionBar driver={driver} reach={reach} />
      </span>
      <span className='col-start-2 row-start-1 flex items-baseline gap-2 tabular-nums @sm:col-start-3'>
        <span className='w-9 text-end font-medium'>
          {formatSigned(driver.contribution)}
        </span>
        <span className='text-muted-foreground w-8 text-end text-xs'>
          {formatShare(share)}
        </span>
      </span>
    </button>
  );
}

function dimmedOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-30';
  }
  return undefined;
}

/** Gains first, then losses, so the bar reads as what was added and what was taken away. */
function gainsFirst(ranked: readonly Ranked[]) {
  const gains = ranked.filter((entry) => isGain(entry.driver));
  const losses = ranked.filter((entry) => !isGain(entry.driver));
  return [...gains, ...losses];
}

type TotalBarProps = {
  ranked: readonly Ranked[];
  activeId: string | null;
};

/** Everything that moved as one bar, each driver a segment as wide as its share. */
function TotalBar({ ranked, activeId }: TotalBarProps) {
  const segments = gainsFirst(ranked);
  const hasActive = activeId !== null;

  return (
    <span aria-hidden='true' className='flex h-2.5 gap-0.5'>
      {segments.map((entry) => {
        const isDimmed = hasActive && entry.driver.id !== activeId;

        return (
          <span
            key={entry.driver.id}
            className={cn(
              'min-w-0.5 basis-0 rounded-[2px] transition-opacity duration-150',
              toneOf(entry.driver),
              dimmedOf(isDimmed)
            )}
            style={{ flexGrow: entry.share }}
          />
        );
      })}
    </span>
  );
}

const EXPLAIN_LABELS: Record<MorphState, string> = {
  idle: 'Explain',
  busy: 'Reading',
  done: 'Read',
};

const REGENERATE_LABELS: Record<MorphState, string> = {
  idle: 'Regenerate',
  busy: 'Reading',
  done: 'Read',
};

function labelsOf(explanation: WordStream) {
  if (explanation.words.length === 0) {
    return EXPLAIN_LABELS;
  }
  return REGENERATE_LABELS;
}

function buttonStateOf(explanation: WordStream): MorphState {
  const isThinking = explanation.status === 'thinking';
  const isStreaming = explanation.status === 'streaming';
  if (isThinking || isStreaming) {
    return 'busy';
  }
  return 'idle';
}

type WhyItMovedProps = {
  explanation: WordStream;
  onExplain: () => void;
  isExplainPressed: boolean;
};

function WhyItMoved({
  explanation,
  onExplain,
  isExplainPressed,
}: WhyItMovedProps) {
  const isIdle = explanation.status === 'idle';
  const isThinking = explanation.status === 'thinking';
  const isStreaming = explanation.status === 'streaming';
  const hasWords = !isIdle && !isThinking;
  const hasText = explanation.words.length > 0;

  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-3'>
      <div className='flex items-center justify-between gap-2'>
        <h4 className='text-xs font-medium'>Why it moved</h4>
        <MorphButton
          type='button'
          size='sm'
          variant='outline'
          state={buttonStateOf(explanation)}
          labels={labelsOf(explanation)}
          onClick={onExplain}
          className={pressedQuietOf(isExplainPressed)}
        />
      </div>
      <div className='grid min-h-[3.75rem] text-[13px] leading-5 text-pretty'>
        {isIdle && (
          <p className='text-muted-foreground'>
            Ask for a reading of what moved this figure
          </p>
        )}
        {hasText && (
          <p aria-hidden='true' className='invisible col-start-1 row-start-1'>
            {textOf(explanation)}
          </p>
        )}
        {isThinking && (
          <div className='col-start-1 row-start-1 flex flex-col gap-2 pt-1'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-4/5' />
          </div>
        )}
        {hasWords && (
          <p className='col-start-1 row-start-1'>
            <StreamedWords
              words={explanation.words}
              shown={explanation.shown}
              isStreaming={isStreaming}
            />
          </p>
        )}
      </div>
    </div>
  );
}

/** What a person points at comes first, then what they pinned, then what was lit from outside. */
function activeIdOf(
  preview: string | null,
  pinned: string | null,
  spotlight: string | null
) {
  return preview ?? pinned ?? spotlight;
}

function captionOf(
  active: Ranked | undefined,
  drivers: readonly MetricDriver[],
  unit: string
) {
  if (active) {
    const amount = formatSigned(active.driver.contribution);
    const share = formatShare(active.share);
    return `${active.driver.name}: ${amount} ${unit}, ${share} of what moved`;
  }
  const totals = totalsOf(drivers);
  const gains = formatSigned(totals.gains);
  const losses = formatSigned(totals.losses);
  return `Gains ${gains} · Losses ${losses}`;
}

export function MetricExplainer({
  title,
  note,
  value,
  previous,
  unit,
  reference,
  drivers,
  explanation,
  onExplain,
  spotlightId = null,
  isExplainPressed = false,
  className,
}: MetricExplainerProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [hasAsked, setHasAsked] = useState(false);
  const difference = value - previous;
  const percent = percentChangeOf(value, previous);
  const change = changeWordsOf(percent, reference);
  const trend = trendOf(difference);
  const TrendIcon = TREND_ICON[trend];
  const ranked = rankedOf(drivers);
  const reach = reachOf(drivers);
  const activeId = activeIdOf(previewId, pinnedId, spotlightId);
  const active = ranked.find((entry) => entry.driver.id === activeId);
  const figure = formatCount(value);
  const spokenReading = spokenStreamOf(explanation);
  const summary = `${figure} ${unit}, ${change}, with ${drivers.length} drivers ranked by how much each one counted.`;

  const rows: DataRow[] = ranked.map((entry) => ({
    id: entry.driver.id,
    label: entry.driver.name,
    cells: [formatSigned(entry.driver.contribution), formatShare(entry.share)],
  }));

  /** A reading is said aloud once a person has asked for one: a demonstration stays silent. */
  function explainByHand() {
    setHasAsked(true);
    onExplain();
  }

  function togglePin(id: string) {
    setPinnedId((current) => {
      if (current === id) {
        return null;
      }
      return id;
    });
  }

  return (
    <ChartCard
      title={title}
      note={note}
      summary={summary}
      className={className}
    >
      <div className='flex flex-col gap-1'>
        <p className='flex flex-wrap items-baseline gap-x-2'>
          <MotionNumber
            value={value}
            format={COUNT_FORMAT}
            className='text-[28px] leading-9 font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>{unit}</span>
        </p>
        <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <TrendIcon className='size-3.5 shrink-0' />
          <span>
            {change}{' '}
            <span className='tabular-nums'>({formatSigned(difference)})</span>
          </span>
        </p>
      </div>
      <WhyItMoved
        explanation={explanation}
        onExplain={explainByHand}
        isExplainPressed={isExplainPressed}
      />
      <div className='flex flex-col gap-1.5'>
        <TotalBar ranked={ranked} activeId={activeId} />
        <p className='text-muted-foreground min-h-8 text-xs text-pretty tabular-nums @sm:min-h-0'>
          {captionOf(active, drivers, unit)}
        </p>
      </div>
      <div className='flex flex-col gap-1'>
        <h4 className='text-xs font-medium'>What moved it</h4>
        <ul className='-mx-2 flex flex-col'>
          {ranked.map((entry) => (
            <li key={entry.driver.id}>
              <DriverRow
                ranked={entry}
                reach={reach}
                isPinned={pinnedId === entry.driver.id}
                isLit={activeId === entry.driver.id}
                onPreview={setPreviewId}
                onTogglePin={togglePin}
              />
            </li>
          ))}
        </ul>
      </div>
      <LiveRegion message={spokenUnless(!hasAsked, spokenReading)} />
      <DataTable
        caption={`What moved ${title}`}
        columns={['Driver', `Contribution in ${unit}`, 'Share of what moved']}
        rows={rows}
      />
    </ChartCard>
  );
}

const DRIVERS: MetricDriver[] = [
  { id: 'signups', name: 'New signups', contribution: 48 },
  { id: 'returning', name: 'Returning teams', contribution: 39 },
  { id: 'mobile', name: 'Mobile release', contribution: 21 },
  { id: 'season', name: 'Seasonal dip', contribution: -18 },
  { id: 'trials', name: 'Trials that ended', contribution: -15 },
];

const DRIVER_IDS = DRIVERS.map((driver) => driver.id);

const CONTRIBUTIONS = DRIVERS.map((driver) => driver.contribution);

const ACTIVE_TEAMS = 1284;

const TEAMS_LAST_WEEK = ACTIVE_TEAMS - sumOf(CONTRIBUTIONS);

const READINGS = [
  'Most of the lift came from new signups after the launch on Tuesday, and from teams that came back once the mobile release fixed sign-in. A seasonal dip and a handful of trials that ended held the week back by 33 teams.',
  'New signups and returning teams added 87 active teams between them, and the mobile release brought 21 more. Without the seasonal dip and the trials that ended, the week would have closed 33 teams higher.',
];

const FIRST_READING = arrivedStreamOf(READINGS[0]);

const THINK_MS = 900;

const WORD_MS = 55;

const SECOND_READING_WORDS = wordsOf(READINGS[1]);

const WRITING_MS = SECOND_READING_WORDS.length * WORD_MS;

/** The round waits for the last word of the second reading, then leaves it time to be read. */
const READ_AFTER_MS = THINK_MS + WRITING_MS + 2000;

type PressKey = 'explain';

export default function Chart07() {
  const [turn, setTurn] = useState(0);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const { stream, start, show } = useWordStream(FIRST_READING);
  const { pressed, press } = usePress<PressKey>();

  function explain() {
    const following = turn + 1;
    const next = following % READINGS.length;
    setTurn(next);
    start(READINGS[next], { thinkMs: THINK_MS, wordMs: WORD_MS });
  }

  function resetDemo() {
    setTurn(0);
    setSpotlight(null);
    show(FIRST_READING);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(DRIVER_IDS, setSpotlight, { startAfter: 1300, stepMs: 750 }),
    { after: 900, run: () => setSpotlight(null) },
    { after: 600, run: () => press('explain') },
    { after: PRESS_LEAD_MS, run: explain },
    { after: READ_AFTER_MS, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[32.5rem] w-full max-w-[30rem]'
    >
      <MetricExplainer
        title='Weekly active teams'
        note='Illustrative'
        value={ACTIVE_TEAMS}
        previous={TEAMS_LAST_WEEK}
        unit='teams'
        reference='last week'
        drivers={DRIVERS}
        explanation={stream}
        onExplain={explain}
        spotlightId={whileDemonstrating(isAutoplaying, spotlight)}
        isExplainPressed={pressed === 'explain'}
        className='w-full'
      />
    </div>
  );
}
