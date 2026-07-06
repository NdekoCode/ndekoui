'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type RangeBand = {
  id: string;
  label: string;
  /** Where the band ends on the scale. A band starts where the one before it ends, the first one at the start of the scale. */
  upTo: number;
};

export type RangePeriod = {
  id: string;
  label: string;
  today: number;
  weeklyAverage: number;
  monthlyAverage: number;
};

type BandSpan = { band: RangeBand; from: number; width: number };

const BAND_GLOW =
  'bg-primary/60 absolute inset-0 transition-opacity duration-300 ease-(--ease-out-strong)';

function spansOf(bands: RangeBand[], scaleStart: number) {
  const spans: BandSpan[] = [];
  let from = scaleStart;
  for (const band of bands) {
    const reach = band.upTo - from;
    const width = Math.max(reach, 0);
    spans.push({ band, from, width });
    from = Math.max(band.upTo, from);
  }
  return spans;
}

function lastOf(spans: BandSpan[]) {
  const lastIndex = spans.length - 1;
  return spans[lastIndex];
}

function scaleEndOf(spans: BandSpan[], scaleStart: number) {
  const last = lastOf(spans);
  if (!last) {
    return scaleStart;
  }
  return last.from + last.width;
}

/** The band a value falls in: the first one that reaches it, or the last one for a value past the scale. */
function bandOf(value: number, spans: BandSpan[]) {
  const reaching = spans.find((span) => value <= span.band.upTo);
  return reaching ?? lastOf(spans);
}

/** How far along the scale a value sits, from 0 to 100, held inside the track. */
function shareOf(value: number, scaleStart: number, scaleEnd: number) {
  const length = scaleEnd - scaleStart;
  if (length <= 0) {
    return 0;
  }
  const along = value - scaleStart;
  const part = along / length;
  const percent = part * 100;
  const atLeastZero = Math.max(percent, 0);
  return Math.min(atLeastZero, 100);
}

function comparisonOf(today: number, average: number) {
  const exactDifference = today - average;
  const difference = Math.round(exactDifference);
  const gap = Math.abs(difference);
  if (difference === 0) {
    return 'Level with the weekly average';
  }
  if (difference < 0) {
    return `${gap} below the weekly average`;
  }
  return `${gap} above the weekly average`;
}

