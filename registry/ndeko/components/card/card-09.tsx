'use client';

import { useEffect, useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { hashOf } from '@/registry/ndeko/lib/seeded';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type DoneProject = {
  id: string;
  name: string;
  /** The colour of the project's tiles and of its dot in the legend. */
  series: SeriesSlot;
};

export type DoneRange = {
  id: string;
  /** The word on the switch, and the words that end the headline: "Week", "this week". */
  label: string;
  phrase: string;
  /** Tasks done per project id over the range. */
  done: Record<string, number>;
};

const PILE_WIDTH = 260;

const TILE_GAP = 2;

/** A row sits a little into the one under it, the way loose tiles settle. */
const ROW_RISE = 0.9;

/** Rotated tiles dip under their own base line: the pile rests this far above the floor so no corner is cut. */
const FLOOR_PX = 3;

/** A wider heap for more tiles: its first row grows with the square root of the count. */
const HEAP_SPREAD = 2.6;

/** A month of a busy team would bury the card: the heap stops growing here, the headline keeps the real count. */
const MAX_TILES = 90;

/** A tile shifts by up to 2px and leans by up to 7 degrees. */
const NUDGE_STEPS = 5;

const LEAN_STEPS = 15;

const LEAN_SHIFT = 4;

const CORNER_SHARE = 0.28;

const DROP_SPREAD_MS = 520;

const DROP_STEP_MS = 60;

const DRAIN_STEP_MS = 30;

const DRAIN_MS = 440;

const TILE = [
  'gem-plate absolute bottom-0 left-0 flex items-center justify-center',
  'transition-[translate,opacity] duration-500 ease-(--ease-in-out-strong)',
].join(' ');

/** The heap is laid out on a fixed width: a narrow card shows its middle, where every tile lands, and clips the empty sides. */
const PILE_FRAME = 'flex flex-col items-center overflow-hidden';

const DROPPED_IN = 'starting:-translate-y-36 starting:opacity-0';

const DRAINED = 'translate-y-12 opacity-0 duration-300';

type TileStyle = React.CSSProperties & { '--gem': string };

type TilePlace = { x: number; y: number; turn: number; row: number };

function tileSizeOf(count: number) {
  if (count <= 6) {
    return 30;
  }
  if (count <= 24) {
    return 22;
  }
  if (count <= 48) {
    return 16;
  }
  return 12;
}

function firstRowOf(count: number, size: number) {
  const step = size + TILE_GAP;
  const mostColumns = Math.floor(PILE_WIDTH / step);
  const scaled = count * HEAP_SPREAD;
  const spread = Math.sqrt(scaled);
  const wanted = Math.ceil(spread);
  const fitting = Math.min(wanted, mostColumns);
  return Math.max(fitting, 1);
}

/** A whole number spread evenly around zero: 5 steps give -2 to 2. */
function centredOn(bits: number, steps: number) {
  const half = Math.floor(steps / 2);
  const within = bits % steps;
  return within - half;
}

/** A tile leans and shifts by a few pixels drawn from its place, the same on the server and in the browser. */
function placeOf(
  count: number,
  row: number,
  column: number,
  rowStart: number,
  size: number
): TilePlace {
  const seed = hashOf(`${count}-${row}-${column}`);
  const leanBits = seed >>> LEAN_SHIFT;
  const nudge = centredOn(seed, NUDGE_STEPS);
  const turn = centredOn(leanBits, LEAN_STEPS);
  const step = size + TILE_GAP;
  const offset = column * step;
  const rise = size * ROW_RISE;
  const inRow = rowStart + offset;
  const x = inRow + nudge;
  const y = row * rise;
  return { x, y, turn, row };
}

/**
 * Where each tile of a heap rests, worked out once from the count: rows centred on the floor, each
 * one tile shorter than the row under it. Nothing is simulated while the tiles fall.
 */
function pileOf(count: number, size: number) {
  const places: TilePlace[] = [];
  const step = size + TILE_GAP;
  let rowLength = firstRowOf(count, size);
  let row = 0;
  let left = count;
  while (left > 0) {
    const inRow = Math.min(rowLength, left);
    const span = inRow * step;
    const rowWidth = span - TILE_GAP;
    const free = PILE_WIDTH - rowWidth;
    const rowStart = free / 2;
    for (let column = 0; column < inRow; column += 1) {
      const place = placeOf(count, row, column, rowStart, size);
      places.push(place);
    }
    const shorter = rowLength - 1;
    left -= inRow;
    row += 1;
    rowLength = Math.max(shorter, 1);
  }
  return places;
}

function totalOf(range: DoneRange, projects: DoneProject[]) {
  let total = 0;
  for (const project of projects) {
    const done = range.done[project.id] ?? 0;
    total += done;
  }
  return total;
}

/** One series per tile, the projects taking turns, so the heap mixes their colours the way a week mixes their tasks. */
function tileSeriesOf(range: DoneRange, projects: DoneProject[]) {
  const left = projects.map((project) => range.done[project.id] ?? 0);
  const series: SeriesSlot[] = [];
  let hasLeft = true;
  while (hasLeft) {
    if (series.length >= MAX_TILES) {
      break;
    }
    hasLeft = false;
    for (let index = 0; index < projects.length; index += 1) {
      if (left[index] > 0) {
        left[index] -= 1;
        series.push(projects[index].series);
        hasLeft = true;
      }
    }
  }
  return series.slice(0, MAX_TILES);
}

function dropDelayOf(index: number, count: number) {
  const tiles = Math.max(count, 1);
  const even = DROP_SPREAD_MS / tiles;
  const step = Math.min(even, DROP_STEP_MS);
  return index * step;
}

function delayOf(
  place: TilePlace,
  index: number,
  count: number,
  isDraining: boolean
) {
  if (isDraining) {
    return place.row * DRAIN_STEP_MS;
  }
  return dropDelayOf(index, count);
}

function taskWordOf(count: number) {
  if (count === 1) {
    return 'task done';
  }
  return 'tasks done';
}

function drainTimeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 0;
  }
  return DRAIN_MS;
}

