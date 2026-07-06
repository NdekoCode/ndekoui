'use client';

import { animate } from 'motion/react';
import {
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { hold, spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import {
  CategoryAxis,
  GridLines,
  labelStepOf,
  spacedLabelsOf,
  ValueAxis,
  type AxisLabel,
} from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { DataTable, type DataRow } from './_parts/data-table';
import { COUNT_FORMAT, formatCompact, formatCount } from './_parts/format';
import { PLOT_SURFACE } from './_parts/plot';
import { seededRandom, spreadOf } from './_parts/random';
import { Readout, ReadoutRow, ReadoutTitle } from './_parts/readout';
import {
  clamp,
  extentOf,
  niceScaleOf,
  percentOf,
  ratioOf,
  sumOf,
  withZero,
  type Scale,
} from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { usePlotWidth } from './_parts/use-plot-width';
import { readingAloud, useReading } from './_parts/use-reading';

type ValueFormat = (value: number) => string;

export type ScatterGroup = {
  id: string;
  name: string;
  /** Fixed per group, so a colour always names the same thing. Three groups at most keep every pair apart. */
  series: SeriesSlot;
};

export type ScatterPoint = {
  id: string;
  groupId: string;
  x: number;
  y: number;
};

/** A place in the plot as shares of its width and height, from its top left corner. */
export type PlotPoint = {
  x: number;
  y: number;
};

export type LassoScatterHandle = {
  /** Draws a lasso through these places over a duration, then selects what it holds. */
  trace: (path: readonly PlotPoint[], durationMs: number) => void;
  /** Selects what a lasso holds at once, with nothing drawn on the way. */
  select: (path: readonly PlotPoint[]) => void;
  clear: () => void;
};

export type LassoScatterProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  points: readonly ScatterPoint[];
  groups: readonly ScatterGroup[];
  /** What one point is, in the plural: "requests". And what a group is: "models". */
  noun: string;
  groupNoun?: string;
  /** What each axis measures, as the readout says it: "tokens", "latency". */
  xName: string;
  yName: string;
  /** Written after the average of the vertical measure: "s". */
  yUnit?: string;
  formatX?: ValueFormat;
  formatY?: ValueFormat;
  /** The lasso the piece opens with, so its first picture already reads a cluster. */
  defaultLasso?: readonly PlotPoint[];
  /** Draw or clear a lasso from outside, for a demonstration or a control beside the plot. */
  handleRef?: React.Ref<LassoScatterHandle>;
  className?: string;
};

type Placed = {
  point: ScatterPoint;
  place: PlotPoint;
  color: string;
  groupName: string;
};

type Selection = {
  ids: ReadonlySet<string>;
  /** The outline that was drawn, or null when a whole group was picked. */
  lasso: readonly PlotPoint[] | null;
  groupId: string | null;
};

type Layout = {
  xScale: Scale;
  yScale: Scale;
  /** The points from left to right: the order the arrow keys read them in. */
  placed: Placed[];
};

const PLOT_HEIGHT = 220;

const MAX_LINES = 4;

const FALLBACK_WIDTH = 460;

/** The lasso is drawn in a box of this many units a side, stretched to the plot. */
const LASSO_UNITS = 1000;

/** A lasso of fewer places than this is a click, which clears the selection. */
const MIN_LASSO_PLACES = 6;

/** A new place is kept once the pointer has moved this share of the plot away from the last one. */
const MIN_STEP = 0.012;

/** How close the pointer has to be to a point to read it, in pixels. */
const HOVER_REACH_PX = 28;

const FALLBACK_COLOR = 'var(--muted-foreground)';

const ORIGIN: PlotPoint = { x: 0, y: 0 };

const NO_LASSO: readonly PlotPoint[] = [];

const AVERAGE_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const AVERAGE = new Intl.NumberFormat('en-US', AVERAGE_FORMAT);

function scaleOf(values: readonly number[]) {
  const extent = extentOf(values);
  const domain = withZero(extent);
  return niceScaleOf(domain, MAX_LINES);
}

function colorOf(group: ScatterGroup | undefined) {
  if (!group) {
    return FALLBACK_COLOR;
  }
  return seriesColorOf(group.series);
}

function placeOf(point: ScatterPoint, xScale: Scale, yScale: Scale) {
  const x = ratioOf(point.x, xScale);
  const fromBottom = ratioOf(point.y, yScale);
  const y = 1 - fromBottom;
  return { x, y };
}

function layoutOf(
  points: readonly ScatterPoint[],
  groups: readonly ScatterGroup[]
): Layout {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const xScale = scaleOf(xValues);
  const yScale = scaleOf(yValues);
  const placed = points.map((point): Placed => {
    const group = groups.find((candidate) => candidate.id === point.groupId);
    return {
      point,
      place: placeOf(point, xScale, yScale),
      color: colorOf(group),
      groupName: group?.name ?? '',
    };
  });
  placed.sort((first, second) => first.place.x - second.place.x);
  return { xScale, yScale, placed };
}

/** Whether a horizontal ray from a place crosses the edge between two corners of an outline. */
function rayCrosses(place: PlotPoint, from: PlotPoint, to: PlotPoint) {
  const isFromBelow = from.y > place.y;
  const isToBelow = to.y > place.y;
  if (isFromBelow === isToBelow) {
    return false;
  }
  const run = to.x - from.x;
  const rise = to.y - from.y;
  const climbed = place.y - from.y;
  const along = climbed / rise;
  const travelled = along * run;
  const crossingX = from.x + travelled;
  return place.x < crossingX;
}

/** A place is inside an outline when a ray from it crosses the outline an odd number of times. */
function isInside(place: PlotPoint, outline: readonly PlotPoint[]) {
  let crossings = 0;
  let previous = outline[outline.length - 1];
  for (const corner of outline) {
    if (rayCrosses(place, previous, corner)) {
      crossings += 1;
    }
    previous = corner;
  }
  return crossings % 2 === 1;
}

function idsOf(entries: readonly Placed[]) {
  const ids = entries.map((entry) => entry.point.id);
  return new Set(ids);
}

function lassoSelectionOf(
  placed: readonly Placed[],
  lasso: readonly PlotPoint[]
): Selection {
  const held = placed.filter((entry) => isInside(entry.place, lasso));
  return { ids: idsOf(held), lasso, groupId: null };
}

function groupSelectionOf(
  placed: readonly Placed[],
  groupId: string
): Selection {
  const members = placed.filter((entry) => entry.point.groupId === groupId);
  return { ids: idsOf(members), lasso: null, groupId };
}

function initialSelectionOf(
  placed: readonly Placed[],
  lasso: readonly PlotPoint[] | undefined
) {
  if (!lasso) {
    return null;
  }
  return lassoSelectionOf(placed, lasso);
}

function selectedOf(placed: readonly Placed[], selection: Selection | null) {
  if (!selection) {
    return placed;
  }
  return placed.filter((entry) => selection.ids.has(entry.point.id));
}

/** The outline of the selection, once the lasso that drew it is closed. */
function settledLassoOf(selection: Selection | null, isDrawing: boolean) {
  if (isDrawing) {
    return NO_LASSO;
  }
  return selection?.lasso ?? NO_LASSO;
}

function cornerOf(place: PlotPoint) {
  const x = place.x * LASSO_UNITS;
  const y = place.y * LASSO_UNITS;
  const left = x.toFixed(1);
  const top = y.toFixed(1);
  return `${left},${top}`;
}

function lassoPointsOf(path: readonly PlotPoint[]) {
  const corners = path.map((place) => cornerOf(place));
  return corners.join(' ');
}

function isFarEnough(from: PlotPoint, to: PlotPoint) {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return dx + dy >= MIN_STEP;
}

function placeFrom(event: React.PointerEvent<HTMLElement>): PlotPoint {
  const box = event.currentTarget.getBoundingClientRect();
  const left = event.clientX - box.left;
  const top = event.clientY - box.top;
  return { x: left / box.width, y: top / box.height };
}

function pixelsBetween(first: PlotPoint, second: PlotPoint, box: DOMRect) {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return Math.hypot(dx * box.width, dy * box.height);
}

/** The point nearest to the pointer, when one is within reach. */
function nearestIndexOf(
  placed: readonly Placed[],
  event: React.PointerEvent<HTMLElement>
) {
  const box = event.currentTarget.getBoundingClientRect();
  const pointer = placeFrom(event);
  let nearest: number | null = null;
  let nearestDistance = HOVER_REACH_PX;
  for (const [index, entry] of placed.entries()) {
    const distance = pixelsBetween(entry.place, pointer, box);
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  }
  return nearest;
}

type Figures = {
  count: number;
  /** The average of the vertical measure, and the group most points belong to. */
  averageY: number;
  leader: string;
};

function leaderOf(entries: readonly Placed[]) {
  const counts = new Map<string, number>();
  let leader = '';
  let leaderCount = 0;
  for (const entry of entries) {
    const before = counts.get(entry.groupName) ?? 0;
    const count = before + 1;
    counts.set(entry.groupName, count);
    if (count > leaderCount) {
      leader = entry.groupName;
      leaderCount = count;
    }
  }
  return leader;
}

function figuresOf(entries: readonly Placed[]): Figures {
  const values = entries.map((entry) => entry.point.y);
  const count = entries.length;
  const total = sumOf(values);
  const divisor = Math.max(count, 1);
  return { count, averageY: total / divisor, leader: leaderOf(entries) };
}

function dimmedOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-[0.16]';
  }
  return undefined;
}

