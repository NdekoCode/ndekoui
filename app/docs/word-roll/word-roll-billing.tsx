'use client';
import { useState } from 'react';
import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

type Billing = 'monthly' | 'yearly';

type BillingPlan = {
  monthlyFigure: number;
  note: string;
};

const BILLINGS: Billing[] = ['monthly', 'yearly'];

const PLANS: Record<Billing, BillingPlan> = {
  monthly: {
    monthlyFigure: 16,
    note: 'Billed every month',
  },
  yearly: {
    monthlyFigure: 12,
    note: 'Billed $144 once a year',
  },
};

const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

function isBilling(value: unknown): value is Billing {
  return BILLINGS.some((billing) => billing === value);
}

export function WordRollBilling() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const plan = PLANS[billing];
  const billingOrder = BILLINGS.indexOf(billing);

  function selectBilling(nextBilling: unknown) {
    if (isBilling(nextBilling)) {
      setBilling(nextBilling);
    }
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-xs flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-foreground text-sm font-medium'>Studio plan</span>
        <Tabs value={billing} onValueChange={selectBilling}>
          <TabsList variant='segmented' aria-label='Billing period'>
            <TabsTab value='monthly'>Monthly</TabsTab>
            <TabsTab value='yearly'>Yearly</TabsTab>
          </TabsList>
        </Tabs>
      </div>
      <div aria-live='polite' className='flex flex-col gap-1'>
        <p className='flex items-baseline gap-1.5'>
          <MotionNumber
            value={plan.monthlyFigure}
            format={PRICE_FORMAT}
            className='text-foreground text-4xl font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>per month</span>
        </p>
        <WordRoll
          text={plan.note}
          value={billingOrder}
          className='text-muted-foreground text-xs'
        />
      </div>
    </div>
  );
}
