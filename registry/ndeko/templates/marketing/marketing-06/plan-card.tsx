'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Wash } from '@/registry/ndeko/ui/wash';

import type { Plan } from './pricing-data';
import {
  costOf,
  formatPrice,
  formatRate,
  formatVolume,
  PRICE_FORMAT,
} from './volume-model';

const RESTING_SURFACE =
  'bg-card hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

const LIFTED_SURFACE = 'surface-brand -translate-y-1';

const CHIP_SHOWN = { opacity: 1, scale: 1 };

const CHIP_HIDDEN = { opacity: 0, scale: 0.95 };

const CHIP_FADE = { opacity: 0 };

const CHIP_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

function surfaceOf(isCheapest: boolean) {
  if (isCheapest) {
    return LIFTED_SURFACE;
  }
  return RESTING_SURFACE;
}

function actionVariantOf(isCheapest: boolean) {
  if (isCheapest) {
    return 'default' as const;
  }
  return 'outline' as const;
}

function chipHiddenOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return CHIP_FADE;
  }
  return CHIP_HIDDEN;
}

type PlanCardProps = {
  plan: Plan;
  volume: number;
  isCheapest: boolean;
};

/** One plan priced for the volume of the sentence; the cheapest one lifts out of the row. */
export function PlanCard({ plan, volume, isCheapest }: PlanCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const cost = costOf(plan, volume);
  const price = Math.round(cost);
  const basePrice = formatPrice(plan.basePrice);
  const included = formatVolume(plan.includedLines);
  const rate = formatRate(plan.pricePerThousand);
  const chipHidden = chipHiddenOf(shouldReduceMotion);

  return (
    <article
      className={cn(
        'relative isolate flex flex-col gap-5 rounded-xl p-5 transition-[translate,box-shadow] duration-300 ease-(--ease-out-strong)',
        surfaceOf(isCheapest)
      )}
    >
      <Wash isShown={isCheapest} />
      <div className='flex flex-col gap-1'>
        <div className='flex min-h-5 items-center justify-between gap-2'>
          <h3 className='text-sm font-medium'>{plan.name}</h3>
          <AnimatePresence initial={false}>
            {isCheapest && (
              <motion.span
                key='cheapest'
                initial={chipHidden}
                animate={CHIP_SHOWN}
                exit={chipHidden}
                transition={CHIP_TRANSITION}
                className='inline-flex'
              >
                <Chip>Cheapest for you</Chip>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {plan.summary}
        </p>
      </div>
      <p className='flex items-baseline gap-1.5'>
        <MotionNumber
          value={price}
          format={PRICE_FORMAT}
          className='text-4xl font-semibold'
        />
        <span className='text-muted-foreground text-[13px]'>a month</span>
      </p>
      <ul className='text-muted-foreground flex flex-col gap-1 text-xs tabular-nums'>
        <li>{basePrice} base price</li>
        <li>{included} bank lines included</li>
        <li>{rate} per 1,000 after that</li>
      </ul>
      <Button
        size='lg'
        variant={actionVariantOf(isCheapest)}
        nativeButton={false}
        render={<a href='#' />}
        className='mt-auto'
      >
        {plan.action}
      </Button>
    </article>
  );
}
