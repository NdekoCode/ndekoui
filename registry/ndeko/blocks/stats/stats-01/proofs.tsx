'use client';

import { motion, type Transition } from 'motion/react';
import type { CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

const GLIDE: Transition = { duration: 0.5, ease: EASE_OUT_STRONG };

const PLOT = {
  width: 320,
  height: 72,
  top: 6,
  bottom: 2,
};

const VIEW_BOX = `0 0 ${PLOT.width} ${PLOT.height}`;

const BASELINE_Y = PLOT.height - 0.5;

function easedOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 'transition-none';
  }
  return 'transition-transform duration-500 ease-(--ease-out-strong)';
}

function glideOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return GLIDE;
}

function plotHeightOf() {
  const margins = PLOT.top + PLOT.bottom;
  return PLOT.height - margins;
}

type Point = { x: number; y: number };

function pointsOf(values: readonly number[], max: number): Point[] {
  const lastPosition = values.length - 1;
  const lastIndex = Math.max(1, lastPosition);
  const plotHeight = plotHeightOf();
  return values.map((value, index) => {
    const share = index / lastIndex;
    const x = share * PLOT.width;
    const level = value / max;
    const drop = 1 - level;
    const offset = drop * plotHeight;
    const y = PLOT.top + offset;
    return { x, y };
  });
}

function commandOf(index: number) {
  if (index === 0) {
    return 'M';
  }
  return 'L';
}

function segmentOf(point: Point, index: number) {
  const x = point.x.toFixed(2);
  const y = point.y.toFixed(2);
  const command = commandOf(index);
  return `${command} ${x} ${y}`;
}

/** Every period has as many points, so the two outlines share one structure and the path can glide. */
function linePathOf(points: Point[]) {
  const segments = points.map((point, index) => segmentOf(point, index));
  return segments.join(' ');
}

function areaPathOf(line: string) {
  return `${line} L ${PLOT.width} ${PLOT.height} L 0 ${PLOT.height} Z`;
}

function rowNameOf(pointName: string, index: number) {
  const position = index + 1;
  return `${pointName} ${position}`;
}

type TrendLineProps = {
  values: readonly number[];
  max: number;
  caption: string;
  pointName: string;
  formatValue: (value: number) => string;
};

export function TrendLine({
  values,
  max,
  caption,
  pointName,
  formatValue,
}: TrendLineProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = glideOf(shouldReduceMotion);
  const points = pointsOf(values, max);
  const line = linePathOf(points);
  const area = areaPathOf(line);

  return (
    <div className='relative'>
      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio='none'
        aria-hidden='true'
        className='h-16 w-full overflow-visible'
      >
        <line
          x1={0}
          x2={PLOT.width}
          y1={BASELINE_Y}
          y2={BASELINE_Y}
          strokeWidth={1}
          vectorEffect='non-scaling-stroke'
          className='stroke-border'
        />
        <motion.path
          initial={false}
          animate={{ d: area }}
          transition={transition}
          className='fill-primary/10'
        />
        <motion.path
          initial={false}
          animate={{ d: line }}
          transition={transition}
          fill='none'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          vectorEffect='non-scaling-stroke'
          className='stroke-primary'
        />
      </svg>
      <div className='sr-only'>
        <table>
          <caption>{caption}</caption>
          <tbody>
            {values.map((value, index) => (
              <tr key={index}>
                <th scope='row'>{rowNameOf(pointName, index)}</th>
                <td>{formatValue(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function barStyleOf(percent: number): CSSProperties {
  const share = percent / 100;
  return { transform: `scaleY(${share})` };
}

type WeekdayBarsProps = {
  values: readonly number[];
  days: readonly string[];
  caption: string;
};

export function WeekdayBars({ values, days, caption }: WeekdayBarsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const eased = easedOf(shouldReduceMotion);

  return (
    <div className='relative flex flex-col gap-1.5'>
      <div aria-hidden='true' className='flex h-16 items-end gap-1.5'>
        {values.map((value, index) => (
          <span
            key={days[index]}
            style={barStyleOf(value)}
            className={cn(
              'bg-primary h-full flex-1 origin-bottom rounded-[3px]',
              eased
            )}
          />
        ))}
      </div>
      <div aria-hidden='true' className='flex gap-1.5'>
        {days.map((day) => (
          <span
            key={day}
            className='text-muted-foreground flex-1 text-center text-[10px]'
          >
            {day.charAt(0)}
          </span>
        ))}
      </div>
      <div className='sr-only'>
        <table>
          <caption>{caption}</caption>
          <tbody>
            {values.map((value, index) => (
              <tr key={days[index]}>
                <th scope='row'>{days[index]}</th>
                <td>{value}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fillStyleOf(percent: number): CSSProperties {
  const share = percent / 100;
  return { transform: `scaleX(${share})` };
}

type DistributionProps = {
  values: readonly number[];
  buckets: readonly string[];
  caption: string;
};

export function Distribution({ values, buckets, caption }: DistributionProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const eased = easedOf(shouldReduceMotion);

  return (
    <div className='relative'>
      <ul aria-hidden='true' className='flex flex-col gap-2'>
        {values.map((value, index) => (
          <li
            key={buckets[index]}
            className='grid grid-cols-[6.5rem_minmax(0,1fr)_2.25rem] items-center gap-2 text-xs'
          >
            <span className='text-muted-foreground truncate'>
              {buckets[index]}
            </span>
            <span className='bg-foreground/[0.06] relative h-1.5 overflow-hidden rounded-full'>
              <span
                style={fillStyleOf(value)}
                className={cn(
                  'bg-primary absolute inset-0 origin-left rounded-full',
                  eased
                )}
              />
            </span>
            <span className='text-end tabular-nums'>{value}%</span>
          </li>
        ))}
      </ul>
      <div className='sr-only'>
        <table>
          <caption>{caption}</caption>
          <tbody>
            {values.map((value, index) => (
              <tr key={buckets[index]}>
                <th scope='row'>{buckets[index]}</th>
                <td>{value}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
