'use client';

import { useInView } from 'motion/react';
import { useRef, useState } from 'react';

import {
  useDocumentVisible,
  useNow,
} from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { Flap, FLAP_PLACEHOLDER } from './_parts/flap';
import { useHover } from './_parts/use-hover';

export type FlapUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export type FlapClockMode = 'time' | 'countdown';

type Figure = {
  unit: FlapUnit;
  value: number;
};

const TICK_MS = 1000;

const SECONDS_IN: Record<FlapUnit, number> = {
  days: 86_400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

const UNIT_ORDER: readonly FlapUnit[] = ['days', 'hours', 'minutes', 'seconds'];

const DEFAULT_UNITS: readonly FlapUnit[] = ['hours', 'minutes', 'seconds'];

const UNIT_WORDS: Record<FlapUnit, string> = {
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
};

const UNIT_NOUNS: Record<FlapUnit, string> = {
  days: 'day',
  hours: 'hour',
  minutes: 'minute',
  seconds: 'second',
};

/** A card is two characters wide, so the largest unit of a countdown stops at this. */
const LARGEST_FIGURE = 99;

function orderedUnitsOf(units: readonly FlapUnit[]) {
  return UNIT_ORDER.filter((unit) => units.includes(unit));
}

function timeValueOf(unit: FlapUnit, date: Date) {
  if (unit === 'hours') {
    return date.getHours();
  }
  if (unit === 'minutes') {
    return date.getMinutes();
  }
  return date.getSeconds();
}

function timeFiguresOf(units: readonly FlapUnit[], now: number): Figure[] {
  const date = new Date(now);
  const clockUnits = orderedUnitsOf(units).filter((unit) => unit !== 'days');
  return clockUnits.map((unit) => ({ unit, value: timeValueOf(unit, date) }));
}

function countdownFiguresOf(
  units: readonly FlapUnit[],
  until: number,
  now: number
): Figure[] {
  const remainingMs = Math.max(0, until - now);
  let rest = Math.ceil(remainingMs / TICK_MS);
  const figures: Figure[] = [];
  for (const unit of orderedUnitsOf(units)) {
    const value = Math.floor(rest / SECONDS_IN[unit]);
    rest -= value * SECONDS_IN[unit];
    figures.push({ unit, value });
  }
  return figures;
}

function figuresOf(
  mode: FlapClockMode,
  units: readonly FlapUnit[],
  until: number,
  now: number
) {
  if (mode === 'time') {
    return timeFiguresOf(units, now);
  }
  return countdownFiguresOf(units, until, now);
}

function twoDigitsOf(value: number) {
  const capped = Math.min(LARGEST_FIGURE, value);
  return String(capped).padStart(2, '0');
}

function flapTextOf(figure: Figure, hasClock: boolean) {
  if (!hasClock) {
    return FLAP_PLACEHOLDER;
  }
  return twoDigitsOf(figure.value);
}

function spokenOf(
  mode: FlapClockMode,
  figures: readonly Figure[],
  hasClock: boolean
) {
  if (!hasClock) {
    return '';
  }
  if (mode === 'time') {
    const digits = figures.map((figure) => twoDigitsOf(figure.value));
    return digits.join(':');
  }
  const counts = figures.map((figure) => {
    return countOf(figure.value, UNIT_NOUNS[figure.unit]);
  });
  return counts.join(', ');
}

export type FlapClockProps = {
  /** `time` shows the local time; `countdown` counts down to `until`. */
  mode: FlapClockMode;
  /** The moment a countdown ends, as a timestamp in milliseconds. */
  until?: number;
  /** The cards to show, left to right. `days` only counts down, and a countdown shows up to 99 of its largest unit. */
  units?: readonly FlapUnit[];
  /** What the clock tells, read by screen readers: "Doors open in". */
  label: string;
  className?: string;
};

/**
 * Split flap cards that tell the local time or count down to a moment. A card folds over its hinge
 * when its figure changes. The clock ticks once a second, only while it is on screen and the tab is
 * shown; it is the one part of the page that re-renders. Its size follows the width it is given.
 */
export function FlapClock({
  mode,
  until = 0,
  units = DEFAULT_UNITS,
  label,
  className,
}: FlapClockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const isTabVisible = useDocumentVisible();
  const isOnScreen = isInView && isTabVisible;
  const now = useNow(TICK_MS, isOnScreen);
  const hasClock = now > 0;
  const figures = figuresOf(mode, units, until, now);
  const spoken = spokenOf(mode, figures, hasClock);

  return (
    <div
      ref={ref}
      role='timer'
      aria-label={label}
      className={cn('@container w-full', className)}
    >
      <span className='sr-only'>{spoken}</span>
      <div
        aria-hidden='true'
        className='flex justify-center gap-[0.3em] text-[length:clamp(1.75rem,15cqw,3.25rem)]'
      >
        {figures.map((figure) => (
          <div key={figure.unit} className='flex flex-col items-center gap-2'>
            <Flap value={flapTextOf(figure, hasClock)} />
            <span className='text-muted-foreground text-xs'>
              {UNIT_WORDS[figure.unit]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MODES: Segment<FlapClockMode>[] = [
  { value: 'countdown', label: 'Countdown' },
  { value: 'time', label: 'Local time' },
];

const CAPTIONS: Record<FlapClockMode, string> = {
  countdown: 'Doors open in',
  time: 'Your local time',
};

/** A countdown that starts a few seconds above two hours, so that a few seconds in, hours, minutes and seconds all fold at once. */
const COUNTDOWN_MS = 7_203_500;

const LOADED_AT = Date.now();

export default function Effect05() {
  const [mode, setMode] = useState<FlapClockMode>('countdown');
  const [until, setUntil] = useState(LOADED_AT + COUNTDOWN_MS);
  const { isHovered, hoverHandlers } = useHover();

  function startCountdown() {
    setMode('countdown');
    setUntil(Date.now() + COUNTDOWN_MS);
  }

  const steps: AutoplayStep[] = [
    { after: 700, run: startCountdown },
    { after: 8200, run: () => setMode('time') },
    { after: 6500, run: hold },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 600,
    isEnabled: !isHovered,
  });

  return (
    <div
      ref={ref}
      className='@container flex w-full max-w-[22rem] flex-col items-center gap-4'
      {...hoverHandlers}
    >
      <p aria-hidden='true' className='text-muted-foreground text-xs'>
        <Swap swapKey={mode}>{CAPTIONS[mode]}</Swap>
      </p>
      <FlapClock mode={mode} until={until} label={CAPTIONS[mode]} />
      <Segments
        value={mode}
        segments={MODES}
        onValueChange={setMode}
        label='Clock'
      />
    </div>
  );
}
