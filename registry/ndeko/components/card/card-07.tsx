'use client';

import { useId, useImperativeHandle, useRef, useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import {
  CheckCheckIcon,
  ClockIcon,
  FolderIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { wrapIndex } from './_parts/deck';
import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type WeekFigure = {
  id: string;
  /** One word, for the switch and the row: "Focus". */
  name: string;
  /** The figure as it reads, already formatted: "18h 40m", "23". */
  value: string;
  /** What the figure counts when it does not say so itself: "done", "days". */
  unit?: string;
  detail: string;
  icon: React.ReactNode;
};

export type WeekFiguresHandle = {
  next: () => void;
};

const AWAY_PX = 84;

/** A narrow card stacks each figure over its label, so the faint neighbours of the front row sit further out there. */
const WHEEL_PEEK = '[--peek:52px] @2xs:[--peek:46px]';

const ROW = [
  'absolute inset-x-0 top-1/2 -mt-7 flex h-14 flex-wrap content-center items-center gap-x-3 px-3 @2xs:flex-nowrap',
  'transition-[transform,opacity] duration-500 ease-(--ease-in-out-strong)',
].join(' ');

const FADED_ENDS =
  '[mask-image:linear-gradient(to_bottom,transparent,black_1.75rem,black_calc(100%_-_1.75rem),transparent)]';

type RowStyle = { transform: string; opacity: number };

const FRONT: RowStyle = { transform: 'translateY(0px) scale(1)', opacity: 1 };

/** The row in front sits in the middle, one row shows faintly on each side, and the rest wait out of sight. */
function rowStyleOf(offset: number): RowStyle {
  const distance = Math.abs(offset);
  const side = Math.sign(offset);
  if (distance === 0) {
    return FRONT;
  }
  if (distance === 1) {
    const shift = `calc(${side} * var(--peek))`;
    return { transform: `translateY(${shift}) scale(0.86)`, opacity: 0.4 };
  }
  const shift = side * AWAY_PX;
  return { transform: `translateY(${shift}px) scale(0.8)`, opacity: 0 };
}

/**
 * How far the rows are kept on each side of the front one. A row that will show after a turn is
 * already there, waiting out of sight, so it travels in instead of appearing.
 */
function reachOf(count: number) {
  if (count < 2) {
    return 0;
  }
  const farthestTurn = Math.floor(count / 2);
  return farthestTurn + 1;
}

function offsetsOf(reach: number) {
  const bothSides = reach * 2;
  const length = bothSides + 1;
  return Array.from({ length }, (_, index) => index - reach);
}

/** The shortest way round the loop from one figure to another: forward when both ways are equal. */
function shortestTurnOf(from: number, to: number, count: number) {
  const gap = to - from;
  const ahead = wrapIndex(gap, count);
  const behind = count - ahead;
  if (ahead <= behind) {
    return ahead;
  }
  return -behind;
}

function FigureRow({ figure, offset }: { figure: WeekFigure; offset: number }) {
  return (
    <div style={rowStyleOf(offset)} className={ROW}>
      <span className='keycap-3d text-muted-foreground hidden size-8 shrink-0 items-center justify-center rounded-lg @2xs:flex [&_svg]:size-4'>
        {figure.icon}
      </span>
      <p className='flex min-w-0 flex-1 items-baseline gap-1.5'>
        <span className='text-2xl leading-7 font-semibold tabular-nums'>
          {figure.value}
        </span>
        {figure.unit && (
          <span className='text-muted-foreground truncate text-[13px]'>
            {figure.unit}
          </span>
        )}
      </p>
      <p className='flex min-w-0 basis-full items-baseline gap-1.5 @2xs:block @2xs:basis-auto @2xs:text-end'>
        <span className='block truncate text-[13px] font-medium'>
          {figure.name}
        </span>
        <span className='text-muted-foreground block truncate text-xs'>
          {figure.detail}
        </span>
      </p>
    </div>
  );
}

function amountOf(figure: WeekFigure) {
  if (figure.unit) {
    return `${figure.value} ${figure.unit}`;
  }
  return figure.value;
}

function spokenFigureOf(figure: WeekFigure) {
  const amount = amountOf(figure);
  return `${figure.name}: ${amount}, ${figure.detail}`;
}

export type WeekFiguresProps = {
  title: string;
  /** The days the figures cover: "Nov 9 to 15". */
  period: string;
  figures: WeekFigure[];
  /** Says the figures are made up. Leave it out for real figures. */
  note?: string;
  /** Rolls the wheel from outside, for a demonstration or a timer of the page. */
  handleRef?: React.Ref<WeekFiguresHandle>;
  /** Keeps the live region quiet while a demonstration rolls the wheel by itself. */
  isSilent?: boolean;
  className?: string;
};

export function WeekFigures({
  title,
  period,
  figures,
  note,
  handleRef,
  isSilent = false,
  className,
}: WeekFiguresProps) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const count = figures.length;
  const activeIndex = wrapIndex(step, count);
  const active = figures[activeIndex];
  const reach = reachOf(count);
  const offsets = offsetsOf(reach);
  const segments: Segment<string>[] = figures.map((figure) => ({
    value: figure.id,
    label: figure.name,
  }));

  function showNext() {
    setStep((current) => current + 1);
  }

  function pick(figureId: string) {
    const target = figures.findIndex((figure) => figure.id === figureId);
    if (target === -1) {
      return;
    }
    const turn = shortestTurnOf(activeIndex, target, count);
    const nextStep = step + turn;
    setStep(nextStep);
  }

  useImperativeHandle(handleRef, () => ({ next: showNext }));

  if (!active) {
    return null;
  }

  const announcement = spokenFigureOf(active);

  return (
    <Card
      role='group'
      aria-labelledby={titleId}
      className={cn('@container relative w-full gap-4 p-5', className)}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 id={titleId} className='text-sm font-medium'>
            {title}
          </h3>
          <p className='text-muted-foreground truncate text-xs'>{period}</p>
        </div>
        {note && <SampleNote>{note}</SampleNote>}
      </div>
      <div
        aria-hidden='true'
        className={cn('relative h-36 overflow-hidden', FADED_ENDS, WHEEL_PEEK)}
      >
        <div className='bg-foreground/[0.04] absolute inset-x-0 top-1/2 -mt-7 h-14 rounded-lg' />
        {offsets.map((offset) => {
          const position = step + offset;
          const index = wrapIndex(position, count);
          const figure = figures[index];
          return <FigureRow key={position} figure={figure} offset={offset} />;
        })}
      </div>
      <dl className='sr-only'>
        {figures.map((figure) => (
          <div key={figure.id}>
            <dt>{figure.name}</dt>
            <dd>
              {amountOf(figure)}, {figure.detail}
            </dd>
          </div>
        ))}
      </dl>
      <Segments
        value={active.id}
        segments={segments}
        onValueChange={pick}
        label='Figure in front'
        className='w-full'
        itemClassName='@max-3xs:px-1'
      />
      <LiveRegion message={spokenUnless(isSilent, announcement)} />
    </Card>
  );
}

const FIGURES: WeekFigure[] = [
  {
    id: 'focus',
    name: 'Focus',
    value: '18h 40m',
    detail: 'of 24h planned',
    icon: <ClockIcon />,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    value: '23',
    unit: 'done',
    detail: '4 more than last week',
    icon: <CheckCheckIcon />,
  },
  {
    id: 'streak',
    name: 'Streak',
    value: '9',
    unit: 'days',
    detail: 'longest this quarter',
    icon: <ZapIcon />,
  },
  {
    id: 'projects',
    name: 'Projects',
    value: '4',
    unit: 'active',
    detail: 'with time logged',
    icon: <FolderIcon />,
  },
];

export default function Card07() {
  const wheel = useRef<WeekFiguresHandle>(null);

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => wheel.current?.next() },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 0,
  });

  return (
    <div ref={ref} className='min-h-[17.5rem] w-full max-w-[21rem]'>
      <WeekFigures
        title='This week'
        period='Nov 9 to 15'
        figures={FIGURES}
        note='Illustrative'
        handleRef={wheel}
        isSilent={isAutoplaying}
      />
    </div>
  );
}