type DotsProps = {
  placed: readonly Placed[];
  /** Null when nothing is selected: every dot is then drawn in full. */
  selectedIds: ReadonlySet<string> | null;
};

/** Memoized: three hundred dots are only drawn again when the selection changes, not when a readout moves. */
const Dots = memo(function Dots({ placed, selectedIds }: DotsProps) {
  return (
    <svg
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 size-full overflow-visible'
    >
      {placed.map((entry) => {
        const isOutside =
          selectedIds !== null && !selectedIds.has(entry.point.id);

        return (
          <circle
            key={entry.point.id}
            cx={percentOf(entry.place.x)}
            cy={percentOf(entry.place.y)}
            r={4}
            className={cn(
              'stroke-card [stroke-width:1.5] transition-opacity duration-200',
              dimmedOf(isOutside)
            )}
            style={{ fill: entry.color }}
          />
        );
      })}
    </svg>
  );
});

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'bg-foreground/[0.06]';
  }
  return undefined;
}

type GroupPickerProps = {
  groups: readonly ScatterGroup[];
  selectedGroupId: string | null;
  onToggle: (groupId: string) => void;
  noun: string;
};

/** The legend is also the way in for the keyboard: a group button selects every point of that group. */
function GroupPicker({
  groups,
  selectedGroupId,
  onToggle,
  noun,
}: GroupPickerProps) {
  return (
    <div
      role='group'
      aria-label={`Select the ${noun} of one group`}
      className='-mx-1.5 flex flex-wrap gap-x-1 gap-y-0.5'
    >
      {groups.map((group) => (
        <button
          key={group.id}
          type='button'
          aria-pressed={group.id === selectedGroupId}
          onClick={() => onToggle(group.id)}
          className={cn(
            'hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-7 cursor-pointer items-center gap-2 rounded-md px-1.5 text-xs outline-none',
            'transition-[background-color,scale] duration-150 ease-(--ease-out-strong) focus-visible:ring-[3px] active:scale-[0.97]',
            pressedOf(group.id === selectedGroupId)
          )}
        >
          <span
            aria-hidden='true'
            className='size-2 shrink-0 rounded-full'
            style={{ backgroundColor: seriesColorOf(group.series) }}
          />
          {group.name}
        </button>
      ))}
    </div>
  );
}

