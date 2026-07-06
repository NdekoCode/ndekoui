'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

import { ChartCard } from './chart-card';
import { GRID_STEPS, niceScaleOf, shareOf } from './chart-math';
import { CHANNELS } from './data';
import { COMPACT_FORMAT, formatCount } from './format';
import { BAR_SLOTS, type PeriodData } from './period-data';
import { useReading } from './use-reading';

const PLOT_HEIGHT = 176;

const GROUP_SHARE = 0.72;

/** A bar that is not in the period shrinks to the corner it grows out of when the period gets longer. */
const COLLAPSED = 'inset(100% 100% 0% 0% round 2px 2px 0 0)';

const GRID_STEP_LIST = Array.from(
  { length: GRID_STEPS + 1 },
  (_, step) => step
);

function gridTopOf(step: number) {
  const share = step / GRID_STEPS;
  return PLOT_HEIGHT - share * PLOT_HEIGHT;
}

function percentText(share: number) {
  return `${(share * 100).toFixed(2)}%`;
}

/**
 * Every bar is a layer as big as the plot, clipped to its own rectangle: one property says where it
 * stands and how tall it is, so a bar glides to a new place and a new height in one movement, with
 * its corner radius intact.
 */
function barInsetOf(
  position: number,
  channelIndex: number,
  months: number,
  value: number,
  largest: number
) {
  const slotWidth = 1 / months;
  const groupWidth = slotWidth * GROUP_SHARE;
  const barWidth = groupWidth / CHANNELS.length;
  const groupStart = position * slotWidth + (slotWidth - groupWidth) / 2;
  const left = groupStart + channelIndex * barWidth;
  const right = left + barWidth;
  const top = 1 - shareOf(value, largest);
  const rightEdge = `calc(${percentText(1 - right)} + 0.5px)`;
  const leftEdge = `calc(${percentText(left)} + 0.5px)`;
  return `inset(${percentText(top)} ${rightEdge} 0% ${leftEdge} round 2px 2px 0 0)`;
}

function clipOf(
  isPresent: boolean,
  position: number,
  channelIndex: number,
  months: number,
  value: number,
  largest: number
) {
  if (!isPresent) {
    return COLLAPSED;
  }
  return barInsetOf(position, channelIndex, months, value, largest);
}

type BarSpec = {
  id: string;
  slot: number;
  color: string;
  clip: string;
};

function barSpecsOf(data: PeriodData, largest: number) {
  const firstPresent = BAR_SLOTS - data.months;
  const specs: BarSpec[] = [];
  data.bars.forEach((bar, slot) => {
    const position = slot - firstPresent;
    CHANNELS.forEach((channel, channelIndex) => {
      const clip = clipOf(
        bar.isPresent,
        position,
        channelIndex,
        data.months,
        bar.values[channelIndex],
        largest
      );
      specs.push({
        id: `${bar.label}-${channel.id}`,
        slot,
        color: seriesColorOf(channel.series),
        clip,
      });
    });
  });
  return specs;
}

function dimmedClassOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-30';
  }
  return 'opacity-100';
}

function labelLeftOf(position: number, months: number) {
  const share = (position + 0.5) / months;
  return percentText(share);
}

function isMinorLabel(position: number, months: number) {
  const isCrowded = months === BAR_SLOTS;
  const isOdd = position % 2 === 1;
  return isCrowded && isOdd;
}

function readingCaptionOf(data: PeriodData, slot: number) {
  const bar = data.bars[slot];
  const parts = CHANNELS.map((channel, index) => {
    return `${channel.name} ${formatCount(bar.values[index])}`;
  });
  return `${bar.label}: ${parts.join(', ')}`;
}

type ChannelBarsProps = {
  data: PeriodData;
};

export function ChannelBars({ data }: ChannelBarsProps) {
  const { months } = data;
  const firstPresent = BAR_SLOTS - months;
  const reading = useReading(months, 'column');
  const scale = niceScaleOf(data.largestBar);
  const readSlot = reading.shownIndex + firstPresent;
  const caption = readingCaptionOf(data, readSlot);
  const barSpecs = barSpecsOf(data, scale.max);
  const presentBars = data.bars.filter((bar) => bar.isPresent);

  return (
    <ChartCard
      title='Clicks by channel and month'
      section='channels'
      description={
        <p className='text-muted-foreground text-xs'>Clicks per month</p>
      }
    >
      <p className='text-muted-foreground min-h-5 text-xs'>{caption}</p>
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
          aria-label='Clicks by channel and month. The arrow keys read each month'
          aria-orientation='horizontal'
          aria-valuemin={0}
          aria-valuemax={months - 1}
          aria-valuenow={reading.shownIndex}
          aria-valuetext={caption}
          className='focus-visible:ring-ring/25 relative touch-pan-y rounded-md outline-none focus-visible:ring-[3px]'
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
          {barSpecs.map((spec) => {
            const isDimmed = reading.isReading && spec.slot !== readSlot;
            return (
              <span
                key={spec.id}
                aria-hidden='true'
                className={cn(
                  'pointer-events-none absolute inset-0 transition-[clip-path,opacity] duration-[500ms,150ms] ease-(--ease-out-strong)',
                  dimmedClassOf(isDimmed)
                )}
                style={{ backgroundColor: spec.color, clipPath: spec.clip }}
              />
            );
          })}
        </div>
        <div
          aria-hidden='true'
          className='relative col-start-2 mt-2 h-4 text-[11px]'
        >
          {data.bars.map((bar, slot) => {
            const position = slot - firstPresent;
            const isMinor = isMinorLabel(position, months);
            return (
              <span
                key={bar.label}
                className={cn(
                  'text-muted-foreground absolute top-0 -translate-x-1/2 whitespace-nowrap transition-[left,opacity] duration-500 ease-(--ease-out-strong)',
                  !bar.isPresent && 'opacity-0',
                  isMinor && '@max-md/card:opacity-0'
                )}
                style={{ left: labelLeftOf(Math.max(position, 0), months) }}
              >
                {bar.label}
              </span>
            );
          })}
        </div>
      </div>
      <div className='sr-only'>
        <table>
          <caption>Clicks by channel and month</caption>
          <thead>
            <tr>
              <th scope='col'>Month</th>
              {CHANNELS.map((channel) => (
                <th key={channel.id} scope='col'>
                  {channel.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {presentBars.map((bar) => (
              <tr key={bar.label}>
                <th scope='row'>{bar.label}</th>
                {bar.values.map((value, index) => (
                  <td key={CHANNELS[index].id}>{formatCount(value)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
        {CHANNELS.map((channel) => (
          <li key={channel.id} className='flex items-center gap-1.5'>
            <span
              aria-hidden='true'
              className='size-2 rounded-full'
              style={{ backgroundColor: seriesColorOf(channel.series) }}
            />
            {channel.name}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