type PileProps = {
  rangeId: string;
  series: SeriesSlot[];
  /** The tiles fall away through the floor before the next range lands. */
  isDraining: boolean;
  /** False for the heap the card starts with: it is there, it does not fall in. */
  hasDropped: boolean;
};

function Pile({ rangeId, series, isDraining, hasDropped }: PileProps) {
  const count = series.length;
  const size = tileSizeOf(count);
  const places = pileOf(count, size);
  const radius = size * CORNER_SHARE;
  const hasGlyph = size >= 22;

  return (
    <div
      aria-hidden='true'
      className='relative h-32 w-[16.25rem] shrink-0 overflow-hidden'
    >
      {places.map((place, index) => {
        const lift = place.y + FLOOR_PX;
        const delay = delayOf(place, index, count, isDraining);
        const tileStyle: TileStyle = {
          '--gem': seriesColorOf(series[index]),
          width: size,
          height: size,
          borderRadius: radius,
          transform: `translate(${place.x}px, -${lift}px) rotate(${place.turn}deg)`,
          transitionDelay: `${delay}ms`,
        };
        return (
          <span
            key={`${rangeId}-${index}`}
            style={tileStyle}
            className={cn(
              TILE,
              hasDropped && DROPPED_IN,
              isDraining && DRAINED
            )}
          >
            {hasGlyph && <CheckIcon strokeWidth={2.5} className='size-3' />}
          </span>
        );
      })}
    </div>
  );
}

export type DonePileProps = {
  projects: DoneProject[];
  ranges: DoneRange[];
  rangeId: string;
  onRangeChange: (rangeId: string) => void;
  /** Says the counts are made up. Leave it out for real counts. */
  note?: string;
  className?: string;
};

