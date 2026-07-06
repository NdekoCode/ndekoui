'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useNow } from '@/registry/ndeko/hooks/use-agent-run';

import { WINDOW } from './data';

const SECOND_MS = 1000;

const MINUTE_MS = 60_000;

const TWO_DIGITS = { minimumIntegerDigits: 2 };

const LOADED_AT = Date.now();

const STARTED_AT = LOADED_AT - WINDOW.startedBeforeLoadMs;

const ENDS_AT = STARTED_AT + WINDOW.plannedMs;

const LEFT_AT_LOAD = WINDOW.plannedMs - WINDOW.startedBeforeLoadMs;

const PLANNED_MINUTES = Math.round(WINDOW.plannedMs / MINUTE_MS);

type Left = {
  minutes: number;
  seconds: number;
};

function leftOf(remainingMs: number): Left {
  const totalSeconds = Math.ceil(remainingMs / SECOND_MS);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
}

function twoDigits(value: number) {
  const text = String(value);
  return text.padStart(2, '0');
}

function shareOf(now: number) {
  const elapsed = now - STARTED_AT;
  const share = elapsed / WINDOW.plannedMs;
  const atLeastNone = Math.max(0, share);
  return Math.min(1, atLeastNone);
}

function startedLineOf(now: number) {
  const elapsed = now - STARTED_AT;
  const minutes = Math.floor(elapsed / MINUTE_MS);
  if (minutes < 1) {
    return 'Started less than a minute ago';
  }
  if (minutes === 1) {
    return 'Started 1 minute ago';
  }
  return `Started ${minutes} minutes ago`;
}

function spokenLeftOf(left: Left) {
  if (left.minutes < 1) {
    return 'Less than a minute left';
  }
  if (left.minutes === 1) {
    return 'About 1 minute left';
  }
  return `About ${left.minutes} minutes left`;
}

/**
 * The only part of the page that ticks. Until the browser has a clock, the planned figure stands
 * in, so the page and its first paint agree; the clock takes over at the same value. The seconds
 * tick without stopping, so they are plain figures; the minutes change once a minute and roll.
 */
export function MaintenanceClock() {
  const now = useNow(SECOND_MS);
  const hasClock = now > 0;
  let remaining = LEFT_AT_LOAD;
  if (hasClock) {
    remaining = Math.max(0, ENDS_AT - now);
  }
  const left = leftOf(remaining);
  const isOver = remaining === 0;
  let share = 1 - LEFT_AT_LOAD / WINDOW.plannedMs;
  if (hasClock) {
    share = shareOf(now);
  }
  const startedLine = startedLineOf(now);
  const barStyle = { transform: `scaleX(${share})` };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <p className='text-muted-foreground text-xs'>Back in about</p>
        {isOver && (
          <p className='text-[28px] leading-none font-semibold'>
            Any minute now
          </p>
        )}
        {!isOver && (
          <p className='text-[28px] leading-none font-semibold tabular-nums'>
            <span className='sr-only'>{spokenLeftOf(left)}</span>
            {!hasClock && (
              <span aria-hidden='true'>
                {twoDigits(left.minutes)}:{twoDigits(left.seconds)}
              </span>
            )}
            {hasClock && (
              <span aria-hidden='true' className='inline-flex items-baseline'>
                <MotionNumber value={left.minutes} format={TWO_DIGITS} />
                <span>:{twoDigits(left.seconds)}</span>
              </span>
            )}
          </p>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        <div className='bg-foreground/10 h-1 overflow-hidden rounded-full'>
          <div
            style={barStyle}
            className='bg-info h-full origin-left rounded-full transition-transform duration-1000 ease-linear'
          />
        </div>
        <p className='text-muted-foreground flex flex-wrap justify-between gap-x-3 text-xs tabular-nums'>
          {hasClock && <span>{startedLine}</span>}
          {!hasClock && <span>Started a few minutes ago</span>}
          <span>Planned for {PLANNED_MINUTES} minutes</span>
        </p>
      </div>
    </div>
  );
}
