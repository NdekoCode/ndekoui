'use client';
import { useState } from 'react';
import { MotionNumber } from '@/components/core/motion-number';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MIN_SEATS = 1;

const MAX_SEATS = 120;

function seatsLabelOf(seats: number) {
  if (seats === 1) {
    return '1 seat on the Studio plan';
  }
  return `${seats} seats on the Studio plan`;
}

export function MotionNumberCounter() {
  const [seats, setSeats] = useState(9);
  const isAtMinimum = seats <= MIN_SEATS;
  const isAtMaximum = seats >= MAX_SEATS;

  function removeSeat() {
    setSeats((current) => {
      const fewerSeats = current - 1;
      return Math.max(MIN_SEATS, fewerSeats);
    });
  }

  function addSeat() {
    setSeats((current) => {
      const moreSeats = current + 1;
      return Math.min(MAX_SEATS, moreSeats);
    });
  }

  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          size='icon'
          aria-label='Remove a seat'
          disabled={isAtMinimum}
          onClick={removeSeat}
        >
          <MinusIcon />
        </Button>
        <output
          aria-live='polite'
          className='text-foreground flex min-w-[3ch] justify-center text-4xl font-semibold'
        >
          <MotionNumber value={seats} />
        </output>
        <Button
          variant='outline'
          size='icon'
          aria-label='Add a seat'
          disabled={isAtMaximum}
          onClick={addSeat}
        >
          <PlusIcon />
        </Button>
      </div>
      <p className='text-muted-foreground text-xs'>{seatsLabelOf(seats)}</p>
    </div>
  );
}
