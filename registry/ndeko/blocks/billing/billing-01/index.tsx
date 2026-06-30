'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  MONEY_FORMAT,
  MONEY_LOCALE,
  daysLabelOf,
  formatWholeMoney,
  onDemandTotal,
  type SpendCap,
} from './billing-model';
import { INITIAL_CAP, PLAN } from './data';
import { SpendCapCard } from './spend-cap';
import { UsageMeters } from './usage-meters';

const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

/** What the next invoice adds on top of the plan: everything spent, or the cap when it is lower. */
function chargedOnDemandOf(cap: SpendCap, spent: number) {
  if (!cap.isCapped) {
    return spent;
  }
  return Math.min(spent, cap.amount);
}

export default function Billing01() {
  const [cap, setCap] = useState<SpendCap>(INITIAL_CAP);
  const spent = onDemandTotal();
  const chargedOnDemand = chargedOnDemandOf(cap, spent);
  const estimate = PLAN.monthlyPrice + chargedOnDemand;
  const planPrice = formatWholeMoney(PLAN.monthlyPrice);
  const resetsIn = daysLabelOf(PLAN.resetsInDays);

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10'>
        <header className='flex flex-col gap-1'>
          <p className='text-muted-foreground text-xs'>{PLAN.workspace}</p>
          <h1 className='text-lg font-semibold text-balance'>
            Usage and billing
          </h1>
        </header>
        <section
          aria-label='Next invoice'
          className={cn(
            CARD_SURFACE,
            'flex flex-wrap items-end justify-between gap-x-6 gap-y-3 p-4 sm:p-5'
          )}
        >
          <div className='flex flex-col gap-1'>
            <p className='text-muted-foreground text-xs'>
              Next invoice, {PLAN.renewsOn}
            </p>
            <MotionNumber
              value={estimate}
              locale={MONEY_LOCALE}
              format={MONEY_FORMAT}
              className='text-2xl leading-8 font-semibold'
            />
            <p className='text-muted-foreground text-xs tabular-nums'>
              {PLAN.name} {planPrice}, on demand{' '}
              <MotionNumber
                value={chargedOnDemand}
                locale={MONEY_LOCALE}
                format={MONEY_FORMAT}
              />
            </p>
          </div>
          <p className='text-muted-foreground text-xs'>
            Usage resets in {resetsIn} · Illustrative figures
          </p>
        </section>
        <section
          aria-labelledby='billing-01-usage'
          className={cn(CARD_SURFACE, 'flex flex-col gap-5 p-4 sm:p-5')}
        >
          <h2 id='billing-01-usage' className='text-sm font-medium'>
            This month
          </h2>
          <UsageMeters />
        </section>
        <section
          aria-label='On-demand spending'
          className={cn(CARD_SURFACE, 'p-4 sm:p-5')}
        >
          <SpendCapCard cap={cap} spent={spent} onCapChange={setCap} />
        </section>
      </div>
    </div>
  );
}
