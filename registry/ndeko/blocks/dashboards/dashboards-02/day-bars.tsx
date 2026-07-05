'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  ChartBubble,
  bubbleAlignOf,
  columnCenterOf,
  niceScale,
  percentOf,
  useActiveIndex,
} from './chart-kit';
import { formatDuration, type DayBar } from './figures';

const PLOT_HEIGHT = 180;

const MAX_LINES = 4;

const EMPTY_SCALE_HOURS = 8;

const STUB_PX = 3;

const BUBBLE_GAP_PX = 8;

const MOVE_TRANSITION: Transition = {
  duration: 0.3,
  ease: [0.77, 0, 0.175, 1],
};

const INSTANT: Transition = { duration: 0 };

function moveTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MOVE_TRANSITION;
}

function scaleHoursOf(bars: DayBar[]) {
  const minutes = bars.map((bar) => bar.minutes);
  const maxMinutes = Math.max(...minutes);
  if (maxMinutes === 0) {
    return EMPTY_SCALE_HOURS;
  }
  return maxMinutes / 60;
}

function filledRatioOf(bar: DayBar, topMinutes: number) {
  if (bar.minutes === 0) {
    return STUB_PX / PLOT_HEIGHT;
  }
  return bar.minutes / topMinutes;
}

function hiddenShareOf(ratio: number) {
  const hidden = 1 - ratio;
  return percentOf(hidden);
}

function tickTopOf(tickHours: number, topHours: number) {
  const ratio = tickHours / topHours;
  const fromBottom = ratio * PLOT_HEIGHT;
  return PLOT_HEIGHT - fromBottom;
}

function bubbleTopOf(bar: DayBar, topMinutes: number) {
  if (bar.isAhead) {
    const middle = PLOT_HEIGHT / 2;
    return middle - BUBBLE_GAP_PX;
  }
  const ratio = filledRatioOf(bar, topMinutes);
  const barHeight = ratio * PLOT_HEIGHT;
  const barTop = PLOT_HEIGHT - barHeight;
  return barTop - BUBBLE_GAP_PX;
}

function bubbleValueOf(bar: DayBar) {
  if (bar.isAhead) {
    return 'Day ahead';
  }
  return formatDuration(bar.minutes);
}

function bubbleLabelOf(bar: DayBar) {
  if (bar.isToday) {
    return `${bar.label}, so far`;
  }
  return bar.label;
}

function tableValueOf(bar: DayBar) {
  if (bar.isAhead) {
    return 'Day ahead';
  }
  return formatDuration(bar.minutes);
}

type DayBarsProps = {
  title: string;
  bars: DayBar[];
  /** Shown over the empty plot, which keeps its hour lines and day slots. */
  emptyState?: React.ReactNode;
};

/** Hours per day as rounded bars. Bars move to their new height when the data changes, never on mount. */
export function DayBars({ title, bars, emptyState }: DayBarsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = moveTransitionOf(shouldReduceMotion);
  const count = bars.length;
  const scaleHours = scaleHoursOf(bars);
  const scale = niceScale(scaleHours, MAX_LINES);
  const topMinutes = scale.top * 60;
  const defaultIndex = defaultIndexOf(bars);
  const reading = useActiveIndex(count, defaultIndex);
  const shownBar = bars[reading.shownIndex];
  const shownCenter = columnCenterOf(reading.shownIndex, count);
  const shownLeft = percentOf(shownCenter);
  const bubbleTop = bubbleTopOf(shownBar, topMinutes);
  const bubbleAlign = bubbleAlignOf(reading.shownIndex, count);
  const bubbleLabel = bubbleLabelOf(shownBar);
  const bubbleValue = bubbleValueOf(shownBar);
  const readingText = `${bubbleLabel}: ${bubbleValue}`;
  const plotHeight = { height: PLOT_HEIGHT };

  return (
    <div className='flex flex-col'>
      <div className='grid grid-cols-[2.5rem_minmax(0,1fr)]'>
        <div aria-hidden='true' className='relative' style={plotHeight}>
          {scale.ticks.map((tick) => {
            const top = tickTopOf(tick, scale.top);

            return (
              <span
                key={tick}
                className='text-muted-foreground absolute right-2.5 -translate-y-1/2 text-[11px] tabular-nums'
                style={{ top }}
              >
                {`${tick}h`}
              </span>
            );
          })}
        </div>
        <div
          role='group'
          tabIndex={0}
          aria-label={`${title}. Use the arrow keys to read each day.`}
          className='focus-visible:ring-ring/25 relative touch-pan-y rounded-md outline-none focus-visible:ring-[3px]'
          style={plotHeight}
          {...reading.handlers}
        >
          {scale.ticks.map((tick) => {
            const top = tickTopOf(tick, scale.top);

            return (
              <span
                key={tick}
                aria-hidden='true'
                className='hairline-t border-border absolute inset-x-0'
                style={{ top }}
              />
            );
          })}
          <div aria-hidden='true' className='absolute inset-0 flex'>
            {bars.map((bar, index) => {
              const isShown = index === reading.shownIndex;
              const isDimmed = reading.isActive && !isShown;
              const isEmptyDay = bar.minutes === 0;
              const ratio = filledRatioOf(bar, topMinutes);
              const offset = hiddenShareOf(ratio);

              return (
                <div key={bar.label} className='flex flex-1 justify-center'>
                  {bar.isAhead && (
                    <span className='hairline-border border-foreground/15 h-full w-[56%] max-w-10 rounded-md border-dashed' />
                  )}
                  {!bar.isAhead && (
                    <span className='relative h-full w-[56%] max-w-10 overflow-hidden'>
                      <motion.span
                        initial={false}
                        animate={{ y: offset }}
                        transition={transition}
                        className={cn(
                          'absolute inset-0 rounded-t-[5px] transition-opacity duration-150',
                          isEmptyDay && 'bg-foreground/15',
                          !isEmptyDay && 'bg-primary',
                          isDimmed && 'opacity-55'
                        )}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {emptyState && (
            <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center *:pointer-events-auto'>
              {emptyState}
            </div>
          )}
          <ChartBubble
            left={shownLeft}
            top={bubbleTop}
            align={bubbleAlign}
            isVisible={reading.isActive}
          >
            <span className='text-muted-foreground'>{bubbleLabel}</span>
            <span className='text-[13px] font-medium tabular-nums'>
              {bubbleValue}
            </span>
          </ChartBubble>
        </div>
        <span aria-hidden='true' />
        <div aria-hidden='true' className='mt-2 flex'>
          {bars.map((bar) => (
            <span
              key={bar.label}
              className={cn(
                'text-muted-foreground flex-1 text-center text-[11px] whitespace-nowrap tabular-nums',
                bar.isToday && 'text-foreground font-medium'
              )}
            >
              {bar.axisLabel}
            </span>
          ))}
        </div>
      </div>
      <span aria-live='polite' className='sr-only'>
        {reading.isReadingByKeys && readingText}
      </span>
      <table className='sr-only'>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope='col'>Day</th>
            <th scope='col'>Tracked time</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.label}>
              <th scope='row'>{bubbleLabelOf(bar)}</th>
              <td>{tableValueOf(bar)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The bubble opens on today, or on the last day with time when the week is over. */
function defaultIndexOf(bars: DayBar[]) {
  const todayIndex = bars.findIndex((bar) => bar.isToday);
  if (todayIndex >= 0) {
    return todayIndex;
  }
  let lastWorkedIndex = 0;
  bars.forEach((bar, index) => {
    if (bar.minutes > 0) {
      lastWorkedIndex = index;
    }
  });
  return lastWorkedIndex;
}
