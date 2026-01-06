import { useId } from 'react';

import { Badge } from '@/registry/ndeko/ui/badge';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type Plan = {
  value: string;
  label: string;
  price: string;
  isPopular?: boolean;
};

const PLANS: Plan[] = [
  { value: 'hobby', label: 'Hobby', price: '$9/mo' },
  { value: 'plus', label: 'Plus', price: '$29/mo', isPopular: true },
  { value: 'team', label: 'Team', price: '$49/mo' },
  { value: 'enterprise', label: 'Enterprise', price: 'Custom' },
];

const PLAN_LIST =
  'gap-0 rounded-xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border hairline-divide-y divide-border';

const PLAN_ROW = [
  'relative flex items-center justify-between gap-2 px-4 py-3.5 hairline-ring ring-transparent first:rounded-t-xl last:rounded-b-xl transition-[box-shadow] duration-150',
  'has-data-checked:z-10 has-data-checked:border-transparent has-data-checked:shadow-[0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Radio15() {
  const id = useId();
  const captionId = `${id}-caption`;

  return (
    <div className='flex w-full flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        Choose a plan
      </span>
      <RadioGroup
        defaultValue='plus'
        aria-labelledby={captionId}
        className={PLAN_LIST}
      >
        {PLANS.map((plan) => {
          const itemId = `${id}-${plan.value}`;
          const priceId = `${itemId}-price`;

          return (
            <div key={plan.value} className={PLAN_ROW}>
              <div className='flex items-center gap-2'>
                <RadioGroupItem
                  value={plan.value}
                  id={itemId}
                  aria-describedby={priceId}
                  className='after:absolute after:inset-0'
                />
                <Label htmlFor={itemId}>
                  {plan.label}
                  {plan.isPopular && <Badge>Popular</Badge>}
                </Label>
              </div>
              <span
                id={priceId}
                className='text-muted-foreground text-xs tabular-nums'
              >
                {plan.price}
              </span>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