export function DonePile({
  projects,
  ranges,
  rangeId,
  onRangeChange,
  note,
  className,
}: DonePileProps) {
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const [shownId, setShownId] = useState(rangeId);
  const [hasDropped, setHasDropped] = useState(false);
  const isDraining = rangeId !== shownId;
  const shown = ranges.find((range) => range.id === shownId);

  useEffect(() => {
    if (!isDraining) {
      return;
    }
    const timer = setTimeout(() => {
      setShownId(rangeId);
      setHasDropped(true);
    }, drainTimeOf(shouldReduceMotion));
    return () => clearTimeout(timer);
  }, [isDraining, rangeId, shouldReduceMotion]);

  if (!shown) {
    return null;
  }

  const total = totalOf(shown, projects);
  const series = tileSeriesOf(shown, projects);
  const segments: Segment<string>[] = ranges.map((range) => ({
    value: range.id,
    label: range.label,
  }));

  return (
    <Card
      role='group'
      aria-labelledby={titleId}
      className={cn('@container w-full gap-4 p-5', className)}
    >
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h3 id={titleId} className='text-sm font-medium'>
            Done
          </h3>
          {note && <SampleNote className='truncate'>{note}</SampleNote>}
        </div>
        <Segments
          value={rangeId}
          segments={segments}
          onValueChange={onRangeChange}
          label='Range'
          className='@max-2xs:w-full'
        />
      </div>
      <div className={PILE_FRAME}>
        <Pile
          rangeId={shown.id}
          series={series}
          isDraining={isDraining}
          hasDropped={hasDropped}
        />
        <p className='hairline-t border-foreground/15 flex w-full flex-wrap items-baseline justify-center gap-x-1.5 pt-3 text-[13px]'>
          <MotionNumber
            value={total}
            className='text-[28px] leading-8 font-semibold'
          />
          <span>{taskWordOf(total)}</span>
          <WordRoll text={shown.phrase} className='text-muted-foreground' />
        </p>
      </div>
      <ul className='flex flex-wrap justify-center gap-x-4 gap-y-1'>
        {projects.map((project) => {
          const dotStyle = { backgroundColor: seriesColorOf(project.series) };
          return (
            <li key={project.id} className='flex items-center gap-1.5 text-xs'>
              <span
                aria-hidden='true'
                style={dotStyle}
                className='size-2 rounded-full'
              />
              {project.name}
              <span className='text-muted-foreground tabular-nums'>
                {shown.done[project.id] ?? 0}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const PROJECTS: DoneProject[] = [
  { id: 'website', name: 'Website', series: 1 },
  { id: 'mobile', name: 'Mobile app', series: 2 },
  { id: 'billing', name: 'Billing', series: 3 },
];

const RANGES: DoneRange[] = [
  {
    id: 'today',
    label: 'Today',
    phrase: 'today',
    done: { website: 2, mobile: 2, billing: 1 },
  },
  {
    id: 'week',
    label: 'Week',
    phrase: 'this week',
    done: { website: 7, mobile: 6, billing: 4 },
  },
  {
    id: 'month',
    label: 'Month',
    phrase: 'this month',
    done: { website: 26, mobile: 21, billing: 15 },
  },
];

const FIRST_RANGE_ID = 'week';

function announcementOf(rangeId: string) {
  const range = RANGES.find((candidate) => candidate.id === rangeId);
  if (!range) {
    return '';
  }
  const total = totalOf(range, PROJECTS);
  const word = taskWordOf(total);
  return `${total} ${word} ${range.phrase}`;
}

export default function Card09() {
  const [rangeId, setRangeId] = useState(FIRST_RANGE_ID);

  const steps: AutoplayStep[] = [
    { after: 2600, run: () => setRangeId('month') },
    { after: 3400, run: () => setRangeId('today') },
    { after: 3000, run: () => setRangeId(FIRST_RANGE_ID) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 600,
  });

  return (
    <div ref={ref} className='min-h-[18rem] w-full max-w-[22rem]'>
      <DonePile
        projects={PROJECTS}
        ranges={RANGES}
        rangeId={rangeId}
        onRangeChange={setRangeId}
        note='Illustrative'
      />
      <LiveRegion
        message={spokenUnless(isAutoplaying, announcementOf(rangeId))}
      />
    </div>
  );
}
