'use client';

import { motion, type Transition } from 'motion/react';
import { useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import {
  Link2Icon,
  MailIcon,
  MousePointerClickIcon,
  SearchIcon,
  Share2Icon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import {
  EASE_IN_OUT_STRONG,
  INSTANT,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { ChartCard } from './_parts/chart-card';
import {
  ROUNDED_ENDS,
  ROUNDED_LEFT,
  ROUNDED_RIGHT,
  ROUNDED_TOP,
} from './_parts/corners';
import { DataTable, type DataRow } from './_parts/data-table';
import { formatCount } from './_parts/format';
import { percentOf } from './_parts/scale';
import { useChartDemo } from './_parts/use-chart-demo';
import { WrappingRoll } from './_parts/wrapping-roll';

export type ShiftView = 'list' | 'bars' | 'change';

export type ShiftSource = {
  id: string;
  name: string;
  icon: Icon;
  value: number;
  /** The change against the period before, as a whole percentage. Below zero when it fell. */
  change: number;
};

export type SourceShiftProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  sources: readonly ShiftSource[];
  view: ShiftView;
  onViewChange: (view: ShiftView) => void;
  /** What the values count, in the plural: "visits". */
  unit: string;
  /** The period the values cover: "this week". */
  period: string;
  className?: string;
};

const VIEWS: Segment<ShiftView>[] = [
  { value: 'list', label: 'List' },
  { value: 'bars', label: 'Bars' },
  { value: 'change', label: 'Change' },
];

/** The height of the tallest bar when the sources stand side by side. */
const BAR_AREA_PX = 116;

const GLIDE: Transition = {
  layout: { duration: 0.42, ease: EASE_IN_OUT_STRONG },
};

const NO_GLIDE: Transition = { layout: INSTANT };

function glideOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return NO_GLIDE;
  }
  return GLIDE;
}

type ViewClasses = {
  list: string;
  item: string;
  icon: string;
  name: string;
  value: string;
  change: string;
  bar: string;
  /** The line a change is measured from. Only the change view draws it. */
  zero: string;
};

/**
 * One set of elements, three places for each of them. A view only says where an element sits, so
 * switching view moves what is already there instead of drawing it again.
 */
const VIEW_CLASSES: Record<ShiftView, ViewClasses> = {
  list: {
    list: 'flex flex-col',
    item: 'grid grid-cols-[auto_minmax(0,1fr)_auto_2.5rem] items-center gap-x-2 gap-y-1 py-1.5 @xs:grid-cols-[auto_minmax(0,1fr)_auto_3rem] @xs:gap-x-3',
    icon: 'row-span-2',
    name: 'col-start-2 row-start-1 truncate text-[13px]',
    value: 'col-start-3 row-start-1 text-[13px] font-medium',
    change:
      'text-muted-foreground col-start-4 row-start-1 justify-self-end text-xs',
    bar: 'col-start-2 col-end-5 row-start-2 h-1 justify-self-start',
    zero: 'hidden',
  },
  bars: {
    list: 'grid items-end gap-1.5',
    item: 'flex min-w-0 flex-col items-center gap-1.5',
    icon: 'order-3',
    name: 'sr-only order-4 text-center text-[11px] @sm:not-sr-only @sm:w-full @sm:truncate',
    value: 'order-1 text-xs font-medium @sm:text-[13px]',
    change: 'text-muted-foreground order-5 text-[11px]',
    bar: 'order-2 w-6 max-w-full',
    zero: 'hidden',
  },
  change: {
    list: 'flex flex-col',
    item: 'grid grid-cols-[auto_4.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 py-1.5 @xs:grid-cols-[auto_5.5rem_minmax(0,1fr)_3rem] @xs:gap-x-3',
    icon: 'row-span-2',
    name: 'col-start-2 row-start-1 truncate text-[13px]',
    value: 'text-muted-foreground col-start-2 row-start-2 text-[11px]',
    change:
      'col-start-4 row-span-2 row-start-1 justify-self-end text-[13px] font-medium',
    bar: 'col-start-3 row-span-2 row-start-1 h-3 justify-self-start',
    zero: 'bg-foreground/20 col-start-3 row-span-2 row-start-1 h-full w-px justify-self-center',
  },
};

