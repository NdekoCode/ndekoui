'use client';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { ChartCard } from './chart-card';
import {
  campaignOf,
  CAMPAIGNS,
  channelOf,
  TODAY_INDEX,
  WEEK,
  WEEK_RANGE,
  type Campaign,
} from './data';

type ChipStyle = React.CSSProperties & { '--chip': string };

type WeekItem = {
  campaign: Campaign;
  from: number;
  to: number;
  lane: number;
};

type Span = {
  from: number;
  to: number;
};

function spanOf(campaign: Campaign): Span | null {
  const { weekFrom, weekTo } = campaign;
  if (weekFrom === undefined || weekTo === undefined) {
    return null;
  }
  return { from: weekFrom, to: weekTo };
}

/** Each campaign takes the first row where the one before it has ended, so the strip is as short as it can be. */
function itemsOfWeek() {
  const items: WeekItem[] = [];
  const laneEnds: number[] = [];
  const running = CAMPAIGNS.flatMap((campaign) => {
    const span = spanOf(campaign);
    if (span === null) {
      return [];
    }
    return [{ campaign, span }];
  });
  const ordered = running.sort((first, second) => {
    const gap = first.span.from - second.span.from;
    if (gap !== 0) {
      return gap;
    }
    return second.span.to - first.span.to;
  });
  for (const { campaign, span } of ordered) {
    let lane = laneEnds.findIndex((end) => end < span.from);
    if (lane === -1) {
      lane = laneEnds.length;
    }
    laneEnds[lane] = span.to;
    items.push({ campaign, from: span.from, to: span.to, lane });
  }
  return items;
}

const ITEMS = itemsOfWeek();

const LANE_COUNT = Math.max(...ITEMS.map((item) => item.lane)) + 1;

function todayClassOf(isToday: boolean) {
  if (isToday) {
    return 'bg-primary text-primary-foreground';
  }
  return undefined;
}

function selectedClassOf(isSelected: boolean) {
  if (isSelected) {
    return 'outline-2 outline-offset-2 outline-primary';
  }
  return undefined;
}

function spanWordsOf(item: WeekItem) {
  const first = WEEK[item.from].weekday;
  const last = WEEK[item.to].weekday;
  if (first === last) {
    return first;
  }
  return `${first} to ${last}`;
}

function captionOf(selectedId: string | null) {
  if (selectedId === null) {
    return 'Select a campaign to find it in the table';
  }
  const campaign = campaignOf(selectedId);
  const item = ITEMS.find((candidate) => candidate.campaign.id === selectedId);
  const channel = channelOf(campaign.channel);
  if (!item) {
    return `${campaign.name}, ${channel.name}`;
  }
  return `${campaign.name}, ${channel.name}, ${spanWordsOf(item)}`;
}

type WeekStripProps = {
  selectedId: string | null;
  pressed: string | null;
  onSelect: (id: string) => void;
};

export function WeekStrip({ selectedId, pressed, onSelect }: WeekStripProps) {
  const caption = captionOf(selectedId);

  return (
    <ChartCard
      title='Campaigns this week'
      section='week'
      description={
        <p className='text-muted-foreground text-xs'>{WEEK_RANGE}</p>
      }
    >
      <div className='relative -mx-1 overflow-x-auto px-1'>
        <div
          className='grid min-w-[28rem] grid-cols-7 gap-x-1 gap-y-1'
          style={{ gridTemplateRows: `auto repeat(${LANE_COUNT}, 1.75rem)` }}
        >
          <span
            aria-hidden='true'
            className='bg-foreground/[0.04] rounded-lg'
            style={{
              gridColumn: TODAY_INDEX + 1,
              gridRow: `1 / span ${LANE_COUNT + 1}`,
            }}
          />
          {WEEK.map((day) => {
            const isToday = day.index === TODAY_INDEX;
            return (
              <div
                key={day.index}
                className='text-muted-foreground relative flex flex-col items-center gap-0.5 py-1 text-xs'
                style={{ gridColumn: day.index + 1, gridRow: 1 }}
              >
                <span>{day.weekday}</span>
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-[13px] font-medium tabular-nums',
                    todayClassOf(isToday)
                  )}
                >
                  {day.dayOfMonth}
                </span>
              </div>
            );
          })}
          {ITEMS.map((item) => {
            const { campaign } = item;
            const channel = channelOf(campaign.channel);
            const isSelected = campaign.id === selectedId;
            const isPressed = pressed === `campaign-${campaign.id}`;
            const style: ChipStyle = {
              '--chip': seriesColorOf(channel.series),
              gridColumn: `${item.from + 1} / ${item.to + 2}`,
              gridRow: item.lane + 2,
            };
            return (
              <button
                key={campaign.id}
                type='button'
                aria-pressed={isSelected}
                aria-label={`${campaign.name}, ${channel.name}, ${spanWordsOf(item)}`}
                onClick={() => onSelect(campaign.id)}
                style={style}
                className={cn(
                  'chip-3d focus-visible:outline-ring relative flex h-7 min-w-0 cursor-pointer items-center rounded-md px-2 text-start text-xs font-medium transition-[scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]',
                  selectedClassOf(isSelected),
                  pressedQuietOf(isPressed)
                )}
              >
                <span className='truncate'>{campaign.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Swap swapKey={caption} className='text-muted-foreground min-h-5 text-xs'>
        {caption}
      </Swap>
    </ChartCard>
  );
}
