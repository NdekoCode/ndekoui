'use client';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';

import { OFFER_LENGTH_MS } from './data';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const LOADED_AT = Date.now();

const ENDS_AT = LOADED_AT + OFFER_LENGTH_MS;

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function clockTextOf(remainingMs: number) {
  const days = Math.floor(remainingMs / DAY_MS);
  const sinceDay = remainingMs % DAY_MS;
  const hours = Math.floor(sinceDay / HOUR_MS);
  const sinceHour = remainingMs % HOUR_MS;
  const minutes = Math.floor(sinceHour / MINUTE_MS);
  const sinceMinute = remainingMs % MINUTE_MS;
  const seconds = Math.floor(sinceMinute / SECOND_MS);
  const time = [hours, minutes, seconds].map(twoDigits).join(':');
  return `${days}d ${time}`;
}

/**
 * The only part of the block that ticks. Until the browser has a clock the length of the offer
 * stands in, so the page and its first paint agree.
 */
export function Countdown() {
  const now = useNow(SECOND_MS);
  const hasClock = now > 0;
  let remaining = OFFER_LENGTH_MS;
  if (hasClock) {
    remaining = Math.max(0, ENDS_AT - now);
  }
  const isOver = remaining === 0;

  return (
    <p className='flex items-center gap-2 text-[13px]'>
      <span className='text-muted-foreground'>Ends in</span>
      <span
        role='timer'
        aria-label='Time left in the offer'
        className='bg-foreground/[0.06] inline-block w-28 rounded-md px-2 py-1 text-center font-medium tabular-nums'
      >
        {clockTextOf(remaining)}
      </span>
      {isOver && <span className='text-muted-foreground'>The offer ended</span>}
    </p>
  );
}