function opacityOf(isShown: boolean) {
  if (isShown) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function labelToneOf(isActive: boolean) {
  if (isActive) {
    return 'font-medium';
  }
  return 'text-muted-foreground';
}

type RangeTrackProps = {
  spans: BandSpan[];
  activeBandId: string | undefined;
  /** Where the marker sits, as a percentage of the track. */
  share: number;
};

function RangeTrack({ spans, activeBandId, share }: RangeTrackProps) {
  const markerStyle = { transform: `translateX(${share}cqw)` };

  return (
    <div className='flex flex-col gap-2'>
      <div aria-hidden='true' className='@container relative py-1'>
        <div className='flex h-2 gap-0.5'>
          {spans.map((span) => {
            const isActive = span.band.id === activeBandId;
            const bandStyle = { flexGrow: span.width };
            return (
              <span
                key={span.band.id}
                style={bandStyle}
                className='bg-foreground/10 relative basis-0 overflow-hidden rounded-full'
              >
                <span className={cn(BAND_GLOW, opacityOf(isActive))} />
              </span>
            );
          })}
        </div>
        <div
          style={markerStyle}
          className='absolute inset-y-0 start-0 w-0 transition-transform duration-500 ease-(--ease-in-out-strong)'
        >
          <span className='bg-card ring-primary absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.14)] ring-2' />
        </div>
      </div>
      <ul className='flex gap-0.5 text-xs'>
        {spans.map((span) => {
          const isActive = span.band.id === activeBandId;
          const bandStyle = { flexGrow: span.width };
          return (
            <li
              key={span.band.id}
              style={bandStyle}
              className='flex min-w-0 basis-0 flex-col items-center'
            >
              <span className={cn('truncate', labelToneOf(isActive))}>
                {span.band.label}
              </span>
              <span className='text-muted-foreground truncate tabular-nums'>
                {span.from} to {span.band.upTo}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Under 16rem the two tiles stack, each a row with its label beside the figure, so no label is cut. */
const AVERAGE_TILE = [
  'bg-foreground/[0.04] flex min-w-0 items-baseline justify-between gap-3 rounded-lg px-3 py-2.5',
  '@3xs:flex-col @3xs:items-stretch @3xs:justify-start @3xs:gap-0.5',
].join(' ');

function AverageTile({ label, value }: { label: string; value: number }) {
  return (
    <div className={AVERAGE_TILE}>
      <dt className='text-muted-foreground truncate text-xs'>{label}</dt>
      <dd className='text-lg leading-6 font-semibold'>
        <MotionNumber value={value} />
      </dd>
    </div>
  );
}

export type RangeSummaryProps = {
  title: string;
  /** Where the scale starts. It ends where the last band does. */
  scaleStart?: number;
  bands: RangeBand[];
  periods: RangePeriod[];
  periodId: string;
  onPeriodChange: (periodId: string) => void;
  /** Says the readings are made up. Leave it out for real ones. */
  note?: string;
  className?: string;
};

export function RangeSummary({
  title,
  scaleStart = 0,
  bands,
  periods,
  periodId,
  onPeriodChange,
  note,
  className,
}: RangeSummaryProps) {
  const titleId = useId();
  const period = periods.find((candidate) => candidate.id === periodId);

  if (!period) {
    return null;
  }

  const spans = spansOf(bands, scaleStart);
  const scaleEnd = scaleEndOf(spans, scaleStart);
  const activeSpan = bandOf(period.today, spans);
  const share = shareOf(period.today, scaleStart, scaleEnd);
  const bandLabel = activeSpan?.band.label ?? '';
  const comparison = comparisonOf(period.today, period.weeklyAverage);
  const segments: Segment<string>[] = periods.map((candidate) => ({
    value: candidate.id,
    label: candidate.label,
  }));

  return (
    <Card
      role='group'
      aria-labelledby={titleId}
      className={cn('@container w-full gap-4 p-5', className)}
    >
      <div className='flex items-baseline justify-between gap-3'>
        <h3 id={titleId} className='text-sm font-medium'>
          {title}
        </h3>
        {note && <SampleNote>{note}</SampleNote>}
      </div>
      <Segments
        value={period.id}
        segments={segments}
        onValueChange={onPeriodChange}
        label='Period'
        className='w-full'
        itemClassName='@max-3xs:px-1.5'
      />
      <div className='flex flex-col gap-1'>
        <p className='flex flex-wrap items-baseline gap-x-2'>
          <MotionNumber
            value={period.today}
            className='text-[28px] leading-8 font-semibold'
          />
          <span className='text-muted-foreground flex items-baseline gap-1 text-[13px]'>
            today, in the
            <WordRoll
              text={bandLabel}
              className='text-foreground font-medium'
            />
            band
          </span>
        </p>
        <WordRoll text={comparison} className='text-muted-foreground text-xs' />
      </div>
      <RangeTrack
        spans={spans}
        activeBandId={activeSpan?.band.id}
        share={share}
      />
      <dl className='grid grid-cols-1 gap-2 @3xs:grid-cols-2'>
        <AverageTile label='Weekly average' value={period.weeklyAverage} />
        <AverageTile label='Monthly average' value={period.monthlyAverage} />
      </dl>
    </Card>
  );
}

const BANDS: RangeBand[] = [
  { id: 'low', label: 'Low', upTo: 40 },
  { id: 'steady', label: 'Steady', upTo: 70 },
  { id: 'high', label: 'High', upTo: 100 },
];

const PERIODS: RangePeriod[] = [
  {
    id: 'morning',
    label: 'Morning',
    today: 82,
    weeklyAverage: 74,
    monthlyAverage: 71,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    today: 54,
    weeklyAverage: 61,
    monthlyAverage: 63,
  },
  {
    id: 'evening',
    label: 'Evening',
    today: 67,
    weeklyAverage: 58,
    monthlyAverage: 60,
  },
];

const FIRST_PERIOD_ID = 'morning';

function announcementOf(periodId: string) {
  const period = PERIODS.find((candidate) => candidate.id === periodId);
  if (!period) {
    return '';
  }
  const comparison = comparisonOf(period.today, period.weeklyAverage);
  return `${period.label}: energy ${period.today} today, ${comparison}, monthly average ${period.monthlyAverage}`;
}

export default function Card14() {
  const [periodId, setPeriodId] = useState(FIRST_PERIOD_ID);

  const steps: AutoplayStep[] = [
    { after: 2400, run: () => setPeriodId('afternoon') },
    { after: 2600, run: () => setPeriodId('evening') },
    { after: 2600, run: () => setPeriodId(FIRST_PERIOD_ID) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 400,
  });

  return (
    <div ref={ref} className='min-h-[20rem] w-full max-w-[22rem]'>
      <RangeSummary
        title='Energy'
        bands={BANDS}
        periods={PERIODS}
        periodId={periodId}
        onPeriodChange={setPeriodId}
        note='Illustrative'
      />
      <LiveRegion
        message={spokenUnless(isAutoplaying, announcementOf(periodId))}
      />
    </div>
  );
}