/** The last label of an axis names what the axis measures. */
function lastLabelOf(text: string, name: string, isLast: boolean) {
  if (isLast) {
    return `${text} ${name}`;
  }
  return text;
}

/** The ticks that fit the width of the plot, counted back from the last, which names the measure. */
function tickLabelsOf(
  scale: Scale,
  format: ValueFormat,
  name: string,
  plotWidth: number
) {
  const lastTick = scale.ticks[scale.ticks.length - 1];
  const all = scale.ticks.map((tick): AxisLabel => {
    const text = format(tick);
    return {
      id: String(tick),
      text: lastLabelOf(text, name, tick === lastTick),
      ratio: ratioOf(tick, scale),
    };
  });
  const step = labelStepOf(all.length, plotWidth);
  return spacedLabelsOf(all, step);
}

/** Without a selection the headline says how wide it reads; with one, which group leads in it. */
function leaderWordsOf(
  selection: Selection | null,
  figures: Figures,
  groupCount: number,
  groupNoun: string
) {
  if (!selection) {
    return `across ${groupCount} ${groupNoun}`;
  }
  return `mostly ${figures.leader}`;
}

/** A selection is said once a person has made one: what a demonstration draws stays silent. */
function spokenSelectionOf(
  selection: Selection | null,
  headline: string,
  hasSelectedByHand: boolean
) {
  if (!selection) {
    return '';
  }
  return spokenUnless(!hasSelectedByHand, headline);
}

