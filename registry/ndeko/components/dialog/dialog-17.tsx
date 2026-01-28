'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { usePaymentInputs } from 'react-payment-inputs';
import images, { type CardImages } from 'react-payment-inputs/images';

import {
  CreditCardIcon,
  PlusIcon,
  StoreIcon,
} from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type BillingPlan = {
  value: string;
  label: string;
  price: string;
  badge?: string;
};

const BILLING_PLANS: BillingPlan[] = [
  { value: 'monthly', label: 'Monthly', price: '$32 per month' },
  {
    value: 'yearly',
    label: 'Yearly',
    price: '$320 per year',
    badge: '2 months free',
  },
];

const CARD_IMAGES = images as unknown as CardImages;

const ICON_TILE =
  'keycap-3d text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg';

const PLAN_TILE = [
  'relative flex cursor-pointer flex-col gap-1 rounded-lg bg-card px-3.5 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

const FIELD_REVEAL_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.2, 0, 0, 1],
};

const FIELD_REVEAL_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

export default function Dialog17() {
  const id = useId();
  const nameId = `${id}-name`;
  const cardLabelId = `${id}-card`;
  const couponId = `${id}-coupon`;
  const [isCouponShown, setIsCouponShown] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const couponInputRef = useRef<HTMLInputElement>(null);
  const {
    meta,
    getCardNumberProps,
    getExpiryDateProps,
    getCVCProps,
    getCardImageProps,
  } = usePaymentInputs();
  const hasCardType = Boolean(meta.cardType);

  useEffect(() => {
    if (isCouponShown) {
      couponInputRef.current?.focus();
    }
  }, [isCouponShown]);

  function showCoupon() {
    setIsCouponShown(true);
  }

  function updateCouponCode(event: React.ChangeEvent<HTMLInputElement>) {
    setCouponCode(event.currentTarget.value);
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Check out
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col gap-4'>
          <span aria-hidden='true' className={ICON_TILE}>
            <StoreIcon className='size-5' />
          </span>
          <DialogHeader>
            <DialogTitle>Confirm and pay</DialogTitle>
            <DialogDescription>
              Pay securely and cancel at any time.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-5'>
          <div className='flex flex-col gap-4'>
            <RadioGroup
              defaultValue='yearly'
              aria-label='Billing period'
              className='grid-cols-2 gap-2'
            >
              {BILLING_PLANS.map((plan) => (
                <label key={plan.value} className={PLAN_TILE}>
                  <RadioGroupItem value={plan.value} className='sr-only' />
                  <span className='flex items-start justify-between gap-2'>
                    <span className='text-foreground text-[13px] font-medium'>
                      {plan.label}
                    </span>
                    {plan.badge && (
                      <Badge variant='success'>{plan.badge}</Badge>
                    )}
                  </span>
                  <span className='text-muted-foreground text-[13px] tabular-nums'>
                    {plan.price}
                  </span>
                </label>
              ))}
            </RadioGroup>
            <div className='grid gap-2'>
              <Label htmlFor={nameId}>Name on card</Label>
              <Input
                id={nameId}
                autoComplete='cc-name'
                placeholder='Amara Okafor'
                required
              />
            </div>
            <div
              role='group'
              aria-labelledby={cardLabelId}
              className='grid gap-2'
            >
              <span
                id={cardLabelId}
                className='text-foreground text-[13px] leading-none font-medium'
              >
                Card details
              </span>
              <div>
                <div className='relative focus-within:z-10'>
                  <Input
                    {...getCardNumberProps()}
                    className='peer rounded-b-none pe-9 shadow-none [direction:inherit]'
                  />
                  <span className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 peer-disabled:opacity-50'>
                    {hasCardType && (
                      <svg
                        className='overflow-hidden rounded-sm'
                        {...getCardImageProps({ images: CARD_IMAGES })}
                        width={20}
                      />
                    )}
                    {!hasCardType && <CreditCardIcon className='size-4' />}
                  </span>
                </div>
                <div className='-mt-px flex'>
                  <div className='min-w-0 flex-1 focus-within:z-10'>
                    <Input
                      {...getExpiryDateProps()}
                      className='rounded-e-none rounded-t-none shadow-none [direction:inherit]'
                    />
                  </div>
                  <div className='-ms-px min-w-0 flex-1 focus-within:z-10'>
                    <Input
                      {...getCVCProps()}
                      className='rounded-s-none rounded-t-none shadow-none [direction:inherit]'
                    />
                  </div>
                </div>
              </div>
            </div>
            {!isCouponShown && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='-ms-2.5 w-fit'
                onClick={showCoupon}
              >
                <PlusIcon className='opacity-60' />
                Add coupon
              </Button>
            )}
            <AnimatePresence initial={false}>
              {isCouponShown && (
                <motion.div
                  key='coupon'
                  variants={FIELD_REVEAL_VARIANTS}
                  initial='hidden'
                  animate='shown'
                  transition={FIELD_REVEAL_TRANSITION}
                >
                  <div className='grid gap-2'>
                    <Label htmlFor={couponId}>Coupon code</Label>
                    <Input
                      ref={couponInputRef}
                      id={couponId}
                      placeholder='SPRING-25'
                      value={couponCode}
                      onChange={updateCouponCode}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button type='button' size='lg' className='w-full'>
            Subscribe
          </Button>
        </form>
        <p className='text-muted-foreground text-center text-xs'>
          Payments are non-refundable. You can cancel at any time.
        </p>
      </DialogContent>
    </Dialog>
  );
}
