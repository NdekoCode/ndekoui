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

const PLOT_HEIGHT = 200;

const VIEW_WIDTH = 1000;

const MAX_LINES = 4;

const PHONE_LABEL_STEP = 3;

const BUBBLE_GAP_PX = 10;

const MOVE_TRANSITION: Transition = {
  duration: 0.3,
  ease: [0.77, 0, 0.175, 1],
};

const INSTANT: Transition = { duration: 0 };

export type TrendPoint = {
  axisLabel: string;
  label: string;
  value: number;
};

type Coordinate = { x: number; y: number };

function moveTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MOVE_TRANSITION;
}

function yOf(value: number, top: number) {
  const ratio = value / top;
  const height = ratio * PLOT_HEIGHT;
  return PLOT_HEIGHT - height;
}

function coordinatesOf(points: TrendPoint[], top: number): Coordinate[] {
  return points.map((point, index) => {
    const share = columnCenterOf(index, points.length);
    const x = share * VIEW_WIDTH;
    const y = yOf(point.value, top);
    return { x, y };
  });
}

function commandOf(coordinate: Coordinate, index: number) {
  const x = coordinate.x.toFixed(1);
  const y = coordinate.y.toFixed(1);
  if (index === 0) {
    return `M${x} ${y}`;
  }
  return `L${x} ${y}`;
}

function linePathOf(coordinates: Coordinate[]) {
  const commands = coordinates.map((coordinate, index) =>
    commandOf(coordinate, index)
  );
  return commands.join(' ');
}

function areaPathOf(coordinates: Coordinate[]) {
  const line = linePathOf(coordinates);
  const lastIndex = coordinates.length - 1;
  const first = coordinates[0];
  const last = coordinates[lastIndex];
  const firstX = first.x.toFixed(1);
  const lastX = last.x.toFixed(1);
  return `${line} L${lastX} ${PLOT_HEIGHT} L${firstX} ${PLOT_HEIGHT} Z`;
}

function leftOf(index: number, count: number) {
  const share = columnCenterOf(index, count);
  return percentOf(share);
}

function isPhoneLabel(index: number, count: number) {
  const isLast = index === count - 1;
  const isOnStep = index % PHONE_LABEL_STEP === 0;
  return isLast || isOnStep;
}

type TrendChartProps = {
  title: string;
  valueHeading: string;
  points: TrendPoint[];
  formatValue: (value: number) => string;
};

/** One series as a line over twelve columns. The line moves to its new shape when the data changes. */
export function TrendChart({
  title,
  valueHeading,
  points,
  formatValue,
}: TrendChartProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = moveTransitionOf(shouldReduceMotion);
  const count = points.length;
  const lastIndex = count - 1;
  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values);
  const scale = niceScale(maxValue, MAX_LINES);
  const coordinates = coordinatesOf(points, scale.top);
  const linePath = linePathOf(coordinates);
  const areaPath = areaPathOf(coordinates);
  const lastLeft = leftOf(lastIndex, count);
  const lastY = coordinates[lastIndex].y;
  const reading = useActiveIndex(count, lastIndex);
  const shownPoint = points[reading.shownIndex];
  const shownY = coordinates[reading.shownIndex].y;
  const shownLeft = leftOf(reading.shownIndex, count);
  const shownValue = formatValue(shownPoint.value);
  const readingText = `${shownPoint.label}: ${shownValue}`;
  const bubbleTop = shownY - BUBBLE_GAP_PX;
  const bubbleAlign = bubbleAlignOf(reading.shownIndex, count);
  const plotHeight = { height: PLOT_HEIGHT };

  return (
    <div className='flex flex-col'>
      <div className='grid grid-cols-[2.75rem_minmax(0,1fr)]'>
        <div aria-hidden='true' className='relative' style={plotHeight}>
          {scale.ticks.map((tick) => {
            const top = yOf(tick, scale.top);

            return (
              <span
                key={tick}
                className='text-muted-foreground absolute right-2.5 -translate-y-1/2 text-[11px] tabular-nums'
                style={{ top }}
              >
                {formatValue(tick)}
              </span>
            );
          })}
        </div>
        <div
          role='group'
          tabIndex={0}
          aria-label={`${title}. Use the arrow keys to read each value.`}
          className='focus-visible:ring-ring/25 relative touch-pan-y rounded-md outline-none focus-visible:ring-[3px]'
          style={plotHeight}
          {...reading.handlers}
        >
          <svg
            aria-hidden='true'
            viewBox={`0 0 ${VIEW_WIDTH} ${PLOT_HEIGHT}`}
            preserveAspectRatio='none'
            className='absolute inset-0 size-full overflow-visible'
          >
            {scale.ticks.map((tick) => {
              const y = yOf(tick, scale.top);

              return (
                <line
                  key={tick}
                  x1={0}
                  x2={VIEW_WIDTH}
                  y1={y}
                  y2={y}
                  strokeWidth={1}
                  vectorEffect='non-scaling-stroke'
                  className='stroke-border'
                />
              );
            })}
            <motion.path
              initial={false}
              animate={{ d: areaPath }}
              transition={transition}
              className='fill-primary/[0.08]'
            />
            <motion.path
              initial={false}
              animate={{ d: linePath }}
              transition={transition}
              fill='none'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
              className='stroke-primary'
            />
          </svg>
          {reading.isActive && (
            <span
              aria-hidden='true'
              className='bg-foreground/15 pointer-events-none absolute inset-y-0 w-px'
              style={{ left: shownLeft }}
            />
          )}
          <motion.span
            aria-hidden='true'
            initial={false}
            animate={{ y: lastY }}
            transition={transition}
            className='bg-primary ring-card pointer-events-none absolute top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
            style={{ left: lastLeft }}
          />
          {reading.isActive && (
            <span
              aria-hidden='true'
              className='bg-card ring-primary pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
              style={{ left: shownLeft, top: shownY }}
            />
          )}
          <ChartBubble
            left={shownLeft}
            top={bubbleTop}
            align={bubbleAlign}
            isVisible={reading.isActive}
          >
            <span className='text-muted-foreground'>{shownPoint.label}</span>
            <span className='text-[13px] font-medium tabular-nums'>
              {shownValue}
            </span>
          </ChartBubble>
        </div>
        <span aria-hidden='true' />
        <div aria-hidden='true' className='relative mt-2 h-4'>
          {points.map((point, index) => {
            const left = leftOf(index, count);
            const isShownOnPhone = isPhoneLabel(index, count);
            const isLast = index === lastIndex;

            return (
              <span
                key={point.label}
                className={cn(
                  'text-muted-foreground absolute top-0 -translate-x-1/2 text-[11px] whitespace-nowrap tabular-nums',
                  !isShownOnPhone && 'hidden sm:block',
                  isLast && 'text-foreground font-medium'
                )}
                style={{ left }}
              >
                {point.axisLabel}
              </span>
            );
          })}
        </div>
      </div>
      <span aria-live='polite' className='sr-only'>
        {reading.isReadingByKeys && readingText}
      </span>
      <div className='sr-only'>
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope='col'>Period</th>
              <th scope='col'>{valueHeading}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label}>
                <th scope='row'>{point.label}</th>
                <td>{formatValue(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