export function LassoScatter({
  title,
  note,
  points,
  groups,
  noun,
  groupNoun = 'groups',
  xName,
  yName,
  yUnit = '',
  formatX = formatCompact,
  formatY = formatCompact,
  defaultLasso,
  handleRef,
  className,
}: LassoScatterProps) {
  const layout = useMemo(() => layoutOf(points, groups), [points, groups]);
  const { placed, xScale, yScale } = layout;
  const { plotRef, width } = usePlotWidth(FALLBACK_WIDTH);
  const [selection, setSelection] = useState(() =>
    initialSelectionOf(placed, defaultLasso)
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSelectedByHand, setHasSelectedByHand] = useState(false);
  const lassoRef = useRef<SVGPolylineElement>(null);
  const drawing = useRef<PlotPoint[] | null>(null);
  const tracing = useRef<ReturnType<typeof animate> | null>(null);
  const reading = useReading({ count: placed.length, defaultIndex: 0 });
  const shown = placed.at(reading.shownIndex);
  const shownPlace = shown?.place ?? ORIGIN;
  const shownX = formatX(shown?.point.x ?? 0);
  const shownY = formatY(shown?.point.y ?? 0);
  const shownTop = shownPlace.y * PLOT_HEIGHT;
  const isReadoutShown = reading.isActive && !isDrawing && shown !== undefined;
  const selected = selectedOf(placed, selection);
  const figures = figuresOf(selected);
  const leaderWords = leaderWordsOf(
    selection,
    figures,
    groups.length,
    groupNoun
  );
  /** Last on its line, the phrase takes its new width at once: its words still roll, and no width is animated frame by frame. */
  const leaderWidths = [leaderWords];
  const averageText = AVERAGE.format(figures.averageY);
  const headline = `${figures.count} ${noun}, ${averageText}${yUnit} average ${yName}, ${leaderWords}`;
  const pointReading = `${shown?.groupName}: ${shownY} ${yName}, ${shownX} ${xName}`;
  const spokenSelection = spokenSelectionOf(
    selection,
    headline,
    hasSelectedByHand
  );
  const settledLasso = settledLassoOf(selection, isDrawing);

  useEffect(() => {
    return () => tracing.current?.stop();
  }, []);

  function writeLasso(path: readonly PlotPoint[]) {
    lassoRef.current?.setAttribute('points', lassoPointsOf(path));
  }

  function stopTracing() {
    tracing.current?.stop();
    tracing.current = null;
  }

  function selectLasso(path: readonly PlotPoint[]) {
    setIsDrawing(false);
    setSelection(lassoSelectionOf(placed, path));
  }

  function clear() {
    stopTracing();
    setIsDrawing(false);
    setSelection(null);
  }

  function trace(path: readonly PlotPoint[], durationMs: number) {
    stopTracing();
    setIsDrawing(true);
    tracing.current = animate(0, path.length, {
      duration: durationMs / 1000,
      ease: 'linear',
      onUpdate: (drawn) => {
        const cornerCount = Math.ceil(drawn);
        writeLasso(path.slice(0, cornerCount));
      },
      onComplete: () => selectLasso(path),
    });
  }

  useImperativeHandle(handleRef, () => ({
    trace,
    clear,
    select: selectLasso,
  }));

  function startLasso(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    stopTracing();
    event.currentTarget.setPointerCapture(event.pointerId);
    const path = [placeFrom(event)];
    drawing.current = path;
    reading.pointTo(null);
    setHasSelectedByHand(true);
    setIsDrawing(true);
    writeLasso(path);
  }

  function movePointer(event: React.PointerEvent<HTMLElement>) {
    const path = drawing.current;
    if (!path) {
      const nearest = nearestIndexOf(placed, event);
      reading.pointTo(nearest);
      return;
    }
    const place = placeFrom(event);
    const last = path[path.length - 1];
    if (isFarEnough(last, place)) {
      path.push(place);
      writeLasso(path);
    }
  }

  function endLasso() {
    const path = drawing.current;
    if (!path) {
      return;
    }
    drawing.current = null;
    if (path.length < MIN_LASSO_PLACES) {
      clear();
      return;
    }
    selectLasso(path);
  }

  function cancelLasso() {
    drawing.current = null;
    setIsDrawing(false);
  }

  function toggleGroup(groupId: string) {
    stopTracing();
    setHasSelectedByHand(true);
    setIsDrawing(false);
    if (selection?.groupId === groupId) {
      setSelection(null);
      return;
    }
    setSelection(groupSelectionOf(placed, groupId));
  }

  function clearOnEscape(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      clear();
    }
  }

  const rows: DataRow[] = groups.map((group) => {
    const members = placed.filter((entry) => entry.point.groupId === group.id);
    const groupFigures = figuresOf(members);
    const average = AVERAGE.format(groupFigures.averageY);
    return {
      id: group.id,
      label: group.name,
      cells: [formatCount(groupFigures.count), `${average}${yUnit}`],
    };
  });

  return (
    <ChartCard
      title={title}
      note={note}
      summary={`${headline}.`}
      className={className}
      actions={
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={selection === null}
          onClick={clear}
        >
          Clear selection
        </Button>
      }
    >
      <div className='flex flex-col gap-4' onKeyDown={clearOnEscape}>
        <p className='text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 text-[13px]'>
          <MotionNumber
            value={figures.count}
            format={COUNT_FORMAT}
            className='text-foreground text-2xl leading-8 font-semibold'
          />
          <span>{noun},</span>
          <MotionNumber
            value={figures.averageY}
            format={AVERAGE_FORMAT}
            suffix={yUnit}
            className='text-foreground font-medium'
          />
          <span>average {yName},</span>
          <WordRoll
            text={leaderWords}
            labels={leaderWidths}
            className='text-foreground font-medium'
          />
        </p>
        <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-2'>
          <ValueAxis scale={yScale} height={PLOT_HEIGHT} format={formatY} />
          <div
            ref={plotRef}
            role='group'
            tabIndex={0}
            aria-label={`${title}. Use the arrow keys to read each point from left to right, or pick a group below.`}
            className={cn(PLOT_SURFACE, 'cursor-crosshair select-none')}
            style={{ height: PLOT_HEIGHT }}
            {...reading.markHandlers}
            onPointerDown={startLasso}
            onPointerMove={movePointer}
            onPointerUp={endLasso}
            onPointerCancel={cancelLasso}
          >
            <GridLines scale={yScale} height={PLOT_HEIGHT} />
            <Dots placed={placed} selectedIds={selection?.ids ?? null} />
            <svg
              aria-hidden='true'
              viewBox={`0 0 ${LASSO_UNITS} ${LASSO_UNITS}`}
              preserveAspectRatio='none'
              className='pointer-events-none absolute inset-0 size-full overflow-visible'
            >
              <polygon
                points={lassoPointsOf(settledLasso)}
                vectorEffect='non-scaling-stroke'
                className='fill-foreground/[0.04] stroke-foreground/50 [stroke-width:1.5] [stroke-dasharray:4_3] [stroke-linejoin:round]'
              />
              <polyline
                ref={lassoRef}
                vectorEffect='non-scaling-stroke'
                className={cn(
                  'stroke-foreground/60 fill-none [stroke-width:1.5] [stroke-linecap:round] [stroke-linejoin:round]',
                  !isDrawing && 'hidden'
                )}
              />
            </svg>
            {isReadoutShown && (
              <span
                aria-hidden='true'
                className='ring-foreground/50 pointer-events-none absolute size-3.5 -translate-1/2 rounded-full ring-2'
                style={{
                  left: percentOf(shownPlace.x),
                  top: percentOf(shownPlace.y),
                }}
              />
            )}
            <Readout
              ratio={shownPlace.x}
              top={shownTop}
              isVisible={isReadoutShown}
              isGliding={reading.isGliding}
              hasCrosshair={false}
            >
              <ReadoutTitle>{shown?.groupName}</ReadoutTitle>
              <ReadoutRow value={shownY} name={yName} color={shown?.color} />
              <ReadoutRow value={shownX} name={xName} />
            </Readout>
          </div>
          <span aria-hidden='true' />
          <CategoryAxis
            labels={tickLabelsOf(xScale, formatX, xName, width)}
            className='mt-2'
          />
        </div>
        <GroupPicker
          groups={groups}
          selectedGroupId={selection?.groupId ?? null}
          onToggle={toggleGroup}
          noun={noun}
        />
        <p className='text-muted-foreground text-xs text-pretty'>
          Draw around a cluster, or pick a group, to read it. Escape clears the
          selection
        </p>
      </div>
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, pointReading)}
      />
      <LiveRegion message={spokenSelection} />
      <DataTable
        caption={`${title}, by group`}
        columns={['Group', noun, `Average ${yName}`]}
        rows={rows}
      />
    </ChartCard>
  );
}

