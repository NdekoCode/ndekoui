'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { ChartCard } from './chart-card';
import {
  areaPathOf,
  GRID_STEPS,
  linePathOf,
  niceScaleOf,
  pointsOf,
  shareOf,
  VIEW_WIDTH,
} from './chart-math';
import { COMPACT_FORMAT, COUNT_FORMAT, formatCount } from './format';
import { MorphPath } from './morph-path';
import { TRAFFIC_POINTS, type PeriodData } from './period-data';
import { useReading } from './use-reading';

const PLOT_HEIGHT = 176;

const MIDDLE_POINT = Math.floor(TRAFFIC_POINTS / 2);

const LINE_STROKE =
  'fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]';

function gridTopOf(step: number) {
  const share = step / GRID_STEPS;
  return PLOT_HEIGHT - share * PLOT_HEIGHT;
}

function readoutClassOf(isReading: boolean) {
  if (isReading) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

const GRID_STEP_LIST = Array.from(
  { length: GRID_STEPS + 1 },
  (_, step) => step
);

function readingCaptionOf(
  isReading: boolean,
  data: PeriodData,
  label: string,
  current: number,
  previous: number
) {
  if (!isReading) {
    return data.visitsChange;
  }
  return `${label}: ${formatCount(current)} a day, ${formatCount(previous)} before`;
}

type TrafficLineProps = {
  data: PeriodData;
};

export function TrafficLine({ data }: TrafficLineProps) {
  const reading = useReading(TRAFFIC_POINTS, 'point');
  const largest = Math.max(...data.traffic, ...data.previousTraffic);
  const scale = niceScaleOf(largest);
  const currentPoints = pointsOf(data.traffic, scale.max, PLOT_HEIGHT);
  const previousPoints = pointsOf(data.previousTraffic, scale.max, PLOT_HEIGHT);
  const index = reading.shownIndex;
  const current = Math.round(data.traffic[index]);
  const previous = Math.round(data.previousTraffic[index]);
  const label = data.bucketLabels[index];
  const caption = readingCaptionOf(
    reading.isReading,
    data,
    label,
    current,
    previous
  );
  const guideShare = index / (TRAFFIC_POINTS - 1);
  const currentTop = PLOT_HEIGHT - shareOf(current, scale.max) * PLOT_HEIGHT;
  const previousTop = PLOT_HEIGHT - shareOf(previous, scale.max) * PLOT_HEIGHT;
  const spoken = `${label}, ${formatCount(current)} visits a day, ${formatCount(previous)} in the period before`;
  const referenceLabel = `The ${data.months} months before`;

  return (
    <ChartCard
      title='Traffic'
      section='traffic'
      description={
        <p className='text-muted-foreground text-xs'>Average visits per day</p>
      }
    >
      <div className='flex flex-col gap-1'>
        <p className='flex items-baseline gap-1.5'>
          <MotionNumber
            value={data.totalVisits}
            format={COUNT_FORMAT}
            className='text-2xl leading-8 font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>visits</span>
        </p>
        {!reading.isReading && (
          <Swap swapKey={caption} className='text-muted-foreground text-xs'>
            {caption}
          </Swap>
        )}
        {reading.isReading && (
          <p className='text-muted-foreground text-xs'>{caption}</p>
        )}
      </div>
      <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-2'>
        <div
          aria-hidden='true'
          className='relative w-9 shrink-0'
          style={{ height: PLOT_HEIGHT }}
        >
          {GRID_STEP_LIST.map((step) => (
            <span
              key={step}
              className='text-muted-foreground absolute right-0 -translate-y-1/2 text-[11px]'
              style={{ top: gridTopOf(step) }}
            >
              <MotionNumber value={scale.ticks[step]} format={COMPACT_FORMAT} />
            </span>
          ))}
        </div>
        <div
          role='slider'
          tabIndex={0}
          aria-label='Visits per day. The arrow keys read each point'
          aria-orientation='horizontal'
          aria-valuemin={0}
          aria-valuemax={TRAFFIC_POINTS - 1}
          aria-valuenow={index}
          aria-valuetext={spoken}
          className='focus-visible:ring-ring/25 @container relative touch-pan-y rounded-md outline-none focus-visible:ring-[3px]'
          style={{ height: PLOT_HEIGHT }}
          {...reading.handlers}
        >
          {GRID_STEP_LIST.map((step) => (
            <span
              key={step}
              aria-hidden='true'
              className='hairline-t border-border pointer-events-none absolute inset-x-0'
              style={{ top: gridTopOf(step) }}
            />
          ))}
          <svg
            aria-hidden='true'
            viewBox={`0 0 ${VIEW_WIDTH} ${PLOT_HEIGHT}`}
            preserveAspectRatio='none'
            className='pointer-events-none absolute inset-0 size-full overflow-visible'
          >
            <MorphPath
              d={areaPathOf(currentPoints, PLOT_HEIGHT)}
              className='fill-primary/10'
            />
            <MorphPath
              d={linePathOf(previousPoints)}
              className={cn(
                LINE_STROKE,
                'stroke-foreground/40 [stroke-dasharray:4_4]'
              )}
            />
            <MorphPath
              d={linePathOf(currentPoints)}
              className={cn(LINE_STROKE, 'stroke-primary')}
            />
          </svg>
          <div
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 w-0 transition-[opacity,transform] duration-150 ease-(--ease-out-strong)',
              readoutClassOf(reading.isReading)
            )}
            style={{ transform: `translateX(${guideShare * 100}cqw)` }}
          >
            <span className='bg-foreground/15 absolute inset-y-0 w-px -translate-x-1/2' />
            <span
              className='bg-foreground/40 ring-card absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
              style={{ top: previousTop }}
            />
            <span
              className='bg-primary ring-card absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
              style={{ top: currentTop }}
            />
          </div>
        </div>
        <div
          aria-hidden='true'
          className='text-muted-foreground col-start-2 mt-2 flex h-4 justify-between text-[11px] tabular-nums'
        >
          <Swap swapKey={data.bucketLabels[0]}>{data.bucketLabels[0]}</Swap>
          <Swap swapKey={data.bucketLabels[MIDDLE_POINT]}>
            {data.bucketLabels[MIDDLE_POINT]}
          </Swap>
          <Swap swapKey={data.bucketLabels[TRAFFIC_POINTS - 1]}>
            {data.bucketLabels[TRAFFIC_POINTS - 1]}
          </Swap>
        </div>
      </div>
      <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
        <li className='flex items-center gap-1.5'>
          <span
            aria-hidden='true'
            className='bg-primary h-0.5 w-4 rounded-full'
          />
          This period
        </li>
        <li className='flex items-center gap-1.5'>
          <span
            aria-hidden='true'
            className='border-foreground/40 w-4 border-t-2 border-dashed'
          />
          <Swap swapKey={referenceLabel}>{referenceLabel}</Swap>
        </li>
      </ul>
    </ChartCard>
  );
}
