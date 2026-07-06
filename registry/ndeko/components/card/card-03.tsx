'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { TrendingDownIcon, TrendingUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type RevenueChannel = {
  id: string;
  name: string;
  amount: number;
  /** The colour the channel keeps from one month to the next. */
  series: SeriesSlot;
};

export type RevenueMonth = {
  id: string;
  /** The full name for sentences, and the short one for the switch: "November", "Nov". */
  name: string;
  shortName: string;
  daysInMonth: number;
  /** Revenue to date at the end of each day so far, one value per day, each at least the one before. */
  toDate: number[];
  goal: number;
  /** What the month before had made after the same number of days, and its name. */
  previousToDate: number;
  previousName: string;
  channels: RevenueChannel[];
};

const LOCALE = 'en-US';

const CHART_WIDTH = 100;

const CHART_HEIGHT = 40;

/** Room above the highest point, so the line and its end dot are never cut by the frame. */
const HEADROOM = 1.14;

const DRAWN =
  'transition-transform duration-1000 ease-(--ease-out-strong) starting:-translate-x-full';

const DRAWN_CONTENT =
  'transition-transform duration-1000 ease-(--ease-out-strong) starting:translate-x-full';

const FADED_IN = 'transition-opacity duration-300 starting:opacity-0';

/** The plot stops short of the right edge, so the dot of a full month is not cut in half. */
const PLOT = 'absolute inset-y-0 start-0 end-1.5';

function moneyFormatOf(currency: string): Intl.NumberFormatOptions {
  return { style: 'currency', currency, maximumFractionDigits: 0 };
}

function revenueOf(month: RevenueMonth) {
  const lastDay = month.toDate.length - 1;
  return month.toDate[lastDay] ?? 0;
}

function topOf(month: RevenueMonth) {
  const revenue = revenueOf(month);
  const highest = Math.max(month.goal, revenue, 1);
  return highest * HEADROOM;
}

function xOf(day: number, daysInMonth: number) {
  const days = Math.max(daysInMonth, 1);
  const share = day / days;
  return share * CHART_WIDTH;
}

function yOf(value: number, top: number) {
  const share = value / top;
  const rise = share * CHART_HEIGHT;
  return CHART_HEIGHT - rise;
}