type Model = ScatterGroup & {
  seed: number;
  requestCount: number;
  /** Where its requests gather: tokens, then seconds, each with how far they stray. */
  tokens: number;
  tokenSpread: number;
  seconds: number;
  secondSpread: number;
};

const MODELS: Model[] = [
  {
    id: 'swift',
    name: 'Lumen Swift',
    series: 1,
    seed: 7,
    requestCount: 130,
    tokens: 1400,
    tokenSpread: 900,
    seconds: 0.7,
    secondSpread: 0.35,
  },
  {
    id: 'standard',
    name: 'Lumen',
    series: 2,
    seed: 19,
    requestCount: 100,
    tokens: 3500,
    tokenSpread: 1100,
    seconds: 1.5,
    secondSpread: 0.45,
  },
  {
    id: 'max',
    name: 'Lumen Max',
    series: 3,
    seed: 43,
    requestCount: 82,
    tokens: 5900,
    tokenSpread: 1300,
    seconds: 2.8,
    secondSpread: 0.6,
  },
];

const TOKEN_RANGE = { min: 80, max: 8000 };

const SECOND_RANGE = { min: 0.1, max: 4 };

/** Longer requests take longer: a share of how far a request strays in tokens is added to its time. */
const TOKEN_PULL = 0.5;

