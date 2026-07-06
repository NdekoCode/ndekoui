'use client';

import { motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { INSTANT } from '@/registry/ndeko/lib/motion-presets';
import { Wash } from '@/registry/ndeko/ui/wash';

import { type BillingPeriod, type Plan, PLANS } from './data';
import { formatRate, MONEY_FORMAT, seatPriceOf } from './pricing-model';

const GLIDE: Transition = { type: 'spring', bounce: 0, duration: 0.45 };

function glideOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return GLIDE;
}

function currentOf(isFit: boolean) {
  if (isFit) {
    return 'true' as const;
  }
  return undefined;
}

type PlanColumnProps = {
  plan: Plan;
  period: BillingPeriod;
  fit: Plan;
  markerId: string;
  glide: Transition;
};

function PlanColumn({ plan, period, fit, markerId, glide }: PlanColumnProps) {
  const isFit = plan === fit;
  const seatPrice = seatPriceOf(plan, period);
  const extraHourPrice = formatRate(plan.pricePerExtraHour);

  return (
    <li
      aria-current={currentOf(isFit)}
      className='bg-foreground/[0.03] dark:bg-foreground/[0.04] relative isolate flex flex-col gap-3 rounded-xl p-4'
    >
      {isFit && (
        <motion.span
          layoutId={markerId}
          layoutDependency={fit.id}
          transition={glide}
          aria-hidden='true'
          className='surface-brand absolute inset-0 -z-10 rounded-xl'
        >
          <Wash />
          <span className='text-primary-ink absolute end-4 top-4 text-xs font-medium'>
            Fits
          </span>
        </motion.span>
      )}
      <h3 className='text-sm font-medium'>
        {plan.name}
        {isFit && <span className='sr-only'>, fits your numbers</span>}
      </h3>
      <p className='flex items-baseline gap-1.5'>
        <MotionNumber
          value={seatPrice}
          format={MONEY_FORMAT}
          className='text-2xl font-semibold'
        />
        <span className='text-muted-foreground text-xs'>per seat a month</span>
      </p>
      <ul className='text-muted-foreground flex flex-col gap-1 text-xs tabular-nums'>
        <li>{plan.includedHoursPerSeat} hours included per seat</li>
        <li>{extraHourPrice} per extra hour</li>
        <li>Up to {plan.maxSeats} seats</li>
      </ul>
    </li>
  );
}

type PlanColumnsProps = {
  period: BillingPeriod;
  fit: Plan;
  /** Unique to this block on the page, so two calculators never share a marker. */
  markerId: string;
};

/** The plans side by side, with one lifted marker that glides to the plan that fits. */
export function PlanColumns({ period, fit, markerId }: PlanColumnsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const glide = glideOf(shouldReduceMotion);

  return (
    <ul aria-label='Plans' className='grid gap-2 @xl:grid-cols-3'>
      {PLANS.map((plan) => (
        <PlanColumn
          key={plan.id}
          plan={plan}
          period={period}
          fit={fit}
          markerId={markerId}
          glide={glide}
        />
      ))}
    </ul>
  );
}
