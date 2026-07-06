'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { LAUNCH, LAUNCH_ANCHOR } from './data';
import { FlapDigit } from './flap-digit';
import { PopShape } from './pop-shape';
import { Reveal } from './reveal';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MAX_DAYS = 99;

type Parts = [days: number, hours: number, minutes: number, seconds: number];

function partsOf(now: number): Parts {
  if (now === 0) {
    return [0, 0, 0, 0];
  }
  const remaining = Math.max(LAUNCH.at - now, 0);
  const days = Math.min(Math.floor(remaining / DAY_MS), MAX_DAYS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((remaining % MINUTE_MS) / SECOND_MS);
  return [days, hours, minutes, seconds];
}

function spokenOf(parts: Parts) {
  const [days, hours, minutes] = parts;
  return `${days} days, ${hours} hours and ${minutes} minutes to the launch`;
}

function FlapUnit({ value, label }: { value: number; label: string }) {
  const tens = Math.floor(value / 10);
  const units = value % 10;

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='flex gap-1' aria-hidden='true'>
        <FlapDigit value={tens} />
        <FlapDigit value={units} />
      </div>
      <p className='text-muted-foreground text-xs'>{label}</p>
    </div>
  );
}

function Flaps() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const now = useNow(SECOND_MS, isInView);
  const parts = partsOf(now);
  const isOver = now >= LAUNCH.at;

  return (
    <div ref={ref} className='flex flex-col items-center gap-4'>
      <div
        role='timer'
        aria-label={spokenOf(parts)}
        className='flex justify-center gap-3 @sm:gap-5'
      >
        {LAUNCH.units.map((label, index) => (
          <FlapUnit key={label} value={parts[index]} label={label} />
        ))}
      </div>
      {isOver && (
        <p className='text-muted-foreground text-sm'>{LAUNCH.launched}</p>
      )}
    </div>
  );
}

export function Countdown() {
  return (
    <section
      id={LAUNCH_ANCHOR}
      className='relative overflow-x-clip px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <PopShape
        kind='circle'
        series={3}
        className='top-10 right-6 size-12 @3xl:top-20 @3xl:right-28 @3xl:size-16'
      />
      <PopShape
        kind='pill'
        series={2}
        delay={0.1}
        className='bottom-12 left-6 h-6 w-14 rotate-6 @3xl:bottom-24 @3xl:left-28 @3xl:h-8 @3xl:w-24'
      />
      <Reveal
        className='mx-auto max-w-3xl'
        groupClassName='flex flex-col items-center gap-8 text-center'
      >
        <SettleItem className='flex flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {LAUNCH.title}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-xl text-base text-pretty'>
            {LAUNCH.description}
          </p>
        </SettleItem>
        <SettleItem>
          <Flaps />
        </SettleItem>
        <SettleItem>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {LAUNCH.action}
            <ArrowRightIcon />
          </Button>
        </SettleItem>
      </Reveal>
    </section>
  );
}
