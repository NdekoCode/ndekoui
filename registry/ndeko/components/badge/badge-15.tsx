'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { useHover } from './_parts/use-hover';

function wholeUnitsOf(currency: string): Intl.NumberFormatOptions {
  return { style: 'currency', currency, maximumFractionDigits: 0 };
}

export type PricePillProps = {
  /** What the plan costs for the period, in whole units of the currency. The figures roll when it changes. */
  amount: number;
  /** What the amount covers, said under the pill: "Billed monthly". Only the words that change roll. */
  caption: string;
  /** An ISO 4217 code, such as USD or EUR. */
  currency?: string;
  locale?: Intl.LocalesArgument;
  className?: string;
};

/**
 * A pill with a price in it and the period under it. When the amount changes each figure rolls to
 * its new value in the direction of the change while the pill grows or shrinks to the width of the
 * figures, and in the caption only the words that changed roll. Nothing runs between two changes.
 */
export function PricePill({
  amount,
  caption,
  currency = 'USD',
  locale = 'en-US',
  className,
}: PricePillProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <span className='bg-primary/10 text-primary-ink inline-flex h-11 items-center rounded-full px-5 text-2xl font-semibold'>
        <AnimatedSize
          as='span'
          axis='width'
          contentClassName='flex items-baseline'
        >
          <MotionNumber
            value={amount}
            locale={locale}
            format={wholeUnitsOf(currency)}
            className='leading-8'
          />
        </AnimatedSize>
      </span>
      <p className='text-muted-foreground flex text-xs'>
        <WordRoll text={caption} value={amount} />
      </p>
    </div>
  );
}

type Period = 'monthly' | 'yearly';

const PERIODS: Segment<Period>[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

/** A year costs ten months, so a digit comes and goes with the change and the pill has a width to follow. */
const AMOUNTS: Record<Period, number> = {
  monthly: 24,
  yearly: 240,
};

const CAPTIONS: Record<Period, string> = {
  monthly: 'Billed monthly',
  yearly: 'Billed yearly',
};

const SPOKEN_AMOUNTS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Long enough in each period for the figures to land and be read before they roll again. */
const MONTHLY_HOLD_MS = 1800;

const YEARLY_HOLD_MS = 3000;

const RESTART_HOLD_MS = 1500;

function announcementOf(period: Period) {
  const amount = SPOKEN_AMOUNTS.format(AMOUNTS[period]);
  const caption = CAPTIONS[period].toLowerCase();
  return `${amount}, ${caption}`;
}

export default function Badge15() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [announcement, setAnnouncement] = useState('');
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: MONTHLY_HOLD_MS, run: () => setPeriod('yearly') },
    { after: YEARLY_HOLD_MS, run: () => setPeriod('monthly') },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: RESTART_HOLD_MS,
    onReset: () => setPeriod('monthly'),
    isEnabled: !isHovered,
  });

  useKeptHeight(ref);

  function choose(next: Period) {
    setPeriod(next);
    setAnnouncement(announcementOf(next));
  }

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-5'
      {...hoverHandlers}
    >
      <PricePill amount={AMOUNTS[period]} caption={CAPTIONS[period]} />
      <div className='flex flex-col items-center gap-2'>
        <Segments
          value={period}
          segments={PERIODS}
          onValueChange={choose}
          label='Billing period'
        />
        <p className='text-muted-foreground text-xs'>Illustrative prices</p>
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
