import { useId } from 'react';

import { CheckIcon, RefreshCcwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const PLANS = [
  { value: 'essential', label: 'Essential', price: '$4 per member, monthly' },
  { value: 'standard', label: 'Standard', price: '$19 per member, monthly' },
  {
    value: 'enterprise',
    label: 'Enterprise',
    price: '$32 per member, monthly',
  },
];

const FEATURES = [
  'Unlimited projects',
  'Exports without a watermark',
  'Unlimited members and free viewers',
  'Unlimited file uploads',
  'Refund within 7 days',
  'Advanced permissions',
];

const ICON_TILE =
  'keycap-3d text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg';

const PLAN_CARD = [
  'relative flex w-full items-center gap-3 rounded-lg bg-card px-3.5 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Dialog18() {
  const id = useId();

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Change plan
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col gap-4'>
          <span aria-hidden='true' className={ICON_TILE}>
            <RefreshCcwIcon className='size-5' />
          </span>
          <DialogHeader>
            <DialogTitle>Change your plan</DialogTitle>
            <DialogDescription>
              The new price applies from your next invoice.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-5'>
          <RadioGroup
            defaultValue='standard'
            aria-label='Plan'
            className='gap-2'
          >
            {PLANS.map((plan) => {
              const itemId = `${id}-${plan.value}`;
              const descriptionId = `${itemId}-description`;

              return (
                <div key={plan.value} className={PLAN_CARD}>
                  <RadioGroupItem
                    value={plan.value}
                    id={itemId}
                    aria-describedby={descriptionId}
                    className='order-1 after:absolute after:inset-0'
                  />
                  <div className='grid grow gap-1.5'>
                    <Label htmlFor={itemId}>{plan.label}</Label>
                    <p
                      id={descriptionId}
                      className='text-muted-foreground text-xs tabular-nums'
                    >
                      {plan.price}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
          <div className='flex flex-col gap-3'>
            <p className='text-foreground text-[13px] font-medium'>
              Every paid plan includes:
            </p>
            <ul className='text-muted-foreground flex flex-col gap-2 text-[13px]'>
              {FEATURES.map((feature) => (
                <li key={feature} className='flex gap-2'>
                  <CheckIcon className='text-primary-ink mt-0.5 size-4 shrink-0' />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant='outline' size='lg' />}>
              Cancel
            </DialogClose>
            <DialogClose render={<Button size='lg' />}>Change plan</DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
