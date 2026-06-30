'use client';
import { useState } from 'react';
import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const PRICE_PER_SEAT = 18;

const MIN_SEATS = 1;

const MAX_SEATS = 40;

const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

function seatsLabelOf(seats: number) {
  if (seats === 1) {
    return 'for 1 seat';
  }
  return `for ${seats} seats`;
}

function moreSeatsOf(seats: number) {
  const next = seats + 1;
  return Math.min(next, MAX_SEATS);
}

function fewerSeatsOf(seats: number) {
  const next = seats - 1;
  return Math.max(next, MIN_SEATS);
}

export function WordRollSeats() {
  const [seats, setSeats] = useState(3);
  const total = seats * PRICE_PER_SEAT;
  const seatsLabel = seatsLabelOf(seats);
  const canRemoveSeat = seats > MIN_SEATS;
  const canAddSeat = seats < MAX_SEATS;

  function removeSeat() {
    setSeats(fewerSeatsOf);
  }

  function addSeat() {
    setSeats(moreSeatsOf);
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-xs flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-center justify-between gap-4'>
        <span id='word-roll-seats' className='text-[13px] font-medium'>
          Seats
        </span>
        <div
          role='group'
          aria-labelledby='word-roll-seats'
          className='flex items-center gap-1'
        >
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Remove a seat'
            disabled={!canRemoveSeat}
            focusableWhenDisabled
            onClick={removeSeat}
          >
            <MinusIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Add a seat'
            disabled={!canAddSeat}
            focusableWhenDisabled
            onClick={addSeat}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <p
        aria-live='polite'
        className='bg-foreground/[0.03] flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5'
      >
        <span className='text-muted-foreground text-[13px]'>Per month</span>
        <span className='flex items-baseline gap-1.5 text-sm'>
          <MotionNumber
            value={total}
            format={PRICE_FORMAT}
            className='font-semibold'
          />
          <WordRoll
            text={seatsLabel}
            value={seats}
            className='text-muted-foreground text-xs'
          />
        </span>
      </p>
    </div>
  );
}
