'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { countOf } from '@/registry/ndeko/lib/words';

import { NEW_LEADS, TREND_WEEKS } from './data';
import { rovingTargetOf } from './roving';

const VIEW_WIDTH = 1000;

const PLOT_HEIGHT = 144;

const TOP_VALUE = 80;

const TICKS = [0, 40, 80];

const LAST_INDEX = NEW_LEADS.length - 1;

const LABEL_EVERY = 3;

function yOf(value: number) {
  const share = value / TOP_VALUE;
  return PLOT_HEIGHT - share * PLOT_HEIGHT;
}

function xShareOf(index: number) {
  return index / LAST_INDEX;
}

function commandLetterOf(index: number) {
  if (index === 0) {
    return 'M';
  }
  return 'L';
}

function linePathOf() {
  const commands = NEW_LEADS.map((value, index) => {
    const x = xShareOf(index) * VIEW_WIDTH;
    const y = yOf(value);
    const letter = commandLetterOf(index);
    return `${letter}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return commands.join(' ');
}

const LINE_PATH = linePathOf();

const AREA_PATH = `${LINE_PATH} L${VIEW_WIDTH} ${PLOT_HEIGHT} L0 ${PLOT_HEIGHT} Z`;

function isLabeled(index: number) {
  const fromLast = LAST_INDEX - index;
  return fromLast % LABEL_EVERY === 0;
}

const LABELED = TREND_WEEKS.map((week, index) => ({ week, index })).filter(
  ({ index }) => isLabeled(index)
);

function clampIndex(index: number) {
  const atLeastFirst = Math.max(index, 0);
  return Math.min(atLeastFirst, LAST_INDEX);
}

function weekLabelOf(index: number) {
  if (index === LAST_INDEX) {
    return 'This week';
  }
  return `Week of ${TREND_WEEKS[index]}`;
}

function changeOf(index: number) {
  if (index === 0) {
    return 'the first week shown';
  }
  const before = NEW_LEADS[index - 1];
  const difference = NEW_LEADS[index] - before;
  const ratio = difference / before;
  const percent = Math.round(ratio * 100);
  if (percent === 0) {
    return 'level with the week before';
  }
  if (percent > 0) {
    return `up ${percent}% on the week before`;
  }
  return `down ${Math.abs(percent)}% on the week before`;
}

export function LeadTrend() {
  const titleId = useId();
  const [reading, setReading] = useState<number | null>(null);
  const shownIndex = reading ?? LAST_INDEX;
  const value = NEW_LEADS[shownIndex];
  const label = weekLabelOf(shownIndex);
  const caption = `${label}, ${changeOf(shownIndex)}`;
  const guideShare = xShareOf(shownIndex);
  const spoken = `${TREND_WEEKS[shownIndex]}, ${countOf(value, 'new lead')}`;

  function readFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const index = Math.round(ratio * LAST_INDEX);
    setReading(clampIndex(index));
  }

  function readFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setReading(null);
      return;
    }
    const next = rovingTargetOf(event.key, shownIndex, NEW_LEADS.length);
    if (next === null) {
      return;
    }
    event.preventDefault();
    setReading(next);
  }

  function stopReading() {
    setReading(null);
  }

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-col gap-1'>
        <h2 id={titleId} className='text-sm font-medium'>
          New leads
        </h2>
        <p className='flex items-baseline gap-1.5'>
          <MotionNumber
            value={value}
            className='text-2xl leading-8 font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>new leads</span>
        </p>
        <p className='text-muted-foreground text-xs'>{caption}</p>
      </header>
      <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-2'>
        <div
          aria-hidden='true'
          className='relative w-6 shrink-0'
          style={{ height: PLOT_HEIGHT }}
        >
          {TICKS.map((tick) => (
            <span
              key={tick}
              className='text-muted-foreground absolute right-0 -translate-y-1/2 text-[11px] tabular-nums'
              style={{ top: yOf(tick) }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div
          role='slider'
          tabIndex={0}
          aria-label='New leads by week. The arrow keys read each week'
          aria-orientation='horizontal'
          aria-valuemin={0}
          aria-valuemax={LAST_INDEX}
          aria-valuenow={shownIndex}
          aria-valuetext={spoken}
          onPointerMove={readFromPointer}
          onPointerLeave={stopReading}
          onKeyDown={readFromKeys}
          onBlur={stopReading}
          className='focus-visible:ring-ring/25 @container relative touch-pan-y rounded-md outline-none focus-visible:ring-[3px]'
          style={{ height: PLOT_HEIGHT }}
        >
          {TICKS.map((tick) => (
            <span
              key={tick}
              aria-hidden='true'
              className='hairline-t border-border pointer-events-none absolute inset-x-0'
              style={{ top: yOf(tick) }}
            />
          ))}
          <svg
            aria-hidden='true'
            viewBox={`0 0 ${VIEW_WIDTH} ${PLOT_HEIGHT}`}
            preserveAspectRatio='none'
            className='pointer-events-none absolute inset-0 size-full overflow-visible'
          >
            <path d={AREA_PATH} className='fill-primary/10' />
            <path
              d={LINE_PATH}
              vectorEffect='non-scaling-stroke'
              className='stroke-primary fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]'
            />
          </svg>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-y-0 left-0 w-0 transition-transform duration-150 ease-(--ease-out-strong)'
            style={{ transform: `translateX(${guideShare * 100}cqw)` }}
          >
            <span className='bg-foreground/15 absolute inset-y-0 w-px -translate-x-1/2' />
            <span
              className='bg-primary ring-card absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-[top] duration-150 ease-(--ease-out-strong)'
              style={{ top: yOf(value) }}
            />
          </div>
        </div>
        <div className='col-start-2 row-start-2 mt-2 h-4'>
          <div aria-hidden='true' className='relative'>
            {LABELED.map(({ week, index }) => (
              <span
                key={week}
                className='text-muted-foreground absolute top-0 text-[11px] whitespace-nowrap tabular-nums'
                style={{
                  left: `${xShareOf(index) * 100}%`,
                  transform: `translateX(-${xShareOf(index) * 100}%)`,
                }}
              >
                {week}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
