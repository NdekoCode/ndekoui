import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const BILLING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function Radio03() {
  const id = useId();

  return (
    <RadioGroup
      defaultValue='quarterly'
      disabled
      aria-label='Billing cycle'
      className='group'
    >
      {BILLING_OPTIONS.map((option) => {
        const itemId = `${id}-${option.value}`;

        return (
          <div key={option.value} className='flex items-center gap-2'>
            <RadioGroupItem value={option.value} id={itemId} />
            <Label htmlFor={itemId}>{option.label}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