function pointsOf(month: RevenueMonth) {
  const top = topOf(month);
  return month.toDate.map((value, index) => {
    const day = index + 1;
    const x = xOf(day, month.daysInMonth);
    const y = yOf(value, top);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
}

function linePathOf(points: string[]) {
  const start = `M0 ${CHART_HEIGHT}`;
  if (points.length === 0) {
    return start;
  }
  const segments = points.join(' L');
  return `${start} L${segments}`;
}

function areaPathOf(month: RevenueMonth, linePath: string) {
  const lastX = xOf(month.toDate.length, month.daysInMonth);
  return `${linePath} L${lastX.toFixed(2)} ${CHART_HEIGHT} Z`;
}

function percentOf(value: number, whole: number) {
  if (whole <= 0) {
    return 0;
  }
  const share = value / whole;
  const percent = share * 100;
  return Math.round(percent);
}

function isClosed(month: RevenueMonth) {
  return month.toDate.length >= month.daysInMonth;
}

function captionOf(month: RevenueMonth) {
  if (isClosed(month)) {
    return `${month.name}, closed`;
  }
  return `${month.name} to date, day ${month.toDate.length} of ${month.daysInMonth}`;
}

function momentOf(month: RevenueMonth) {
  if (isClosed(month)) {
    return 'at the close';
  }
  return `after ${month.toDate.length} days`;
}

/** The comparison and the moment it is taken at stay apart, so a narrow card puts the moment on a second line. */
type Trend = { isBehind: boolean; comparison: string; moment: string };

function trendOf(month: RevenueMonth): Trend {
  const revenue = revenueOf(month);
  const previous = month.previousToDate;
  if (previous <= 0) {
    const comparison = `Nothing to compare in ${month.previousName}`;
    return { isBehind: false, comparison, moment: '' };
  }
  const difference = revenue - previous;
  const gap = Math.abs(difference);
  const percent = percentOf(gap, previous);
  const moment = momentOf(month);
  if (difference < 0) {
    const comparison = `${percent}% behind ${month.previousName}`;
    return { isBehind: true, comparison, moment };
  }
  const comparison = `${percent}% ahead of ${month.previousName}`;
  return { isBehind: false, comparison, moment };
}

function sentenceOf(trend: Trend) {
  if (trend.moment === '') {
    return trend.comparison;
  }
  return `${trend.comparison} ${trend.moment}`;
}

/** The filled part of a bar slides in from the left, so its round end keeps its shape. */
function fillShiftOf(percent: number) {
  const filled = Math.min(percent, 100);
  const hidden = 100 - filled;
  return `translateX(-${hidden}%)`;
}

function drawnIf(isRedrawn: boolean, classes: string) {
  if (isRedrawn) {
    return classes;
  }
  return undefined;
}

type MonthLineProps = {
  month: RevenueMonth;
  label: string;
  /** False on the first render: the line is there. True after a change of month: it draws itself. */
  isRedrawn: boolean;
};

function MonthLine({ month, label, isRedrawn }: MonthLineProps) {
  const top = topOf(month);
  const revenue = revenueOf(month);
  const points = pointsOf(month);
  const linePath = linePathOf(points);
  const areaPath = areaPathOf(month, linePath);
  const endX = xOf(month.toDate.length, month.daysInMonth);
  const endY = yOf(revenue, top);
  const goalY = yOf(month.goal, top);
  const endLeft = percentOf(endX, CHART_WIDTH);
  const endTop = percentOf(endY, CHART_HEIGHT);
  const goalTop = percentOf(goalY, CHART_HEIGHT);
  const endStyle = { left: `${endLeft}%`, top: `${endTop}%` };
  const goalStyle = { top: `${goalTop}%` };
  const halfMonth = month.daysInMonth / 2;
  const middleDay = Math.round(halfMonth);

  return (
    <div>
      <div className='relative h-24 overflow-x-clip'>
        <div
          aria-hidden='true'
          style={goalStyle}
          className='bg-foreground/15 absolute inset-x-0 h-px'
        />
        <span
          aria-hidden='true'
          style={goalStyle}
          className='text-muted-foreground absolute start-0 -translate-y-full pb-0.5 text-xs'
        >
          Goal
        </span>
        <div
          key={month.id}
          className={cn(
            'absolute inset-0 overflow-hidden',
            drawnIf(isRedrawn, DRAWN)
          )}
        >
          <div
            className={cn(
              'absolute inset-0',
              drawnIf(isRedrawn, DRAWN_CONTENT)
            )}
          >
            <div className={PLOT}>
              <svg
                role='img'
                aria-label={label}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                preserveAspectRatio='none'
                className='size-full'
              >
                <path d={areaPath} className='fill-primary/10' />
                <path
                  d={linePath}
                  fill='none'
                  strokeWidth={1.75}
                  strokeLinejoin='round'
                  strokeLinecap='round'
                  vectorEffect='non-scaling-stroke'
                  className='stroke-primary'
                />
              </svg>
              <span
                aria-hidden='true'
                style={endStyle}
                className='bg-primary ring-card absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
              />
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden='true'
        className='text-muted-foreground mt-1.5 flex justify-between text-xs tabular-nums'
      >
        <span>1</span>
        <span>{middleDay}</span>
        <span>{month.daysInMonth}</span>
      </div>
    </div>
  );
}

function channelTotalOf(channels: RevenueChannel[]) {
  let total = 0;
  for (const channel of channels) {
    total += channel.amount;
  }
  return total;
}

function ChannelBar({ channels }: { channels: RevenueChannel[] }) {
  const total = channelTotalOf(channels);

  return (
    <div className='flex flex-col gap-2'>
      <div
        aria-hidden='true'
        className='flex h-2.5 gap-0.5 overflow-hidden rounded-full'
      >
        {channels.map((channel) => {
          const color = seriesColorOf(channel.series);
          const segmentStyle = {
            flexGrow: channel.amount,
            backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
            backgroundImage: hatchOf(color, 70),
          };
          return (
            <span key={channel.id} style={segmentStyle} className='basis-0' />
          );
        })}
      </div>
      <ul className='flex flex-wrap gap-x-4 gap-y-1'>
        {channels.map((channel) => {
          const dotStyle = { backgroundColor: seriesColorOf(channel.series) };
          return (
            <li key={channel.id} className='flex items-center gap-1.5 text-xs'>
              <span
                aria-hidden='true'
                style={dotStyle}
                className='size-2 rounded-full'
              />
              {channel.name}
              <span className='text-muted-foreground tabular-nums'>
                {percentOf(channel.amount, total)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TrendMark({ isBehind }: { isBehind: boolean }) {
  if (isBehind) {
    return (
      <TrendingDownIcon className='text-warning-foreground size-4 shrink-0' />
    );
  }
  return <TrendingUpIcon className='text-success-foreground size-4 shrink-0' />;
}

export type RevenueCardProps = {
  months: RevenueMonth[];
  monthId: string;
  onMonthChange: (monthId: string) => void;
  currency?: string;
  /** Says the figures are made up. Leave it out for real figures. */
  note?: string;
  className?: string;
};

export function RevenueCard({
  months,
  monthId,
  onMonthChange,
  currency = 'USD',
  note,
  className,
}: RevenueCardProps) {
  const titleId = useId();
  const [firstMonthId] = useState(monthId);
  const [hasSwitched, setHasSwitched] = useState(false);
  const hasOtherMonth = monthId !== firstMonthId;
  const isFirstSwitch = hasOtherMonth && !hasSwitched;
  if (isFirstSwitch) {
    setHasSwitched(true);
  }
  const isRedrawn = hasSwitched || isFirstSwitch;
  const month = months.find((candidate) => candidate.id === monthId);

  if (!month) {
    return null;
  }

  const moneyFormat = moneyFormatOf(currency);
  const money = new Intl.NumberFormat(LOCALE, moneyFormat);
  const revenue = revenueOf(month);
  const goalPercent = percentOf(revenue, month.goal);
  const goalStyle = { transform: fillShiftOf(goalPercent) };
  const trend = trendOf(month);
  const hasMoment = trend.moment !== '';
  const caption = captionOf(month);
  const revenueText = money.format(revenue);
  const goalText = money.format(month.goal);
  const chartLabel = `${caption}: ${revenueText}`;
  const segments: Segment<string>[] = months.map((candidate) => ({
    value: candidate.id,
    label: candidate.shortName,
  }));

  return (
    <Card
      role='group'
      aria-labelledby={titleId}
      className={cn('@container w-full gap-4 p-5', className)}
    >
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h3 id={titleId} className='text-sm font-medium'>
            Revenue
          </h3>
          {note && <SampleNote className='truncate'>{note}</SampleNote>}
        </div>
        <Segments
          value={month.id}
          segments={segments}
          onValueChange={onMonthChange}
          label='Month'
          className='@max-2xs:w-full'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <MotionNumber
          value={revenue}
          locale={LOCALE}
          format={moneyFormat}
          className='text-[28px] leading-8 font-semibold'
        />
        <p className='text-muted-foreground truncate text-xs tabular-nums'>
          {caption}
        </p>
        <p className='flex min-w-0 items-center gap-1.5 text-[13px]'>
          <TrendMark isBehind={trend.isBehind} />
          <span className='flex min-w-0 flex-wrap items-baseline gap-x-1'>
            <WordRoll text={trend.comparison} />
            {hasMoment && (
              <WordRoll text={trend.moment} className='@max-3xs:basis-full' />
            )}
          </span>
        </p>
      </div>
      <MonthLine month={month} label={chartLabel} isRedrawn={isRedrawn} />
      <div className='flex flex-col gap-1.5'>
        <p className='text-xs tabular-nums'>
          <MotionNumber value={goalPercent} locale={LOCALE} suffix='%' />
          <span className='text-muted-foreground'> of the {goalText} goal</span>
        </p>
        <div
          aria-hidden='true'
          className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'
        >
          <div
            style={goalStyle}
            className='bg-primary h-full rounded-full transition-transform duration-500 ease-(--ease-out-strong)'
          />
        </div>
      </div>
      <div key={month.id} className={drawnIf(isRedrawn, FADED_IN)}>
        <ChannelBar channels={month.channels} />
      </div>
    </Card>
  );
}

function runningTotalOf(amounts: number[]) {
  const totals: number[] = [];
  let total = 0;
  for (const amount of amounts) {
    total += amount;
    totals.push(total);
  }
  return totals;
}

const SEPTEMBER_DAYS = [
  4200, 4600, 4400, 3500, 1000, 600, 3900, 4800, 4500, 4700, 3600, 1100, 700,
  4400, 5000, 4600, 4800, 3700, 900, 800, 4500, 5100, 4700, 4900, 3900, 1200,
  700, 4600, 5200, 4800,
];

const OCTOBER_DAYS = [
  4400, 3900, 1100, 700, 4800, 5300, 4500, 5000, 3700, 1300, 900, 4600, 5400,
  4900, 5200, 4100, 1000, 800, 5100, 5600, 4700, 5300, 3800, 1200, 900, 4900,
  5500, 5000, 5400, 4200, 1400,
];

const NOVEMBER_DAYS = [
  900, 4600, 5200, 4800, 5600, 4300, 1200, 800, 5100, 5900, 4700, 5150,
];

const MONTHS: RevenueMonth[] = [
  {
    id: 'september',
    name: 'September',
    shortName: 'Sep',
    daysInMonth: 30,
    toDate: runningTotalOf(SEPTEMBER_DAYS),
    goal: 100000,
    previousToDate: 108900,
    previousName: 'August',
    channels: [
      { id: 'direct', name: 'Direct', amount: 47400, series: 1 },
      { id: 'partners', name: 'Partners', amount: 33700, series: 2 },
      { id: 'marketplace', name: 'Marketplace', amount: 24300, series: 3 },
    ],
  },
  {
    id: 'october',
    name: 'October',
    shortName: 'Oct',
    daysInMonth: 31,
    toDate: runningTotalOf(OCTOBER_DAYS),
    goal: 120000,
    previousToDate: 105400,
    previousName: 'September',
    channels: [
      { id: 'direct', name: 'Direct', amount: 49300, series: 1 },
      { id: 'partners', name: 'Partners', amount: 37800, series: 2 },
      { id: 'marketplace', name: 'Marketplace', amount: 27500, series: 3 },
    ],
  },
  {
    id: 'november',
    name: 'November',
    shortName: 'Nov',
    daysInMonth: 30,
    toDate: runningTotalOf(NOVEMBER_DAYS),
    goal: 125000,
    previousToDate: 40200,
    previousName: 'October',
    channels: [
      { id: 'direct', name: 'Direct', amount: 21700, series: 1 },
      { id: 'partners', name: 'Partners', amount: 14450, series: 2 },
      { id: 'marketplace', name: 'Marketplace', amount: 12100, series: 3 },
    ],
  },
];

const CURRENT_MONTH_ID = 'november';

const DEMO_MONEY = new Intl.NumberFormat(LOCALE, moneyFormatOf('USD'));

function announcementOf(monthId: string) {
  const month = MONTHS.find((candidate) => candidate.id === monthId);
  if (!month) {
    return '';
  }
  const revenue = revenueOf(month);
  const revenueText = DEMO_MONEY.format(revenue);
  const caption = captionOf(month);
  const trend = trendOf(month);
  const sentence = sentenceOf(trend);
  return `${caption}: ${revenueText}, ${sentence}`;
}

export default function Card03() {
  const [monthId, setMonthId] = useState(CURRENT_MONTH_ID);

  const steps: AutoplayStep[] = [
    { after: 2400, run: () => setMonthId('october') },
    { after: 2800, run: () => setMonthId('september') },
    { after: 2800, run: () => setMonthId(CURRENT_MONTH_ID) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 600,
  });

  return (
    <div ref={ref} className='min-h-[24rem] w-full max-w-[24rem]'>
      <RevenueCard
        months={MONTHS}
        monthId={monthId}
        onMonthChange={setMonthId}
        note='Illustrative'
      />
      <LiveRegion
        message={spokenUnless(isAutoplaying, announcementOf(monthId))}
      />
    </div>
  );
}