function requestOf(model: Model, index: number, next: () => number) {
  const tokenDrift = spreadOf(next);
  const pull = tokenDrift * TOKEN_PULL;
  const timeDrift = spreadOf(next) + pull;
  const tokenOffset = tokenDrift * model.tokenSpread;
  const timeOffset = timeDrift * model.secondSpread;
  const tokens = model.tokens + tokenOffset;
  const seconds = model.seconds + timeOffset;
  const point: ScatterPoint = {
    id: `${model.id}-${index}`,
    groupId: model.id,
    x: clamp(tokens, TOKEN_RANGE.min, TOKEN_RANGE.max),
    y: clamp(seconds, SECOND_RANGE.min, SECOND_RANGE.max),
  };
  return point;
}

function requestsOf(model: Model) {
  const next = seededRandom(model.seed);
  return Array.from({ length: model.requestCount }, (_, index) =>
    requestOf(model, index, next)
  );
}

const REQUESTS = MODELS.flatMap((model) => requestsOf(model));

const LOOP_CORNERS = 40;

const FULL_TURN = Math.PI * 2;

/** How uneven a loop is: a hand does not draw a perfect oval. */
const WOBBLE = 0.07;

type Oval = {
  center: PlotPoint;
  radiusX: number;
  radiusY: number;
};

