'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card } from '@/registry/ndeko/ui/card';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { wrapIndex } from './_parts/deck';
import { sideStepOf } from './_parts/keys';
import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type Night = {
  id: string;
  /** The day the night ended on, short for the column and whole for the detail: "Thu", "Thursday". */
  day: string;
  dayName: string;
  /** Minutes asleep. */
  minutes: number;
  /** When the lights went out, as it reads: "22:40". */
  bedtime: string;
};

const DEFAULT_MAX_HOURS = 10;

const LIGHT_PX = 10;

const LIGHT_GAP_PX = 4;

/** Each light of the picked night comes on this long after the one under it. */
const FILL_STEP_MS = 45;

const TWO_DIGITS: Intl.NumberFormatOptions = { minimumIntegerDigits: 2 };

/** Under 16rem the seven columns share the width equally, with no padding of their own, so Sunday stays in the card. */
const COLUMN = [
  'flex cursor-pointer flex-col items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs outline-none @max-3xs:flex-1 @max-3xs:px-0',
  'transition-[background-color,scale,color] duration-150 ease-(--ease-out-strong)',
  'hover:bg-foreground/[0.04] focus-visible:ring-ring/25 focus-visible:ring-[3px]',
].join(' ');

const GLOW =
  'bg-primary absolute inset-0 rounded-full transition-[opacity,scale] duration-300 ease-(--ease-out-strong)';

const GLOW_OFF = 'scale-50 opacity-0';

const GLOW_ON = 'scale-100 opacity-100';

const GLOW_PART = 'scale-100 opacity-50';

type LightLevel = 'off' | 'part' | 'full';

/** How much of the hour with this number was slept: all of it, some of it, none. */
function levelOf(minutes: number, hour: number): LightLevel {
  const hoursSlept = minutes / 60;
  const hoursBefore = hour - 1;
  if (hoursSlept >= hour) {
    return 'full';
  }
  if (hoursSlept > hoursBefore) {
    return 'part';
  }
  return 'off';
}

const BASE_TONES: Record<LightLevel, string> = {
  off: 'bg-foreground/[0.07]',
  part: 'bg-foreground/15',
  full: 'bg-foreground/25',
};

const GLOW_TONES: Record<LightLevel, string> = {
  off: GLOW_OFF,
  part: GLOW_PART,
  full: GLOW_ON,
};

function glowOf(level: LightLevel, isPicked: boolean) {
  if (isPicked) {
    return GLOW_TONES[level];
  }
  return GLOW_OFF;
}

/** The lights of the picked night come on from the bottom up. A night that is left goes dark at once. */
function fillDelayOf(hour: number, isPicked: boolean) {
  if (!isPicked) {
    return '0ms';
  }
  const steps = hour - 1;
  const delay = steps * FILL_STEP_MS;
  return `${delay}ms`;
}

function durationOf(minutes: number) {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return { hours, rest };
}

