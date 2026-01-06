import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const PLANS = [
  {
    value: 'starter',
    label: 'Starter',
    note: '3 projects',
    description: 'For one person trying things out.',
  },
  {
    value: 'team',
    label: 'Team',
    note: 'Unlimited projects',
    description: 'Shared boards, guests and roles for a whole team.',
  },
];

export default function Radio04() {
  const id = useId();

  return (
    <RadioGroup defaultValue='starter' aria-label='Plan' className='gap-6'>
      {PLANS.map((plan) => {
        const itemId = `${id}-${plan.value}`;
        const descriptionId = `${itemId}-description`;

        return (
          <div key={plan.value} className='flex items-start gap-2'>
            <RadioGroupItem
              value={plan.value}
              id={itemId}
              aria-describedby={descriptionId}
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