function largestOf(values: readonly number[]) {
  let largest = 1;
  for (const value of values) {
    largest = Math.max(largest, value);
  }
  return largest;
}

type Bounds = {
  /** The largest value, and the largest change whichever way it went. */
  value: number;
  change: number;
};

function boundsOf(sources: readonly ShiftSource[]): Bounds {
  const values = sources.map((source) => source.value);
  const changes = sources.map((source) => Math.abs(source.change));
  return { value: largestOf(values), change: largestOf(changes) };
}

/** A change grows from the middle of its track: to the right when it rose, to the left when it fell. */
function changeBarOf(source: ShiftSource, bounds: Bounds): React.CSSProperties {
  const size = Math.abs(source.change);
  const reach = size / bounds.change;
  const half = reach * 0.5;
  const width = percentOf(half);
  if (source.change >= 0) {
    return { marginLeft: '50%', width, ...ROUNDED_RIGHT };
  }
  const start = 0.5 - half;
  return { marginLeft: percentOf(start), width, ...ROUNDED_LEFT };
}

function barStyleOf(
  source: ShiftSource,
  view: ShiftView,
  bounds: Bounds
): React.CSSProperties {
  const share = source.value / bounds.value;
  if (view === 'bars') {
    const height = share * BAR_AREA_PX;
    return { height, ...ROUNDED_TOP };
  }
  if (view === 'change') {
    return changeBarOf(source, bounds);
  }
  return { width: percentOf(share), ...ROUNDED_ENDS };
}

/** In the change view a bar says which way a source went, so it takes the colour of that way. */
function barToneOf(source: ShiftSource, view: ShiftView) {
  const hasFallen = source.change < 0;
  const showsChange = view === 'change';
  if (hasFallen && showsChange) {
    return 'bg-destructive';
  }
  return 'bg-primary';
}

function changeTextOf(change: number) {
  if (change > 0) {
    return `+${change}%`;
  }
  return `${change}%`;
}

/** The sources in the order a view reads them: the largest first, or the fastest riser first. */
function orderedFor(view: ShiftView, sources: readonly ShiftSource[]) {
  const ordered = [...sources];
  if (view === 'change') {
    return ordered.sort((first, second) => second.change - first.change);
  }
  return ordered.sort((first, second) => second.value - first.value);
}

type Reading = {
  headline: string;
  detail: string;
};

function fallOf(source: ShiftSource | undefined) {
  const hasFallen = source !== undefined && source.change < 0;
  if (!hasFallen) {
    return 'No source fell';
  }
  const size = Math.abs(source.change);
  return `${source.name} fell the most, down ${size}%`;
}

/** The view in two lines: what leads, then the figure behind it. */
function readingOf(
  view: ShiftView,
  sources: readonly ShiftSource[],
  unit: string,
  period: string
): Reading {
  const byValue = orderedFor('list', sources);
  const byChange = orderedFor('change', sources);
  const largest = byValue.at(0);
  const riser = byChange.at(0);
  const faller = byChange.at(-1);
  const hasSources = largest !== undefined && riser !== undefined;
  if (!hasSources) {
    return { headline: 'No source yet', detail: '' };
  }
  if (view === 'change') {
    return {
      headline: `${riser.name} grew the fastest, up ${riser.change}%`,
      detail: fallOf(faller),
    };
  }
  const amount = formatCount(largest.value);
  return {
    headline: `${largest.name} brings the most ${unit}`,
    detail: `${amount} ${period}`,
  };
}

