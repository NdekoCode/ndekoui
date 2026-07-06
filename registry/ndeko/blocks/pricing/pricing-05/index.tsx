'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { type Segment, Segments } from '@/registry/ndeko/ui/segments';
import { Wash } from '@/registry/ndeko/ui/wash';

import { type BillingPeriod, PLAN, SECTION } from './data';
import { PatternFrame, type PatternKind } from './pattern-frame';

const MONTHS_PER_YEAR = 12;

const PERIODS: Segment<BillingPeriod>[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const PERIOD_ORDER: Record<BillingPeriod, number> = {
  monthly: 0,
  yearly: 1,
};

const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', PRICE_FORMAT);

const LOOP_AFTER_MS = 2000;

const NO_STEPS: AutoplayStep[] = [];

function monthlyFigureOf(period: BillingPeriod) {
  if (period === 'yearly') {
    return PLAN.yearlyPrice / MONTHS_PER_YEAR;
  }
  return PLAN.monthlyPrice;
}

function billingNoteOf(period: BillingPeriod) {
  if (period === 'yearly') {
    const total = PRICE_FORMATTER.format(PLAN.yearlyPrice);
    return `Billed ${total} once a year`;
  }
  return 'Billed every month';
}

/** Without a switch the drift of the pattern is all the plan has to show. */
function stepsOf(hasBillingSwitch: boolean, switchSteps: AutoplayStep[]) {
  if (hasBillingSwitch) {
    return switchSteps;
  }
  return NO_STEPS;
}

/** An empty script that loops would wake the piece for nothing at every round. */
function loopAfterOf(hasBillingSwitch: boolean) {
  if (hasBillingSwitch) {
    return LOOP_AFTER_MS;
  }
  return undefined;
}

function announcementOf(period: BillingPeriod) {
  const figure = monthlyFigureOf(period);
  const price = PRICE_FORMATTER.format(figure);
  const note = billingNoteOf(period);
  return `${price} a month. ${note}.`;
}

export type Pricing05Props = {
  /** The hairline pattern drawn around the plan. */
  pattern?: PatternKind;
  /** Without it the plan shows its monthly price only. */
  hasBillingSwitch?: boolean;
};

export default function Pricing05({
  pattern = 'zigzag',
  hasBillingSwitch = true,
}: Pricing05Props) {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [announcement, setAnnouncement] = useState('');
  const figure = monthlyFigureOf(period);
  const note = billingNoteOf(period);
  const periodOrder = PERIOD_ORDER[period];

  /** Only a person's choice is said: the demonstration moves the same switch in silence. */
  function changePeriod(next: BillingPeriod) {
    setPeriod(next);
    setAnnouncement(announcementOf(next));
  }

  function startOver() {
    setPeriod('monthly');
  }

  const switchSteps: AutoplayStep[] = [
    { after: 2600, run: () => setPeriod('yearly') },
    { after: 3400, run: () => setPeriod('monthly') },
  ];
  const steps = stepsOf(hasBillingSwitch, switchSteps);
  const loopAfter = loopAfterOf(hasBillingSwitch);
  const { ref } = useAutoplay<HTMLDivElement>(steps, {
    loopAfter,
    onReset: startOver,
  });

  return (
    <section className='@container'>
      <div
        ref={ref}
        className='mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24'
      >
        <div className='flex max-w-xl flex-col items-center gap-3 text-center'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.description}
          </p>
        </div>
        <PatternFrame pattern={pattern} className='w-full max-w-xl'>
          <article className='surface-brand relative isolate flex flex-col gap-6 rounded-xl p-6 @md:p-7'>
            <Wash />
            <div className='flex items-center gap-3'>
              <CompanyMark seed={PLAN.product} size='lg' />
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h3 className='text-sm font-medium'>{PLAN.product}</h3>
                <p className='text-muted-foreground text-xs text-pretty'>
                  {PLAN.description}
                </p>
              </div>
            </div>
            {hasBillingSwitch && (
              <div className='flex flex-wrap items-center gap-2'>
                <Segments
                  value={period}
                  segments={PERIODS}
                  onValueChange={changePeriod}
                  label='Billing period'
                />
                <Badge variant='secondary'>{PLAN.yearlyNote}</Badge>
              </div>
            )}
            <div className='flex flex-col gap-1'>
              <p className='flex items-baseline gap-1.5'>
                <MotionNumber
                  value={figure}
                  format={PRICE_FORMAT}
                  className='text-5xl font-semibold'
                />
                <span className='text-muted-foreground text-[13px]'>
                  per month
                </span>
              </p>
              <p className='text-muted-foreground text-xs tabular-nums'>
                <WordRoll text={note} value={periodOrder} />
              </p>
            </div>
            <Button size='lg' nativeButton={false} render={<a href='#' />}>
              {PLAN.action}
            </Button>
            <ul className='flex flex-col gap-2.5 text-[13px]'>
              {PLAN.features.map((feature) => (
                <li key={feature} className='flex items-center gap-2.5'>
                  <span
                    aria-hidden='true'
                    className='bg-foreground/25 size-1 shrink-0 rounded-full'
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <p className='text-muted-foreground text-xs text-pretty'>
              {PLAN.trial}
            </p>
          </article>
        </PatternFrame>
        <p className='text-muted-foreground text-center text-xs'>
          {SECTION.footnote}
        </p>
      </div>
      <LiveRegion message={announcement} />
    </section>
  );
}