function cornerAt(oval: Oval, corner: number, next: () => number) {
  const progress = corner / LOOP_CORNERS;
  const turn = progress * FULL_TURN;
  const stray = spreadOf(next) * WOBBLE;
  const stretch = 1 + stray;
  const offsetX = Math.cos(turn) * oval.radiusX;
  const offsetY = Math.sin(turn) * oval.radiusY;
  const x = oval.center.x + offsetX * stretch;
  const y = oval.center.y + offsetY * stretch;
  return { x, y };
}

/** A loop round a cluster, the way a hand draws it. */
function loopOf(oval: Oval, seed: number): PlotPoint[] {
  const next = seededRandom(seed);
  return Array.from({ length: LOOP_CORNERS }, (_, corner) =>
    cornerAt(oval, corner, next)
  );
}

const MAX_LOOP = loopOf(
  { center: { x: 0.74, y: 0.3 }, radiusX: 0.21, radiusY: 0.24 },
  5
);

const SWIFT_LOOP = loopOf(
  { center: { x: 0.18, y: 0.82 }, radiusX: 0.16, radiusY: 0.14 },
  9
);

const TRACE_MS = 1100;

/** A selection stays long enough to be read once its lasso is closed. */
const READ_SWIFT_MS = TRACE_MS + 2600;

const READ_MAX_MS = TRACE_MS + 1800;

function formatSeconds(seconds: number) {
  const figure = AVERAGE.format(seconds);
  return `${figure}s`;
}

export default function Chart11() {
  const handle = useRef<LassoScatterHandle>(null);

  function resetDemo() {
    handle.current?.select(MAX_LOOP);
  }

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => handle.current?.clear() },
    { after: 900, run: () => handle.current?.trace(SWIFT_LOOP, TRACE_MS) },
    { after: READ_SWIFT_MS, run: () => handle.current?.clear() },
    { after: 900, run: () => handle.current?.trace(MAX_LOOP, TRACE_MS) },
    { after: READ_MAX_MS, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1200,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[28.5rem] w-full max-w-[34rem]'
    >
      <LassoScatter
        title='Latency against tokens'
        note='Illustrative'
        points={REQUESTS}
        groups={MODELS}
        noun='requests'
        groupNoun='models'
        xName='tokens'
        yName='latency'
        yUnit='s'
        formatY={formatSeconds}
        defaultLasso={MAX_LOOP}
        handleRef={handle}
        className='w-full'
      />
    </div>
  );
}
