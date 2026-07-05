'use client';

import { motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { Service } from './data';

const VIEW_WIDTH = 1000;

const PLOT_HEIGHT = 168;

const MOVE: Transition = { duration: 0.45, ease: [0.77, 0, 0.175, 1] };

const INSTANT: Transition = { duration: 0 };

const P50_SERIES: SeriesSlot = 1;

const P95_SERIES: SeriesSlot = 2;

const TICK_SHARES = [1, 0.5, 0];

function moveOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MOVE;
}

function yOf(valueMs: number, topMs: number) {
  const share = valueMs / topMs;
  const bounded = Math.min(1, Math.max(0, share));
  return PLOT_HEIGHT - bounded * PLOT_HEIGHT;
}

function commandOf(
  valueMs: number,
  hour: number,
  count: number,
  topMs: number
) {
  const lastHour = count - 1;
  const x = (hour / lastHour) * VIEW_WIDTH;
  const y = yOf(valueMs, topMs);
  const point = `${x.toFixed(1)} ${y.toFixed(1)}`;
  if (hour === 0) {
    return `M${point}`;
  }
  return `L${point}`;
}

function pathOf(values: number[], topMs: number) {
  const commands = values.map((valueMs, hour) =>
    commandOf(valueMs, hour, values.length, topMs)
  );
  return commands.join(' ');
}

/** 80 ms, 900 ms, 2.4 s. */
function formatMs(valueMs: number) {
  if (valueMs < 1000) {
    return `${valueMs} ms`;
  }
  const seconds = valueMs / 1000;
  return `${seconds.toFixed(1)} s`;
}

function hourLabelOf(hour: number, count: number) {
  const hoursAgo = count - 1 - hour;
  if (hoursAgo === 0) {
    return 'Now';
  }
  return `${hoursAgo} h ago`;
}

function p95ToneOf(isOverTarget: boolean) {
  if (isOverTarget) {
    return 'text-warning-foreground';
  }
  return 'text-foreground';
}

type FigureProps = {
  label: string;
  series?: SeriesSlot;
  valueMs: number;
  className?: string;
};

function Figure({ label, series, valueMs, className }: FigureProps) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <dt className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        {series !== undefined && (
          <span
            aria-hidden='true'
            style={{ backgroundColor: seriesColorOf(series) }}
            className='size-2 shrink-0 rounded-full'
          />
        )}
        {label}
      </dt>
      <dd
        className={cn(
          'text-lg leading-7 font-semibold transition-colors duration-300 @md:text-xl',
          className
        )}
      >
        <MotionNumber value={valueMs} suffix=' ms' />
      </dd>
    </div>
  );
}

type LatencyChartProps = {
  service: Service;
};

export function LatencyChart({ service }: LatencyChartProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const move = moveOf(shouldReduceMotion);
  const hourCount = service.p50.length;
  const lastHour = hourCount - 1;
  const p50Now = service.p50[lastHour];
  const p95Now = service.p95[lastHour];
  const p50Path = pathOf(service.p50, service.topMs);
  const p95Path = pathOf(service.p95, service.topMs);
  const targetY = yOf(service.targetMs, service.topMs);
  const targetStyle = { transform: `translateY(${targetY}px)` };
  const plotStyle = { height: PLOT_HEIGHT };
  const isOverTarget = p95Now > service.targetMs;
  const title = `${service.name}: response time over 24 hours`;

  return (
    <section
      aria-label='Response time'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h2 className='text-sm font-medium'>
            <Swap swapKey={service.id}>{service.name}</Swap>
          </h2>
          <p className='text-muted-foreground text-xs'>
            <Swap swapKey={service.id}>{service.measure}, last 24 hours</Swap>
          </p>
        </div>
        <Badge variant='secondary'>Illustrative</Badge>
      </header>

      <dl className='grid grid-cols-3 gap-3'>
        <Figure label='p50 now' series={P50_SERIES} valueMs={p50Now} />
        <Figure
          label='p95 now'
          series={P95_SERIES}
          valueMs={p95Now}
          className={p95ToneOf(isOverTarget)}
        />
        <Figure label='Target' valueMs={service.targetMs} />
      </dl>

      <div className='grid grid-cols-[2.75rem_minmax(0,1fr)]'>
        <div aria-hidden='true' className='relative' style={plotStyle}>
          {TICK_SHARES.map((share) => {
            const tickMs = service.topMs * share;
            const top = yOf(tickMs, service.topMs);
            const label = formatMs(tickMs);
            return (
              <span
                key={share}
                className='text-muted-foreground absolute right-2.5 -translate-y-1/2 text-[11px] tabular-nums'
                style={{ top }}
              >
                <Swap swapKey={label}>{label}</Swap>
              </span>
            );
          })}
        </div>
        <div aria-hidden='true' className='relative' style={plotStyle}>
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${PLOT_HEIGHT}`}
            preserveAspectRatio='none'
            className='absolute inset-0 size-full overflow-visible'
          >
            {TICK_SHARES.map((share) => {
              const y = PLOT_HEIGHT - share * PLOT_HEIGHT;
              return (
                <line
                  key={share}
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
              animate={{ d: p95Path }}
              transition={move}
              fill='none'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
              style={{ stroke: seriesColorOf(P95_SERIES) }}
            />
            <motion.path
              initial={false}
              animate={{ d: p50Path }}
              transition={move}
              fill='none'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
              style={{ stroke: seriesColorOf(P50_SERIES) }}
            />
          </svg>
          <div
            style={targetStyle}
            className='pointer-events-none absolute inset-x-0 top-0 transition-transform duration-[450ms] ease-(--ease-in-out-strong)'
          >
            <span className='bg-foreground/35 absolute inset-x-0 top-0 h-(--hairline)' />
            <span className='text-muted-foreground absolute end-0 -top-4 text-[11px] leading-4'>
              Target
            </span>
          </div>
        </div>
        <span aria-hidden='true' />
        <div
          aria-hidden='true'
          className='text-muted-foreground mt-2 flex justify-between text-[11px]'
        >
          <span>24 h ago</span>
          <span>12 h ago</span>
          <span>Now</span>
        </div>
      </div>

      <table className='sr-only'>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope='col'>Hour</th>
            <th scope='col'>p50</th>
            <th scope='col'>p95</th>
          </tr>
        </thead>
        <tbody>
          {service.p50.map((p50Ms, hour) => (
            <tr key={hour}>
              <th scope='row'>{hourLabelOf(hour, hourCount)}</th>
              <td>{formatMs(p50Ms)}</td>
              <td>{formatMs(service.p95[hour])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
