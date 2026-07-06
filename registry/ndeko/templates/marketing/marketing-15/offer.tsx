'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { Button } from '@/registry/ndeko/ui/button';
import { Segments } from '@/registry/ndeko/ui/segments';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  DEFAULT_SEATS,
  OFFER,
  PRICING_ANCHOR,
  SEAT_SEGMENTS,
  type SeatOption,
} from './data';
import { Reveal } from './reveal';

const SEAT_TOUR: SeatOption[] = ['25', '5', DEFAULT_SEATS];

const TOUR_STEP_MS = 2400;

export function Offer() {
  const [seats, setSeats] = useState<SeatOption>(DEFAULT_SEATS);
  const tourSteps = SEAT_TOUR.map((value) => ({
    after: TOUR_STEP_MS,
    run: () => setSeats(value),
  }));
  const { ref } = useAutoplay(tourSteps, {
    loopAfter: TOUR_STEP_MS,
    onReset: () => setSeats(DEFAULT_SEATS),
  });
  const total = Number(seats) * OFFER.seatPrice;

  return (
    <section
      id={PRICING_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-5xl'
        groupClassName='grid items-center gap-8 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16'
      >
        <SettleItem className='flex max-w-xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {OFFER.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {OFFER.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] grid gap-2 rounded-2xl p-2 @xl:grid-cols-2 @xl:p-3'
          >
            <div className='bg-card surface-brand flex flex-col justify-between gap-8 rounded-xl p-6'>
              <div className='flex flex-col gap-4'>
                <h3 className='text-lg font-semibold'>{OFFER.name}</h3>
                <p className='flex flex-wrap items-baseline gap-x-2'>
                  <span className='text-4xl font-semibold tabular-nums'>
                    ${OFFER.seatPrice}
                  </span>
                  <span className='text-muted-foreground text-sm'>
                    {OFFER.period}
                  </span>
                </p>
                <Segments
                  value={seats}
                  segments={SEAT_SEGMENTS}
                  onValueChange={setSeats}
                  label='Number of seats'
                />
                <div className='flex flex-col gap-0.5'>
                  <p className='text-muted-foreground text-xs'>
                    {OFFER.totalLabel}
                  </p>
                  <p className='text-2xl font-semibold tabular-nums'>
                    <MotionNumber value={total} prefix='$' />
                  </p>
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Button size='lg' nativeButton={false} render={<a href='#' />}>
                  {OFFER.action}
                </Button>
                <p className='text-muted-foreground text-xs'>{OFFER.after}</p>
              </div>
            </div>
            <div className='flex flex-col justify-between gap-6 p-4'>
              <dl className='flex flex-col'>
                {OFFER.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className='flex items-baseline justify-between gap-4 py-3 text-[13px]'
                  >
                    <dt className='text-muted-foreground'>{fact.label}</dt>
                    <dd className='text-end font-medium'>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className='text-muted-foreground text-xs'>{OFFER.note}</p>
            </div>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
