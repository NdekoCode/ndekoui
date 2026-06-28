'use client';
import { useState } from 'react';
import { MotionNumber } from '@/components/core/motion-number';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

type Billing = 'monthly' | 'yearly';

type BillingPlan = {
  price: number;
  period: string;
  note: string;
};

const PLANS: Record<Billing, BillingPlan> = {
  monthly: {
    price: 24,
    period: 'per month',
    note: 'Cancel at the end of any month',
  },
  yearly: {
    price: 240,
    period: 'per year',
    note: 'Two months free compared with monthly billing',
  },
};

const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

function isBilling(value: unknown): value is Billing {
  return value === 'monthly' || value === 'yearly';
}

export function MotionNumberPrice() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const plan = PLANS[billing];

  function selectBilling(nextBilling: unknown) {
    if (isBilling(nextBilling)) {
      setBilling(nextBilling);
    }
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-xs flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-foreground text-sm font-medium'>Team plan</span>
        <Tabs value={billing} onValueChange={selectBilling}>
          <TabsList variant='segmented' aria-label='Billing period'>
            <TabsTab value='monthly'>Monthly</TabsTab>
            <TabsTab value='yearly'>Yearly</TabsTab>
          </TabsList>
        </Tabs>
      </div>
      <div className='flex flex-col gap-1'>
        <div className='flex items-baseline gap-1.5'>
          <MotionNumber
            value={plan.price}
            format={PRICE_FORMAT}
            className='text-foreground text-4xl font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>
            {plan.period}
          </span>
        </div>
        <p className='text-muted-foreground text-xs'>{plan.note}</p>
      </div>
    </div>
  );
}
