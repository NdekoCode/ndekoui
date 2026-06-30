'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { PLAN, SECTION } from './data';
import { FeatureTable } from './feature-table';

const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', PRICE_FORMAT);

function formatPrice(amount: number) {
  return PRICE_FORMATTER.format(amount);
}

function seatsLabelOf(seats: number) {
  if (seats === 1) {
    return 'for 1 seat';
  }
  return `for ${seats} seats`;
}

function moreSeatsOf(seats: number) {
  const next = seats + 1;
  return Math.min(next, PLAN.maxSeats);
}

function fewerSeatsOf(seats: number) {
  const next = seats - 1;
  return Math.max(next, PLAN.minSeats);
}

export default function Pricing02() {
  const [seats, setSeats] = useState(PLAN.defaultSeats);
  const canRemoveSeat = seats > PLAN.minSeats;
  const canAddSeat = seats < PLAN.maxSeats;
  const total = seats * PLAN.pricePerSeat;
  const seatPrice = formatPrice(PLAN.pricePerSeat);
  const seatsLabel = seatsLabelOf(seats);

  function addSeat() {
    setSeats(moreSeatsOf);
  }

  function removeSeat() {
    setSeats(fewerSeatsOf);
  }

  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 sm:gap-14'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.description}
          </p>
        </div>
        <div className='grid items-start gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16'>
          <article className='surface-brand flex flex-col gap-6 rounded-xl p-6 sm:p-7 lg:sticky lg:top-8'>
            <div className='flex flex-col gap-1.5'>
              <h3 className='text-sm font-medium'>{PLAN.name}</h3>
              <p className='text-muted-foreground text-[13px]'>
                {PLAN.description}
              </p>
            </div>
            <p className='flex items-baseline gap-1.5'>
              <span className='text-4xl font-semibold tabular-nums'>
                {seatPrice}
              </span>
              <span className='text-muted-foreground text-[13px]'>
                per seat, per month
              </span>
            </p>
            <div className='flex items-center justify-between gap-4'>
              <span id='pricing-02-seats' className='text-[13px] font-medium'>
                Seats
              </span>
              <div
                role='group'
                aria-labelledby='pricing-02-seats'
                className='bg-card hairline-ring ring-foreground/12 dark:bg-foreground/[0.04] dark:ring-foreground/15 inline-flex items-center gap-1 rounded-full p-0.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'
              >
                <Button
                  variant='ghost'
                  size='icon-sm'
                  className='rounded-full'
                  aria-label='Remove a seat'
                  disabled={!canRemoveSeat}
                  focusableWhenDisabled
                  onClick={removeSeat}
                >
                  <MinusIcon />
                </Button>
                <MotionNumber
                  value={seats}
                  className='min-w-6 justify-center text-[13px] font-medium'
                />
                <Button
                  variant='ghost'
                  size='icon-sm'
                  className='rounded-full'
                  aria-label='Add a seat'
                  disabled={!canAddSeat}
                  focusableWhenDisabled
                  onClick={addSeat}
                >
                  <PlusIcon />
                </Button>
              </div>
            </div>
            <div
              aria-live='polite'
              className='bg-foreground/[0.03] flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5'
            >
              <span className='text-muted-foreground text-[13px]'>
                Total per month
              </span>
              <span className='flex items-baseline gap-1.5 text-sm'>
                <MotionNumber
                  value={total}
                  format={PRICE_FORMAT}
                  className='font-semibold'
                />
                <span className='text-muted-foreground text-xs'>
                  {seatsLabel}
                </span>
              </span>
            </div>
            <Button size='lg' nativeButton={false} render={<a href='#' />}>
              {PLAN.action}
            </Button>
            <p className='text-muted-foreground text-xs'>{PLAN.footnote}</p>
          </article>
          <FeatureTable />
        </div>
      </div>
    </section>
  );
}
