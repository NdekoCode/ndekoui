import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const PLANS = [
  {
    value: 'starter',
    label: 'Starter',
    note: 'Free',
    description: 'Three projects and help from the community.',
  },
  {
    value: 'pro',
    label: 'Pro',
    note: '$12 per seat',
    description: 'Unlimited projects and priority support.',
  },
];

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Radio08() {
  const id = useId();

  return (
    <RadioGroup
      defaultValue='starter'
      aria-label='Plan'
      className='w-full gap-2'
    >
      {PLANS.map((plan) => {
        const itemId = `${id}-${plan.value}`;
        const descriptionId = `${itemId}-description`;

        return (
          <div key={plan.value} className={CHOICE_CARD}>
            <RadioGroupItem
              value={plan.value}
              id={itemId}
              aria-describedby={descriptionId}
              className='order-1 after:absolute after:inset-0'
            />
            <div className='grid grow gap-1.5'>
              <Label htmlFor={itemId}>
                {plan.label}{' '}
                <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
                  ({plan.note})
                </span>
              </Label>
              <p id={descriptionId} className='text-muted-foreground text-xs'>
                {plan.description}
              </p>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