function listStyleOf(view: ShiftView, count: number) {
  if (view === 'bars') {
    return { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
  }
  return undefined;
}

type SourceItemProps = {
  source: ShiftSource;
  view: ShiftView;
  bounds: Bounds;
  transition: Transition;
};

/** Every part of a source keeps its element from one view to the next, and glides to its new place. */
function SourceItem({ source, view, bounds, transition }: SourceItemProps) {
  const classes = VIEW_CLASSES[view];
  const SourceIcon = source.icon;

  return (
    <li className={classes.item}>
      <motion.span
        layout='position'
        layoutDependency={view}
        transition={transition}
        aria-hidden='true'
        className={cn(
          'keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md',
          classes.icon
        )}
      >
        <SourceIcon className='size-3.5' />
      </motion.span>
      <motion.span
        layout='position'
        layoutDependency={view}
        transition={transition}
        className={cn('min-w-0', classes.name)}
      >
        {source.name}
      </motion.span>
      <motion.span
        layout='position'
        layoutDependency={view}
        transition={transition}
        className={cn(
          'tabular-nums transition-colors duration-200',
          classes.value
        )}
      >
        {formatCount(source.value)}
      </motion.span>
      <motion.span
        layout='position'
        layoutDependency={view}
        transition={transition}
        className={cn(
          'tabular-nums transition-colors duration-200',
          classes.change
        )}
      >
        {changeTextOf(source.change)}
      </motion.span>
      <span aria-hidden='true' className={classes.zero} />
      <motion.span
        layout
        layoutDependency={view}
        transition={transition}
        aria-hidden='true'
        className={cn(
          'transition-colors duration-300',
          barToneOf(source, view),
          classes.bar
        )}
        style={barStyleOf(source, view, bounds)}
      />
    </li>
  );
}

export function SourceShift({
  title,
  note,
  sources,
  view,
  onViewChange,
  unit,
  period,
  className,
}: SourceShiftProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = glideOf(shouldReduceMotion);
  const bounds = boundsOf(sources);
  const ordered = orderedFor(view, sources);
  const reading = readingOf(view, sources, unit, period);
  const classes = VIEW_CLASSES[view];
  const summary = `${reading.headline}. ${reading.detail}.`;

  const rows: DataRow[] = ordered.map((source) => ({
    id: source.id,
    label: source.name,
    cells: [formatCount(source.value), changeTextOf(source.change)],
  }));

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
          onValueChange={onViewChange}
          label='How to read the sources'
        />
      }
    >
      <div className='flex flex-col'>
        <p className='text-sm font-medium'>
          <WrappingRoll text={reading.headline} />
        </p>
        <p className='text-muted-foreground text-xs tabular-nums'>
          <WrappingRoll text={reading.detail} />
        </p>
      </div>
      <ul className={classes.list} style={listStyleOf(view, ordered.length)}>
        {ordered.map((source) => (
          <SourceItem
            key={source.id}
            source={source}
            view={view}
            bounds={bounds}
            transition={transition}
          />
        ))}
      </ul>
      <DataTable
        caption={`${title}, ${period}`}
        columns={['Source', unit, 'Change on the period before']}
        rows={rows}
      />
    </ChartCard>
  );
}

const SOURCES: ShiftSource[] = [
  { id: 'search', name: 'Search', icon: SearchIcon, value: 4212, change: 12 },
  {
    id: 'direct',
    name: 'Direct',
    icon: MousePointerClickIcon,
    value: 2870,
    change: 3,
  },
  {
    id: 'referral',
    name: 'Referral',
    icon: Link2Icon,
    value: 1640,
    change: -4,
  },
  { id: 'social', name: 'Social', icon: Share2Icon, value: 1105, change: -9 },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: MailIcon,
    value: 760,
    change: 31,
  },
];

export default function Chart08() {
  const [view, setView] = useState<ShiftView>('list');

  function resetDemo() {
    setView('list');
  }

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => setView('bars') },
    { after: 2800, run: () => setView('change') },
    { after: 2800, run: () => setView('list') },
    { after: 1200, run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[23rem] w-full max-w-[26rem]'
    >
      <SourceShift
        title='Where visitors come from'
        note='Illustrative'
        sources={SOURCES}
        view={view}
        onViewChange={setView}
        unit='visits'
        period='this week'
        className='w-full'
      />
    </div>
  );
}