function spanOf(minutes: number) {
  const { hours, rest } = durationOf(minutes);
  if (hours === 0) {
    return `${rest} min`;
  }
  if (rest === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${rest}m`;
}

function goalLineOf(minutes: number, goalMinutes: number) {
  const exactDifference = minutes - goalMinutes;
  const difference = Math.round(exactDifference);
  const goal = spanOf(goalMinutes);
  if (difference === 0) {
    return `Right on the ${goal} goal`;
  }
  const distance = Math.abs(difference);
  const gap = spanOf(distance);
  if (difference < 0) {
    return `${gap} short of the ${goal} goal`;
  }
  return `${gap} over the ${goal} goal`;
}

function averageOf(nights: Night[]) {
  if (nights.length === 0) {
    return 0;
  }
  let total = 0;
  for (const night of nights) {
    total += night.minutes;
  }
  return total / nights.length;
}

function spokenNightOf(night: Night, goalMinutes: number) {
  const { hours, rest } = durationOf(night.minutes);
  const goalLine = goalLineOf(night.minutes, goalMinutes);
  return `${night.dayName}: ${hours} hours ${rest} minutes, lights out at ${night.bedtime}, ${goalLine}`;
}

function dayToneOf(isPicked: boolean) {
  if (isPicked) {
    return 'font-medium';
  }
  return 'text-muted-foreground';
}

function tabStopOf(isPicked: boolean) {
  if (isPicked) {
    return 0;
  }
  return -1;
}

type NightColumnProps = {
  night: Night;
  hours: number[];
  label: string;
  isPicked: boolean;
  isPressed: boolean;
  onPick: () => void;
};

function NightColumn({
  night,
  hours,
  label,
  isPicked,
  isPressed,
  onPick,
}: NightColumnProps) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={isPicked}
      aria-label={label}
      tabIndex={tabStopOf(isPicked)}
      onClick={onPick}
      className={cn(COLUMN, pressedQuietOf(isPressed))}
    >
      <span aria-hidden='true' className='flex flex-col-reverse gap-1'>
        {hours.map((hour) => {
          const level = levelOf(night.minutes, hour);
          const glowStyle = { transitionDelay: fillDelayOf(hour, isPicked) };
          return (
            <span
              key={hour}
              className={cn(
                'relative size-2.5 rounded-full',
                BASE_TONES[level]
              )}
            >
              <span
                style={glowStyle}
                className={cn(GLOW, glowOf(level, isPicked))}
              />
            </span>
          );
        })}
      </span>
      <span aria-hidden='true' className={dayToneOf(isPicked)}>
        {night.day}
      </span>
    </button>
  );
}

export type NightsCardProps = {
  nights: Night[];
  goalMinutes: number;
  selectedId: string;
  onSelect: (nightId: string) => void;
  /** How many hours a column holds, one light each. */
  maxHours?: number;
  /** Says the nights are made up. Leave it out for real ones. */
  note?: string;
  /** The night a demonstration picks, shown held down. */
  pressedId?: string | null;
  className?: string;
};

export function NightsCard({
  nights,
  goalMinutes,
  selectedId,
  onSelect,
  maxHours = DEFAULT_MAX_HOURS,
  note,
  pressedId = null,
  className,
}: NightsCardProps) {
  const titleId = useId();
  const selectedIndex = nights.findIndex((night) => night.id === selectedId);
  const selected = nights[selectedIndex];
  const hours = Array.from({ length: maxHours }, (_, index) => index + 1);
  const step = LIGHT_PX + LIGHT_GAP_PX;
  const halfGap = LIGHT_GAP_PX / 2;
  const goalHours = goalMinutes / 60;
  const goalTop = goalHours * step;
  const goalRise = goalTop - halfGap;
  const goalStyle = { bottom: goalRise };
  const goalLabel = spanOf(goalMinutes);
  const averageMinutes = averageOf(nights);
  const average = spanOf(averageMinutes);

  function pickWithArrows(event: React.KeyboardEvent<HTMLDivElement>) {
    const direction = sideStepOf(event.key);
    if (direction === 0) {
      return;
    }
    event.preventDefault();
    const steppedIndex = selectedIndex + direction;
    const nextIndex = wrapIndex(steppedIndex, nights.length);
    const next = nights[nextIndex];
    if (!next) {
      return;
    }
    const columns =
      event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
    onSelect(next.id);
    columns[nextIndex]?.focus();
  }

  if (!selected) {
    return null;
  }

  const slept = durationOf(selected.minutes);
  const goalLine = goalLineOf(selected.minutes, goalMinutes);

  return (
    <Card
      role='group'
      aria-labelledby={titleId}
      className={cn('@container w-full gap-4 p-5', className)}
    >
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h3 id={titleId} className='text-sm font-medium'>
            Sleep
          </h3>
          {note && <SampleNote className='truncate'>{note}</SampleNote>}
        </div>
        <p className='text-muted-foreground text-xs tabular-nums'>
          Average {average}
        </p>
      </div>
      <div className='flex items-start gap-2'>
        <div
          aria-hidden='true'
          className='text-muted-foreground relative mt-1.5 h-[8.5rem] shrink-0 text-xs whitespace-nowrap tabular-nums'
        >
          <span className='invisible'>{goalLabel}</span>
          <span style={goalStyle} className='absolute start-0 translate-y-1/2'>
            {goalLabel}
          </span>
        </div>
        <div
          role='radiogroup'
          aria-label='Night'
          onKeyDown={pickWithArrows}
          className='relative flex min-w-0 flex-1 justify-between'
        >
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-0 top-1.5 h-[8.5rem]'
          >
            <span
              style={goalStyle}
              className='hairline-t border-foreground/35 absolute inset-x-0 border-dashed'
            />
          </div>
          {nights.map((night) => (
            <NightColumn
              key={night.id}
              night={night}
              hours={hours}
              label={spokenNightOf(night, goalMinutes)}
              isPicked={night.id === selected.id}
              isPressed={night.id === pressedId}
              onPick={() => onSelect(night.id)}
            />
          ))}
        </div>
      </div>
      <div className='flex items-end justify-between gap-3 @max-2xs:flex-col @max-2xs:items-start @max-2xs:gap-2'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs'>
            <Swap swapKey={selected.id}>{selected.dayName}</Swap>
          </p>
          <p
            aria-hidden='true'
            className='flex items-baseline text-[28px] leading-8 font-semibold'
          >
            <MotionNumber value={slept.hours} suffix='h' />
            <MotionNumber
              value={slept.rest}
              suffix='m'
              format={TWO_DIGITS}
              className='ms-1.5'
            />
          </p>
        </div>
        <div className='flex min-w-0 flex-col items-end text-xs @max-2xs:items-start'>
          <p className='tabular-nums'>
            <span className='text-muted-foreground'>Lights out </span>
            <Swap swapKey={selected.id}>{selected.bedtime}</Swap>
          </p>
          <WordRoll text={goalLine} className='text-muted-foreground' />
        </div>
      </div>
    </Card>
  );
}

const NIGHTS: Night[] = [
  { id: 'mon', day: 'Mon', dayName: 'Monday', minutes: 412, bedtime: '23:48' },
  { id: 'tue', day: 'Tue', dayName: 'Tuesday', minutes: 455, bedtime: '23:10' },
  {
    id: 'wed',
    day: 'Wed',
    dayName: 'Wednesday',
    minutes: 388,
    bedtime: '00:35',
  },
  {
    id: 'thu',
    day: 'Thu',
    dayName: 'Thursday',
    minutes: 502,
    bedtime: '22:40',
  },
  { id: 'fri', day: 'Fri', dayName: 'Friday', minutes: 431, bedtime: '23:55' },
  {
    id: 'sat',
    day: 'Sat',
    dayName: 'Saturday',
    minutes: 538,
    bedtime: '23:20',
  },
  { id: 'sun', day: 'Sun', dayName: 'Sunday', minutes: 468, bedtime: '23:05' },
];

const GOAL_MINUTES = 480;

const LAST_NIGHT_ID = 'sun';

function announcementOf(nightId: string) {
  const night = NIGHTS.find((candidate) => candidate.id === nightId);
  if (!night) {
    return '';
  }
  return spokenNightOf(night, GOAL_MINUTES);
}

export default function Card13() {
  const [selectedId, setSelectedId] = useState(LAST_NIGHT_ID);
  const { pressed, press } = usePress<string>();

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => press('wed') },
    { after: PRESS_LEAD_MS, run: () => setSelectedId('wed') },
    { after: 2200, run: () => press('thu') },
    { after: PRESS_LEAD_MS, run: () => setSelectedId('thu') },
    { after: 2200, run: () => press('sat') },
    { after: PRESS_LEAD_MS, run: () => setSelectedId('sat') },
    { after: 2200, run: () => press(LAST_NIGHT_ID) },
    { after: PRESS_LEAD_MS, run: () => setSelectedId(LAST_NIGHT_ID) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 400,
  });

  return (
    <div ref={ref} className='min-h-[19.5rem] w-full max-w-[22rem]'>
      <NightsCard
        nights={NIGHTS}
        goalMinutes={GOAL_MINUTES}
        selectedId={selectedId}
        onSelect={setSelectedId}
        note='Sample week'
        pressedId={pressed}
      />
      <LiveRegion
        message={spokenUnless(isAutoplaying, announcementOf(selectedId))}
      />
    </div>
  );
}
