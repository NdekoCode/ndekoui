'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import {
  type BillingPeriod,
  DEFAULT_PERIOD,
  type Plan,
  PLANS,
  SECTION,
} from './data';
import { formatPrice, PlanPrice } from './plan-price';

const MONTHS_PER_YEAR = 12;

const PLAN_SURFACE =
  'bg-card hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

function isBillingPeriod(value: unknown): value is BillingPeriod {
  const isMonthly = value === 'monthly';
  const isYearly = value === 'yearly';
  return isMonthly || isYearly;
}

function monthlyFigureOf(plan: Plan, period: BillingPeriod) {
  if (period === 'yearly') {
    return plan.yearlyPrice / MONTHS_PER_YEAR;
  }
  return plan.monthlyPrice;
}

function billingNoteOf(plan: Plan, period: BillingPeriod) {
  if (period === 'yearly') {
    const total = formatPrice(plan.yearlyPrice);
    return `${total} billed once a year`;
  }
  return 'Billed every month';
}

function directionOf(period: BillingPeriod) {
  if (period === 'yearly') {
    return -1;
  }
  return 1;
}

function surfaceOf(plan: Plan) {
  if (plan.isFeatured) {
    return 'surface-brand';
  }
  return PLAN_SURFACE;
}

function actionVariantOf(plan: Plan) {
  if (plan.isFeatured) {
    return 'default' as const;
  }
  return 'outline' as const;
}

type PlanCardProps = {
  plan: Plan;
  period: BillingPeriod;
};

function PlanCard({ plan, period }: PlanCardProps) {
  const figure = monthlyFigureOf(plan, period);
  const note = billingNoteOf(plan, period);
  const direction = directionOf(period);
  const surface = surfaceOf(plan);
  const actionVariant = actionVariantOf(plan);

  return (
    <article
      className={cn('flex flex-col gap-6 rounded-xl p-6 sm:p-7', surface)}
    >
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-center justify-between gap-3'>
          <h3 className='text-sm font-medium'>{plan.name}</h3>
          {plan.tag && <Chip>{plan.tag}</Chip>}
        </div>
        <p className='text-muted-foreground text-[13px]'>{plan.description}</p>
      </div>
      <div aria-live='polite' className='flex flex-col gap-1'>
        <PlanPrice amount={figure} direction={direction} />
        <p className='text-muted-foreground text-xs tabular-nums'>{note}</p>
      </div>
      <Button
        size='lg'
        variant={actionVariant}
        nativeButton={false}
        render={<a href='#' />}
      >
        {plan.action}
      </Button>
      <ul className='flex flex-col gap-2.5 text-[13px]'>
        {plan.features.map((feature) => (
          <li key={feature} className='flex items-center gap-2.5'>
            <span
              aria-hidden='true'
              className='bg-foreground/25 size-1 shrink-0 rounded-full'
            />
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Pricing01() {
  const [period, setPeriod] = useState<BillingPeriod>(DEFAULT_PERIOD);

  function changePeriod(value: unknown) {
    if (isBillingPeriod(value)) {
      setPeriod(value);
    }
  }

  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-4xl flex-col gap-10'>
        <div className='grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end'>
          <div className='flex flex-col gap-3'>
            <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground max-w-lg text-base text-pretty'>
              {SECTION.description}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Tabs value={period} onValueChange={changePeriod}>
              <TabsList variant='segmented' aria-label='Billing period'>
                <TabsTab value='monthly'>Monthly</TabsTab>
                <TabsTab value='yearly'>Yearly</TabsTab>
              </TabsList>
            </Tabs>
            <Chip color='var(--muted-foreground)'>{SECTION.yearlyNote}</Chip>
          </div>
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>
        <p className='text-muted-foreground text-xs'>{SECTION.footnote}</p>
      </div>
    </section>
  );
}
